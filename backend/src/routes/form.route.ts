import { Router } from "express";
import type { Request, Response } from "express";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { StructuredOutputParser } from "langchain/output_parsers"
import { z, ZodType } from "zod";


import { wrapSDK } from "langsmith/wrappers"
import { Form } from "@/models/Froms.model";
import authMiddleware from "@/middlewares/auth.middleware";
import { config } from "@/config";
import generateSlug from "@/utils/generateSlug";
import { nanoid } from "nanoid";
import { Submission } from "@/models/Submissin.model";
// Define Zod schema for form generation
const fieldZodSchema = z.object({
  fieldId: z.string().describe('Unique field identifier'),
  type: z.enum(['NAME', 'EMAIL', 'PHONE', 'ADDRESS', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'DATE', 'SIGNATURE', 'SINGLE_LINE', 'MULTI_LINE', 'MULTIPLE_CHOICE', 'GRID', 'FILE_UPLOAD', 'RATING']).describe('Field type'),
  displayName: z.string().describe('Label shown to user'),
  mand: z.boolean().default(false).describe('Is field mandatory'),
  choices: z.array(z.string()).optional().describe('Options for dropdown/radio/checkbox'),
  gridOptions: z.array(z.string()).optional().describe('Options for grid type fields'),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  placeholder: z.string().optional(),
});

const formGenerationSchema = z.object({
  formName: z.string().describe('Name of the form'),
  description: z.string().describe('Form description'),
  category: z.enum(['appointment', 'registration', 'order', 'application', 'feedback', 'survey', 'custom']),
  fields: z.array(fieldZodSchema).describe('Array of form fields'),
});

type FormGenerationType = z.infer<typeof formGenerationSchema>;

const initializeLLM = () => {
  return wrapSDK(new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
  }));
};


const router = Router();

router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  const { query } = req.body;
  const llm = initializeLLM();


  // Initialize structured output parser
  const parser = StructuredOutputParser.fromZodSchema(formGenerationSchema as any);
  const formatInstructions = parser.getFormatInstructions();
  // Construct prompt
  const prompt = `You are an expert form builder. Generate a structured form based on the following user request.
User Request:\n${query}\n\n${formatInstructions}

Guidelines:
- Make fields relevant to the request
- Mark important fields as mandatory (mand: true)
- Include appropriate field types for the use case
- Add validation rules where needed
- Ensure field displayNames are user-friendly
`;

  try {
    // Get response from LLM
    const response = await llm.call([
      {
        role: "user",
        content: prompt,
      },
    ]);
    // Parse the response
    const parsedOutput = await parser.parse(response.text) as FormGenerationType;


    if (!parsedOutput) {
      return res.status(404).json({ error: 'Failed to parse AI response' })
    }

    const slug = await generateSlug(parsedOutput.formName);

    const form = new Form({
      userId: req.userId,
      formName: parsedOutput.formName,
      description: parsedOutput.description,
      category: parsedOutput.category,
      slug,
      fields: parsedOutput.fields,
      generatedPrompt: query,
      sharing: {
        isPublic: false,
        shareToken: nanoid()
      }

    });

    await form.save();

    res.json({
      message: 'Form generated successfully',
      success: true,
      data: parsedOutput,
      formId: form._id,
    });
  } catch (error) {
    console.error('Error generating form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate form',
    });
  }

});

// update form
router.post('/:formId', authMiddleware, async (req: Request, res: Response) => {
  try {

    const { formName, description, fields } = req.body;

    const form = await Form.findOne({ _id: req.params.formId });
    if (!form || form.userId.toString() != req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    form.formName = formName || form.formName;
    form.description = description || form.description;
    form.fields = fields || form.fields;
    form.updatedAt = new Date();

    await form.save();

    res.status(200).json({
      form: form,
      message: 'Form updated Successfully',
    });
  } catch (error) {
    console.error('Error saving form:', error);
    res.status(500).json({
      error: 'Failed to save form',
    });
  }
})

// get user all forms
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const forms = (await Form.find({ userId })
      .select('-fields')
      .sort({ createdAt: -1 }))



    res.json({
      success: true,
      data: forms,
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forms',
    });
  }
});

// published form for all users
router.get('/public/:slug', async (req: Request, res: Response) => {

  try {
    const form = await Form.findOne({ slug: req.params.slug });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (!form.sharing?.isPublic) {
      return res.status(403).json({ message: 'Form is not publicly available' });
    }

    res.json(form);
  }
  catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message })
  }
})


router.get('/:formId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const form = await Form.findOne({ _id: req.params.formId });
    if (!form) {
      return res.status(404).json({ message: 'form is not found' });
    }

    if (form.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(form);
  } catch (error) {
    const err = error as Error
    return res.status(500).json({ error: err.message })
  }
})


router.patch('/:formId/publish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const form = await Form.findOne({ _id: req.params.formId });
    if (!form || form.userId.toString() != req.userId) {
      return res.status(403).json({ error: 'unauthorized' });
    }

    if (form.sharing) {
      form.sharing.isPublic = !form.sharing.isPublic;
      await form.save();
    }

    res.status(200).json({
      message: 'Form published',
      publicLink: `${config.frontendUrl}/form/${form.slug}`
    })

  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:formId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const form = await Form.findById({ _id: req.params.formId });

    if (!form || form?.userId.toString() != req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Form.deleteOne({ _id: req.params.formId })
    await Submission.deleteMany({ formId: req.params.formId });

    res.status(200).json({ message: 'Form deleted successfully' })
  } catch (error) {
    const err = error as Error
    res.status(500).json({ error: err.message });
  }
})

export default router;