const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();

const {
  getTimetable,
  getAllTimetables,
  saveTimetable,
  deleteTimetable,
  getTeachersForSubject,
  copyTimetable,
  checkConflict,
  toggleStatus,
  getConflicts,
  generate,
  resolveConflict,
  clearAllTimetables,
  getRoomUtilizationDashboard,
  getTeacherWorkloadDashboard,
  getVersions,
  compareTimetableVersions,
  rollbackVersion,
  exportTimetableTemplate,
  importTimetableTemplate,
} = require('../controllers/timetableController');

router.get('/teachers/eligible', protect, getTeachersForSubject);

router.post('/copy', protect, authorize('admin'), copyTimetable);
router.post('/check-conflict', protect, authorize('admin'), checkConflict);
router.post('/generate', protect, authorize('admin'), generate);
router.post('/resolve-conflict', protect, authorize('admin'), resolveConflict);

router.get('/analytics/rooms', protect, authorize('admin'), getRoomUtilizationDashboard);
router.get('/analytics/teacher-workload', protect, authorize('admin'), getTeacherWorkloadDashboard);

router.get('/versions/:timetableId', protect, authorize('admin'), getVersions);
router.get('/versions/:leftVersionId/compare/:rightVersionId', protect, authorize('admin'), compareTimetableVersions);
router.post('/versions/:versionId/rollback', protect, authorize('admin'), rollbackVersion);

router.get('/templates/:timetableId/export', protect, authorize('admin'), exportTimetableTemplate);
router.post('/templates/import', protect, authorize('admin'), importTimetableTemplate);

router.delete('/clear-all', protect, authorize('admin'), clearAllTimetables);

router.get('/', protect, authorize('admin'), getAllTimetables);
router.get('/:classId', protect, getTimetable);
router.post('/', protect, authorize('admin'), saveTimetable);
router.delete('/:id', protect, authorize('admin'), deleteTimetable);
router.put('/:id/status', protect, authorize('admin'), toggleStatus);
router.get('/:id/conflicts', protect, authorize('admin'), getConflicts);

module.exports = router;
