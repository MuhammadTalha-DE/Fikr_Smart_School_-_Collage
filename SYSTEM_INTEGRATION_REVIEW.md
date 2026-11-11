# System integration review

## Coverage

Reviewed the repository structure, frontend route registration and API client, backend route mounts and authorization patterns, role model and account creation, Socket.IO setup, deployment configuration, and the existing frontend/backend test layout. The system has separate React and Express packages, 80+ mounted API groups, role-specific dashboards, and service-backed modules for academics, finance, transport, hostel, safety, HR, inventory, general ledger, clinic, and operations.

This is a static integration review. It does not claim every page and every API workflow has been exercised against a live MongoDB instance.

## Changes made in this review

- The shared Axios client now survives malformed saved user JSON and can use the standalone `authToken` value. Previously, `JSON.parse()` could reject requests before they reached the server. See `frontend/src/services/api.js`.
- The public health response now reports a degraded state when MongoDB is disconnected. See `backend/app.js`.
- The admin System Monitor now checks API/database health separately from the admin data snapshot. See `frontend/src/pages/admin/AdminMonitor.jsx`.
- Added the `transport` role across the User model, admin account creation, frontend role validation, message search, and notification audiences. The backend already had transport-only routes and a transport dashboard, so this closes a real account-to-feature integration gap. See `backend/models/User.js`, `frontend/src/pages/admin/CreateUser.jsx`, `frontend/src/utils/validationSchemas.js`, `backend/controllers/messageController.js`, and `backend/services/notificationCenterService.js`.
- Socket.IO now requires a valid JWT and derives the user and role from the database. Personal, role, module, class, and vehicle subscriptions are scoped; class and vehicle access uses saved teacher, student, parent, and allocation records. Typing events require conversation membership, and socket message injection is disabled in favor of the authenticated REST message flow. Weather room joins use the verified role and alert events stay within target role rooms. See `backend/socket/socketServer.js`, `backend/socket/weatherSocketServer.js`, `frontend/src/hooks/useSocket.js`, `frontend/src/hooks/useWeatherSocket.js`, `frontend/src/socket/weatherSocket.js`, and `frontend/src/utils/socketAuth.js`.

## Remaining priorities

### 1. Expand system monitoring beyond the original dashboard aggregates

The new `/admin/monitor` page currently displays nine module snapshots from `/api/dashboard/admin`. The repository has separate service-backed overview endpoints for HR/payroll, inventory/procurement, general ledger, clinic, security gate, and operations, so these modules are not yet represented as independently monitored services. Some overview service methods load detailed records and perform broad queries, so adding them to a 30-second polling loop without a lightweight summary endpoint may create avoidable database load.

**Next step:** add a small admin-only system summary API using efficient counts and status checks for each module, define which checks indicate module availability versus business activity, and have the monitor display per-module health and last successful check time.

### 3. Finish role support consistently

Transport account creation and audience routing are now connected. The role still needs a single source of truth: role arrays are repeated in controllers, notification services, safety features, and frontend forms. `driver` also appears in transport authorization and HR service logic, but there is no driver account creation or driver dashboard flow in the current route table.

**Next step:** centralize supported roles and explicitly decide whether `driver` is a login role or a transport staff subtype. Apply the choice consistently to user creation, authorization, messaging, notifications, and dashboards.

### 4. Verify every UI route/API contract

The app has hundreds of pages and many separate services. Route presence alone does not prove that each page uses a mounted API path, that response envelopes match the page's expectations, or that each role can access the full workflow. The project has focused tests for several newer workflows, but broad coverage is not present for all modules.

**Next step:** generate a route-to-service-to-backend contract inventory and add role-based end-to-end checks for critical journeys: admission to student record, attendance to parent/student view, assessment to result, fee payment to ledger/report, transport allocation to parent view, hostel application to warden workflow, and notification creation to delivery/read state.

### 5. Make setup documentation match the repository

`README.md` describes a root-level `npm install` and `.env.example`, but the repository has separate package files under `frontend/` and `backend/` and no `.env.example` file. `DEPLOYMENT.md` gives the more accurate local startup steps. This can make a clean setup fail before the app starts.

**Next step:** update the README to the actual two-package/Docker setup and add a safe environment template containing variable names and non-secret examples only.

## Verification

- `git diff --check` and `node --check` on the changed backend files passed.
- The frontend production build completed successfully. Vite reported a warning that a parent `tsconfig.json` extends missing `@react-native/typescript-config`; the build still completed.
- The focused Socket.IO authorization integration suite passed all five scenarios: anonymous/invalid token rejection, identity/role spoof resistance and class scoping, personal notification isolation, conversation-scoped typing/message denial, and allocated versus unallocated vehicle access.
