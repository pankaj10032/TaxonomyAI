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
import type {TaxonomyNode} from '@/lib/types';

// Define the recursive schema for the taxonomy structure.
const TaxonomyNodeSchema: z.ZodType<TaxonomyNode> = z.object({
  title: z.string().describe('The title of the topic or subtopic.'),
  summary: z.string().describe('A concise 2-3 sentence summary of the topic.'),
  subtopics: z
    .array(z.lazy(() => TaxonomyNodeSchema))
    .optional()
    .describe('A list of nested subtopics, if any.'),
});

const PdfTaxonomyInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PdfTaxonomyInput = z.infer<typeof PdfTaxonomyInputSchema>;

const PdfTaxonomyOutputSchema = z.object({
  taxonomy: z
    .array(TaxonomyNodeSchema)
    .describe('A hierarchical list of top-level topics from the PDF.'),
});
export type PdfTaxonomyOutput = z.infer<typeof PdfTaxonomyOutputSchema>;

export async function generatePdfTaxonomy(
  input: PdfTaxonomyInput
): Promise<PdfTaxonomyOutput> {
  return generatePdfTaxonomyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pdfTaxonomyPrompt',
  input: {schema: PdfTaxonomyInputSchema},
  output: {schema: PdfTaxonomyOutputSchema},
  prompt: `You are an expert in document analysis and content structuring.
Analyze the provided PDF document and generate a detailed, hierarchical taxonomy of its content.

Instructions:
1.  **Identify Structure:** Identify the main topics, subtopics, and any nested subtopics based on the document's headings, sections, and overall content flow.
2.  **Summarize Concisely:** For each topic and subtopic, provide a concise summary (2-3 sentences) that captures its key points and arguments.
3.  **Extract Accurately:** Use Retrieval-Augmented Generation (RAG) to extract relevant information from the PDF, ensuring summaries are accurate and context-aware.
4.  **Maintain Coherence:** Cross-reference information to avoid redundancy and ensure the taxonomy is logical and coherent.
5.  **Filter Noise:** Exclude irrelevant sections like headers, footers, page numbers, and boilerplate text. Focus only on the substantive content.
6.  **Handle Ambiguity:** If sections are unclear, make reasoned inferences based on the available context, prioritizing specificity and relevance.
7.  **Format Output:** Output the taxonomy as a hierarchical JSON object. The top-level should be an array of main topics. Each topic object must have a 'title', a 'summary', and an optional 'subtopics' array for nested items.

Example of desired output structure:
{
  "taxonomy": [
    {
      "title": "Main Topic 1",
      "summary": "This is a summary of the first main topic.",
      "subtopics": [
        {
          "title": "Subtopic 1.1",
          "summary": "Summary of subtopic 1.1."
        }
      ]
    },
    {
      "title": "Main Topic 2",
      "summary": "This is a summary of the second main topic."
    }
  ]
}

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
    if (!output) {
      throw new Error('Failed to generate taxonomy. The AI returned no output.');
    }
    return output;
  }
);
