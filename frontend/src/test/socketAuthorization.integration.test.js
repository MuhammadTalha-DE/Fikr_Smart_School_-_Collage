// @vitest-environment node
import http from 'http';
import { io as createClient } from 'socket.io-client';
import { createRequire } from 'module';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const backendRequire = createRequire(new URL('../../../backend/package.json', import.meta.url));
const jwt = backendRequire('jsonwebtoken');
const socketServer = backendRequire('./socket/socketServer');
const User = backendRequire('./models/User');
const Teacher = backendRequire('./models/Teacher');
const Student = backendRequire('./models/Student');
const TransportAllocation = backendRequire('./models/TransportAllocation');
const Conversation = backendRequire('./models/Conversation');

const ADMIN = '507f1f77bcf86cd799439001';
const TEACHER = '507f1f77bcf86cd799439002';
const STUDENT = '507f1f77bcf86cd799439003';
const OTHER_STUDENT = '507f1f77bcf86cd799439004';
const CLASS_A = '507f1f77bcf86cd799439010';
const CLASS_B = '507f1f77bcf86cd799439011';
const STUDENT_RECORD = '507f1f77bcf86cd799439020';
const VEHICLE_A = '507f1f77bcf86cd799439030';
const CONVERSATION = '507f1f77bcf86cd799439040';

const roles = new Map([
  [ADMIN, 'admin'],
  [TEACHER, 'teacher'],
  [STUDENT, 'student'],
  [OTHER_STUDENT, 'student'],
]);

const query = (value) => ({
  select() { return this; },
  lean() { return Promise.resolve(value); },
});

let server;
let address;
let clients = [];

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);
const connect = (id, options = {}) => new Promise((resolve, reject) => {
  const client = createClient(address, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 2000,
    ...options,
    auth: options.auth || { token: tokenFor(id) },
  });
  clients.push(client);
  client.once('connect', () => resolve(client));
  client.once('connect_error', reject);
});
const nextEvent = (client, event, timeout = 1500) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeout);
  client.once(event, (payload) => { clearTimeout(timer); resolve(payload); });
});
const noEvent = async (client, event, duration = 120) => {
  let received = false;
  const listener = () => { received = true; };
  client.on(event, listener);
  await new Promise((resolve) => setTimeout(resolve, duration));
  client.off(event, listener);
  expect(received).toBe(false);
};
const acknowledge = (client, event, payload) => new Promise((resolve) => client.emit(event, payload, resolve));

describe('Socket.IO authorization integration', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'socket-test-secret';
    vi.spyOn(User, 'findById').mockImplementation((id) => query({ _id: id, role: roles.get(String(id)) }));
    vi.spyOn(Teacher, 'findOne').mockImplementation(() => query({ classes: [CLASS_A] }));
    vi.spyOn(Student, 'findOne').mockImplementation((filter) => query(
      String(filter.userId) === STUDENT
        ? { _id: STUDENT_RECORD, classId: CLASS_A }
        : null
    ));
    vi.spyOn(TransportAllocation, 'find').mockImplementation((filter) => query(
      String(filter.student) === STUDENT_RECORD ? [{ vehicle: VEHICLE_A }] : []
    ));
    vi.spyOn(Conversation, 'findOne').mockImplementation((filter) => query(
      String(filter._id) === CONVERSATION && String(filter.participants) === TEACHER
        ? { _id: CONVERSATION, participants: [TEACHER, STUDENT] }
        : null
    ));

    server = http.createServer();
    socketServer.initSocket(server);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    address = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    clients.forEach((client) => client.disconnect());
    await socketServer.closeSocket();
    vi.restoreAllMocks();
    delete process.env.JWT_SECRET;
  });

  it('rejects anonymous and invalid-token handshakes', async () => {
    await expect(connect(ADMIN, { auth: {} })).rejects.toThrow(/Authentication required/);
    await expect(connect(ADMIN, { auth: { token: 'not-a-jwt' } })).rejects.toThrow(/Authentication required/);
  });

  it('derives rooms from the verified identity and limits class subscriptions', async () => {
    const teacher = await connect(TEACHER);
    const attacker = await connect(OTHER_STUDENT);
    teacher.emit('join', { userId: ADMIN, role: 'admin', classIds: [CLASS_B] });
    const adminOnlyEvent = noEvent(teacher, 'dashboard:refresh');
    socketServer.getIO().to('role:admin').emit('dashboard:refresh', { shouldStayPrivate: true });
    await adminOnlyEvent;
    const result = await acknowledge(attacker, 'join:rooms', { classIds: [CLASS_A], modules: ['finance'] });
    expect(result.denied).toBe(2);

    const teacherReceived = nextEvent(teacher, 'class-event');
    const attackerDidNotReceive = noEvent(attacker, 'class-event');
    socketServer.getIO().to(`class:${CLASS_A}`).emit('class-event', { ok: true });
    await expect(teacherReceived).resolves.toEqual({ ok: true });
    await attackerDidNotReceive;
  });

  it('delivers personal notifications only to their authenticated user room', async () => {
    const student = await connect(STUDENT);
    const outsider = await connect(OTHER_STUDENT);
    const received = nextEvent(student, 'secure-notification:new');
    const notReceived = noEvent(outsider, 'secure-notification:new');
    socketServer.getIO().to(`user:${STUDENT}`).emit('secure-notification:new', { notice: 'private' });
    await expect(received).resolves.toEqual({ notice: 'private' });
    await notReceived;
  });

  it('authorizes typing by conversation membership and rejects forged message events', async () => {
    const teacher = await connect(TEACHER);
    const student = await connect(STUDENT);
    const outsider = await connect(OTHER_STUDENT);
    const typing = nextEvent(student, 'user-typing');
    const sent = await acknowledge(teacher, 'typing', {
      conversationId: CONVERSATION,
      recipientId: OTHER_STUDENT,
      userId: ADMIN,
      isTyping: true,
    });
    expect(sent.sent).toBe(true);
    await expect(typing).resolves.toMatchObject({ conversationId: CONVERSATION, userId: TEACHER, isTyping: true });

    const deniedTyping = await acknowledge(outsider, 'typing', { conversationId: CONVERSATION, recipientId: STUDENT });
    expect(deniedTyping.error).toMatch(/Not authorized/);
    const forgedMessage = await acknowledge(outsider, 'send-message', { recipientId: STUDENT, message: 'forged' });
    expect(forgedMessage.error).toMatch(/authenticated message API/);
  });

  it('allows an allocated student to join a vehicle room and denies another student', async () => {
    const student = await connect(STUDENT);
    const otherStudent = await connect(OTHER_STUDENT);
    await expect(acknowledge(student, 'join-vehicle-room', VEHICLE_A)).resolves.toEqual({ joined: true });
    await expect(acknowledge(otherStudent, 'join-vehicle-room', VEHICLE_A)).resolves.toMatchObject({ joined: false });

    const location = nextEvent(student, 'vehicle-location-update');
    const noLocation = noEvent(otherStudent, 'vehicle-location-update');
    socketServer.getIO().to(`vehicle-${VEHICLE_A}`).emit('vehicle-location-update', { vehicleId: VEHICLE_A });
    await expect(location).resolves.toEqual({ vehicleId: VEHICLE_A });
    await noLocation;
  });
});
