import authMiddleware from "@/middlewares/auth.middleware";
import { Form } from "@/models/Froms.model";
import { Submission } from "@/models/Submissin.model";
import { Router, type Request, type Response } from "express";

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
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);

    // Get all forms belonging to the user
    const userForms = await Form.find({ userId: req.userId });
    const formIds = userForms.map(form => form._id);

    // Get submissions from the last X days for user's forms
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const submissions = await Submission.find({
      formId: { $in: formIds },
      submittedAt: { $gte: startDate }
    }).sort({ submittedAt: 1 });

    // Group submissions by date
    const submissionsByDate: { [key: string]: number } = {};

    // Initialize all dates with 0
    for (let i = 0; i < daysNum; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysNum - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      if (dateKey) {
        submissionsByDate[dateKey] = 0;
      }
    }

    // Count submissions per date
    submissions.forEach(submission => {
      const submittedAt = submission.submittedAt;
      if (submittedAt) {
        const dateKey = new Date(submittedAt).toISOString().split('T')[0];
        if (dateKey && dateKey in submissionsByDate) {
          submissionsByDate[dateKey] = submissionsByDate[dateKey]! + 1;
        }
      }
    });

    // Convert to array format
    const data = Object.entries(submissionsByDate).map(([date, count]) => ({
      date,
      count,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return res.json({
      success: true,
      data: {
        submissions: data,
        totalSubmissions: submissions.length,
        periodDays: daysNum
      }
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submission analytics',
      message: err.message
    });
  }
})

export default router;

