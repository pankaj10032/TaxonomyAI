// src/ai/flows/content-filtering.ts
'use server';
/**
 * @fileOverview A flow to filter irrelevant content from a document.
 *
 * - filterContent - A function that filters irrelevant content from a document.
 * - FilterContentInput - The input type for the filterContent function.
 * - FilterContentOutput - The return type for the filterContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterContentInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the document to be filtered.'),
});
export type FilterContentInput = z.infer<typeof FilterContentInputSchema>;

const FilterContentOutputSchema = z.object({
  filteredText: z
    .string()
    .describe('The filtered text content of the document.'),
});
export type FilterContentOutput = z.infer<typeof FilterContentOutputSchema>;

export async function filterContent(input: FilterContentInput): Promise<FilterContentOutput> {
  return filterContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterContentPrompt',
  input: {schema: FilterContentInputSchema},
  output: {schema: FilterContentOutputSchema},
  prompt: `You are an expert in document processing.
Your task is to filter out irrelevant content from a given document text, such as headers, footers, and boilerplate text, and focus on meaningful content.

Document Text: {{{documentText}}}

Filtered Text:`,
});

const filterContentFlow = ai.defineFlow(
  {
    name: 'filterContentFlow',
    inputSchema: FilterContentInputSchema,
    outputSchema: FilterContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
