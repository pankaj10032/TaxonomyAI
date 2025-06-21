'use server';

/**
 * @fileOverview Analyzes a PDF document and generates a detailed taxonomy of its content.
 *
 * - generatePdfTaxonomy - A function that handles the PDF taxonomy generation process.
 * - PdfTaxonomyInput - The input type for the generatePdfTaxonomy function.
 * - PdfTaxonomyOutput - The return type for the generatePdfTaxonomy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PdfTaxonomyInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PdfTaxonomyInput = z.infer<typeof PdfTaxonomyInputSchema>;

const PdfTaxonomyOutputSchema = z.object({
  taxonomy: z.any().describe('A hierarchical JSON representation of the PDF taxonomy.'),
});
export type PdfTaxonomyOutput = z.infer<typeof PdfTaxonomyOutputSchema>;

export async function generatePdfTaxonomy(input: PdfTaxonomyInput): Promise<PdfTaxonomyOutput> {
  return generatePdfTaxonomyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pdfTaxonomyPrompt',
  input: {schema: PdfTaxonomyInputSchema},
  output: {schema: PdfTaxonomyOutputSchema},
  prompt: `Analyze the provided PDF document and generate a detailed taxonomy of its content.
Identify the main topics, subtopics, and nested subtopics (to any level) based on the document's structure and content.
For each topic and subtopic, provide a concise summary (2-3 sentences) capturing its key points.
Use Retrieval-Augmented Generation (RAG) to extract relevant information from the PDF, ensuring accuracy and context-awareness.
Cross-reference extracted content to avoid redundancy and ensure coherence.
Output the taxonomy in a hierarchical JSON format with fields for title, summary, and subtopics (if any).
Exclude irrelevant sections like headers, footers, or boilerplate text, and focus on meaningful content.
If the PDF contains ambiguous or unclear sections, make reasoned inferences based on context, prioritizing specificity and relevance.

Here is the PDF Document: {{media url=pdfDataUri}}`,
});

const generatePdfTaxonomyFlow = ai.defineFlow(
  {
    name: 'generatePdfTaxonomyFlow',
    inputSchema: PdfTaxonomyInputSchema,
    outputSchema: PdfTaxonomyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
