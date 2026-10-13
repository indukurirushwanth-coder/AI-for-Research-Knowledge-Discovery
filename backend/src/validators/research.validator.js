import { z } from 'zod';

export const askQuestionSchema = z.object({
  query: z.string().trim().min(2, 'Question must be at least 2 characters long'),
  documentIds: z.array(z.string()).optional()
});

export const comparePapersSchema = z.object({
  documentIds: z.array(z.string()).min(2, 'At least two document IDs must be selected for comparison')
});

export const synthesizeSchema = z.object({
  documentIds: z.array(z.string()).optional()
});

export default {
  askQuestionSchema,
  comparePapersSchema,
  synthesizeSchema
};
