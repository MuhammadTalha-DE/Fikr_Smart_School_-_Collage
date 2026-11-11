const LessonPlan = require('../models/LessonPlan');
const CourseCoverage = require('../models/CourseCoverage');
const learningContinuityService = require('../services/learningContinuityService');

exports.getLessonPlans = async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    const plans = await LessonPlan.find(filter)
      .populate('teacher', 'userId')
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('linkedSyllabusUnits', 'title unitNumber')
      .sort({ weekNumber: 1, createdAt: -1 });
    res.json({ success: true, plans });
  } catch (err) {
    throw err;
  }
};

exports.createLessonPlan = async (req, res) => {
  try {
    const plan = await LessonPlan.create(req.body);
    await plan.populate('teacher class subject linkedSyllabusUnits');

    learningContinuityService.recordEvent({
      date: plan.date || plan.createdAt || new Date(),
      teacher: plan.teacher?._id || plan.teacher,
      classId: plan.class?._id || plan.class,
      subject: plan.subject?._id || plan.subject,
      source: 'lesson_plan',
      increments: {
        lessonPlansPrepared: 1,
        resourcesShared: Array.isArray(plan.materials) ? plan.materials.length : 0,
        liveSessionsScheduled: Array.isArray(plan.activities) && plan.activities.length > 0 ? 1 : 0,
      },
      setFields: {
        deliveryMode: 'in_person',
      },
      metadata: {
        lessonPlanId: plan._id,
        weekNumber: plan.weekNumber,
      },
    }).catch((error) => {
      console.error('Learning continuity lesson-plan log failed:', error.message);
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateLessonPlan = async (req, res) => {
  try {
    const plan = await LessonPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('teacher class subject linkedSyllabusUnits');
    if (!plan) return res.status(404).json({ message: 'Lesson plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteLessonPlan = async (req, res) => {
  try {
    const plan = await LessonPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Lesson plan not found' });
    res.json({ success: true, message: 'Lesson plan deleted' });
  } catch (err) {
    throw err;
  }
};

exports.completeLessonPlan = async (req, res) => {
  try {
    const plan = await LessonPlan.findByIdAndUpdate(
      req.params.id,
      { isCompleted: true },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    for (const unitId of plan.linkedSyllabusUnits) {
      let coverage = await CourseCoverage.findOne({
        teacher: plan.teacher,
        class: plan.class,
        subject: plan.subject,
        syllabusUnit: unitId,
      });
      if (!coverage) {
        coverage = new CourseCoverage({
          teacher: plan.teacher,
          class: plan.class,
          subject: plan.subject,
          syllabusUnit: unitId,
          coveredTopics: [],
        });
      }

      const unit = await require('../models/SyllabusUnit').findById(unitId);
      if (unit) {
        const newTopics = unit.topics.map((topic) => ({
          name: topic.name,
          coveredDate: new Date(),
          remarks: '',
        }));
        coverage.coveredTopics = [
          ...coverage.coveredTopics.filter(
            (coveredTopic) => !newTopics.some((newTopic) => newTopic.name === coveredTopic.name)
          ),
          ...newTopics,
        ];
      }
      coverage.status = 'completed';
      coverage.coveragePercentage = 100;
      await coverage.save();
    }

    learningContinuityService.recordEvent({
      date: plan.date || new Date(),
      teacher: plan.teacher,
      classId: plan.class,
      subject: plan.subject,
      source: 'lesson_completion',
      increments: {
        lessonsCompleted: 1,
      },
      setFields: {
        deliveryMode: 'in_person',
      },
      metadata: {
        lessonPlanId: plan._id,
        completed: true,
      },
    }).catch((error) => {
      console.error('Learning continuity lesson-completion log failed:', error.message);
    });

    res.json({ success: true, plan });
  } catch (err) {
    throw err;
  }
};

