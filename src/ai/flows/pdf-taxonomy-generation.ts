'use server';

/**
 * @fileOverview Analyzes a PDF document and generates a comprehensive taxonomy of its content based on user-specified parameters.
 *
 * - generatePdfTaxonomy - A function that handles the PDF taxonomy generation process.
 * - PdfTaxonomyInput - The input type for the generatePdfTaxonomy function.
 * - PdfTaxonomyOutput - The return type for the generatePdfTaxonomy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {TaxonomyNode} from '@/lib/types';

const TaxonomyNodeSchema: z.ZodType<TaxonomyNode> = z.object({
  title: z.string().describe('The title of the topic or subtopic.'),
  summary: z
    .string()
    .describe(
      'A concise 2-3 sentence summary of the topic, rich with keywords for searchability.'
    ),
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A confidence score (0-100) based on the relevance and clarity of the extracted information.'
    ),
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
  depth: z
    .number()
    .optional()
    .default(3)
    .describe('The maximum depth of nested subtopics to generate.'),
  pageStart: z.number().optional().describe('The starting page for analysis.'),
  pageEnd: z.number().optional().describe('The ending page for analysis.'),
});
export type PdfTaxonomyInput = z.infer<typeof PdfTaxonomyInputSchema>;

const AIGeneratedOutputSchema = z.object({
  taxonomy: z
    .array(TaxonomyNodeSchema)
    .describe('A hierarchical list of top-level topics from the PDF.'),
  metadata: z.object({
    numberOfTopics: z
      .number()
      .describe('The total number of topics and subtopics identified.'),
    pageRangeAnalyzed: z
      .string()
      .describe(
        'The page range that was analyzed (e.g., "1-10" or "all").'
      ),
  }),
});

const PdfTaxonomyOutputSchema = AIGeneratedOutputSchema.extend({
  metadata: AIGeneratedOutputSchema.shape.metadata.extend({
    processingTime: z
      .string()
      .describe(
        'The total time taken to process the request, in seconds.'
      ),
  }),
});
export type PdfTaxonomyOutput = z.infer<typeof PdfTaxonomyOutputSchema>;

export async function generatePdfTaxonomy(
  input: PdfTaxonomyInput
): Promise<PdfTaxonomyOutput> {
  const startTime = Date.now();
  const result = await generatePdfTaxonomyFlow(input);
  const endTime = Date.now();
  const processingTime = ((endTime - startTime) / 1000).toFixed(2);

  if (!result) {
    throw new Error('Failed to generate taxonomy. The AI returned no output.');
  }

  return {
    ...result,
    metadata: {
      ...result.metadata,
      processingTime: `${processingTime}s`,
    },
  };
}

const prompt = ai.definePrompt({
  name: 'pdfTaxonomyPrompt',
  input: {schema: PdfTaxonomyInputSchema},
  output: {schema: AIGeneratedOutputSchema},
  prompt: `You are an expert in document analysis and content structuring, equipped with advanced RAG and semantic clustering capabilities.
Your task is to analyze the provided PDF document and generate a comprehensive, hierarchical taxonomy of its content based on the user's specifications.

**Analysis Parameters:**
- **Topic Depth:** Generate topics and subtopics up to a maximum depth of {{{depth}}} levels.
- **Page Range:** Analyze content from page {{#if pageStart}}{{{pageStart}}}{{else}}1{{/if}} to {{#if pageEnd}}{{{pageEnd}}}{{else}}the end{{/if}}.

**Instructions:**
1.  **Parse and Extract:** Parse the specified page range of the PDF. Use Retrieval-Augmented Generation (RAG) with semantic clustering to identify and group related concepts, ensuring high context-awareness and coherence.
2.  **Identify Structure:** Identify main topics, subtopics, and nested subtopics up to the specified depth.
3.  **Summarize Concisely:** For each topic, provide a concise 2-3 sentence summary that captures its key points. The summary should be rich with keywords to improve searchability.
4.  **Assign Confidence Score:** For each topic, assign a confidence score from 0-100 based on the relevance and clarity of the extracted information. A high score indicates a well-defined topic clearly present in the text, while a low score may indicate an inferred topic from ambiguous content.
5.  **Filter Noise:** Intelligently exclude irrelevant sections like headers, footers, page numbers, tables of contents, and boilerplate text. Focus only on the substantive content.
6.  **Handle Ambiguity:** If sections are unclear, use contextual reasoning to infer meaningful topics. Prioritize specificity and relevance.
7.  **Format Output:** Output the taxonomy and metadata as a single, hierarchical JSON object.
    - The \`taxonomy\` field should be an array of top-level topic objects. Each topic object must have a 'title', 'summary', 'confidenceScore', and an optional 'subtopics' array.
    - The \`metadata\` field must contain 'numberOfTopics' (a count of all topics and subtopics) and 'pageRangeAnalyzed' (a string describing the pages processed, e.g., "5-12" or "all").

Here is the PDF Document: {{media url=pdfDataUri}}`,
});

const generatePdfTaxonomyFlow = ai.defineFlow(
  {
    name: 'generatePdfTaxonomyFlow',
    inputSchema: PdfTaxonomyInputSchema,
    outputSchema: AIGeneratedOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error(
        'Failed to generate taxonomy. The AI returned no output.'
      );
    }
    return output;
  }
);
