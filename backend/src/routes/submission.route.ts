import authMiddleware from "@/middlewares/auth.middleware";
import { Form } from "@/models/Froms.model";
import { Submission } from "@/models/Submissin.model";
import { Router, type Request, type Response } from "express";
import { buildAnalyticsSeries, parseAnalyticsRange } from '@/utils/analyticsRange';

const router = Router();


router.post('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { responses, submitterEmail, uploadedImages } = req.body;

    const form = await Form.findOne({ _id: id });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Create submission
    const submission = new Submission({
      formId: form._id,
      responses: responses,
      submitterEmail,
      uploadedImages: uploadedImages || [],
      submittedAt: new Date(),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Save submission first
    await submission.save();

    // Update form submission stats (initialize if doesn't exist)
    if (!form.submissionStats) {
      form.submissionStats = {
        count: 0,
        lastSubmittedAt: undefined
      };
    }

    form.submissionStats.count = (form.submissionStats.count || 0) + 1;
    form.submissionStats.lastSubmittedAt = new Date();

    // Save form with updated stats
    await form.save();

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: {
        submissionId: submission._id
      }
    });
  } catch (error) {
    console.error('Submission error:', error);
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: 'Failed to create submission',
      message: err.message
    });
  }
})


router.get('/:formId/submissions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form || form.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const submissions = await Submission.find({ formId: req.params.formId })
      .sort({ submittedAt: -1 });

    return res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
      message: err.message
    });
  }
})

router.get('/:submissionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const form = await Form.findById(submission.formId);
    if (!form || form.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    return res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submission',
      message: err.message
    });
  }
})

// Get submission analytics (all user's forms)
router.get('/analytics/submissions-over-time', authMiddleware, async (req: Request, res: Response) => {
  try {
    const range = parseAnalyticsRange(req.query);
    const userForms = await Form.find({ userId: req.userId }).select('_id');
    const formIds = userForms.map(form => form._id);
    const buckets = await Submission.aggregate<{ _id: string; count: number }>([
      { $match: { formId: { $in: formIds }, submittedAt: { $gte: range.start, $lt: range.endExclusive } } },
      { $group: { _id: { $dateToString: { format: range.groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d', date: '$submittedAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const data = buildAnalyticsSeries(range, buckets);

    return res.json({
      success: true,
      data: {
        submissions: data,
        totalSubmissions: data.reduce((total, item) => total + item.count, 0),
        periodDays: range.periodDays,
        startDate: range.start.toISOString().slice(0, 10),
        endDate: new Date(range.endExclusive.getTime() - 86_400_000).toISOString().slice(0, 10),
        groupBy: range.groupBy
      }
    });
  } catch (error) {
    if (error instanceof RangeError) return res.status(400).json({ success: false, error: error.message });
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submission analytics',
      message: err.message
    });
  }
})

export default router;
