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

const ImageTableInfoSchema = z.object({
  type: z.enum(['image', 'table']).describe("The type of content, either 'image' or 'table'."),
  description: z.string().describe("A detailed description of the image or a summary of the table's data."),
  pageNumber: z.number().describe('The page number where the image or table is located.'),
  caption: z.string().optional().describe('The caption of the image or table, if available.'),
});

const TaxonomyNodeSchema: z.ZodType<TaxonomyNode> = z.object({
  title: z.string().describe('The title of the topic or subtopic. MUST be extracted from the document.'),
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
      'A confidence score (0-100) representing the relevance and clarity of the extracted topic. MUST be an integer.'
    ),
  subtopics: z
    .array(z.lazy(() => TaxonomyNodeSchema))
    .optional()
    .describe('A list of nested subtopics. Create a deep hierarchy (5-6 levels or more) if the document supports it.'),
  image_table_info: z
    .array(ImageTableInfoSchema)
    .optional()
    .describe('A list of important images or tables found within this topic. Extract their captions and describe them.'),
});

const PdfTaxonomyInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  pageStart: z.number().optional().describe('The starting page for analysis.'),
  pageEnd: z.number().optional().describe('The ending page for analysis.'),
});
export type PdfTaxonomyInput = z.infer<typeof PdfTaxonomyInputSchema>;

const AIGeneratedOutputSchema = z.object({
  taxonomy: z
    .array(TaxonomyNodeSchema)
    .describe('The complete, hierarchical taxonomy of the PDF. MUST be an array of top-level topics.'),
  metadata: z.object({
    numberOfTopics: z
      .number()
      .describe('The TOTAL number of topics and subtopics identified in the entire taxonomy.'),
    pageRangeAnalyzed: z
      .string()
      .describe(
        'The page range that was analyzed (e.g., "1-10" or "all pages").'
      ),
    imagesTablesAnalyzed: z
      .number()
      .describe('The total number of images and tables analyzed in the document.'),
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
  prompt: `You are an expert document analysis system. Your task is to analyze the provided PDF and generate a deep, comprehensive, and hierarchical taxonomy of its content.

**PRIMARY GOAL: Create a deep, multi-level hierarchy (5-6 levels or more) of topics and subtopics based on the document's structure.**

**PDF for Analysis:** {{media url=pdfDataUri}}
**Page Range:** Analyze from page {{#if pageStart}}{{{pageStart}}}{{else}}1{{/if}} to {{#if pageEnd}}{{{pageEnd}}}{{else}}the final page{{/if}}.

**DETAILED INSTRUCTIONS:**

1.  **HIERARCHY GENERATION:**
    *   Analyze the document's headings, sections, and content flow to identify a logical hierarchy.
    *   Create a tree of topics and subtopics. Do not limit the depth. If the document is well-structured, the hierarchy should be at least 5-6 levels deep.
    *   The output must be a tree structure, with subtopics nested inside their parent topics.

2.  **CONTENT ANALYSIS & SUMMARIZATION:**
    *   For **EACH** topic and subtopic in the hierarchy, you MUST provide a \`title\` and a \`summary\`.
    *   **Title:** The title must be extracted directly from the document's headings or be a concise label for the topic.
    *   **Summary:** Generate a 2-3 sentence summary. This summary must be dense with keywords to be useful for searching.
    *   **Confidence Score:** Assign a confidence score (0-100) based on how clearly the topic is defined in the source text.

3.  **MULTIMODAL ANALYSIS (IMAGES & TABLES):**
    *   Identify important images, figures, and tables that are relevant to each topic.
    *   For each relevant image or table, extract its caption (if available), page number, and provide a detailed description of what it shows or what data it contains.
    *   Add this information to the \`image_table_info\` array for the corresponding topic.

4.  **QUALITY CONTROL:**
    *   **Filter Noise:** Your analysis MUST ignore irrelevant content like page numbers, running headers/footers, and boilerplate text. Focus only on the main substance of the document.
    *   **Accuracy:** Ensure all information (titles, summaries, data) is faithful to the source document.
    *   **Mathematical Content:** If you encounter mathematical formulas or equations, preserve them accurately in your summaries or descriptions.

5.  **METADATA:**
    *   After generating the full taxonomy, calculate the required metadata:
        *   \`numberOfTopics\`: The total count of ALL topics and subtopics in the entire tree.
        *   \`pageRangeAnalyzed\`: The range of pages you analyzed.
        *   \`imagesTablesAnalyzed\`: The total count of all images and tables you analyzed.

**FINAL OUTPUT:** You must respond with a single, valid JSON object that strictly adheres to the output schema. The root of the JSON should contain the \`taxonomy\` and \`metadata\` fields.`,
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
