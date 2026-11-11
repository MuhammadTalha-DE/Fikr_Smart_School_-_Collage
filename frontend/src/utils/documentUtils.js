export const getStudentName = (student) => student?.userId?.name || student?.name || 'N/A';

export const getGuardianName = (student) =>
  student?.parentId?.name ||
  student?.parent?.name ||
  student?.fatherName ||
  student?.parentName ||
  '';

export const formatStudentOption = (student) => {
  const name = getStudentName(student);
  const guardian = getGuardianName(student);
  const className = [student?.classId?.name, student?.classId?.section].filter(Boolean).join(' - ');
  const details = [
    className,
    student?.rollNumber ? `Roll: ${student.rollNumber}` : '',
    student?.admissionNumber ? `Adm: ${student.admissionNumber}` : '',
  ].filter(Boolean);

  return `${name}${guardian ? ` (${guardian})` : ''}${details.length ? ` - ${details.join(' - ')}` : ''}`;
};

export const formatTeacherOption = (teacher) => {
  const name = teacher?.userId?.name || teacher?.name || 'N/A';
  const employeeId = teacher?.employeeId ? ` (${teacher.employeeId})` : '';
  const subjects = Array.isArray(teacher?.subjects) && teacher.subjects.length
    ? ` - ${teacher.subjects.join(', ')}`
    : '';

  return `${name}${employeeId}${subjects}`;
};

export const filterStudents = (students, searchTerm) => {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return students;

  return students.filter(student => [
    getStudentName(student),
    getGuardianName(student),
    student?.rollNumber,
    student?.admissionNumber,
    student?.classId?.name,
    student?.classId?.section,
  ].some(value => String(value || '').toLowerCase().includes(term)));
};

export const downloadBase64Pdf = (base64, filename = 'document.pdf') => {
  if (!base64) return false;

  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};

export const downloadBlob = (blobData, filename = 'document.pdf') => {
  const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
