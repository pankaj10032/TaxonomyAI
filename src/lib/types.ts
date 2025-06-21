export interface TaxonomyNode {
  title: string;
  summary: string;
  confidenceScore: number;
  subtopics?: TaxonomyNode[];
}

export interface TaxonomyResult {
  taxonomy: TaxonomyNode[];
  metadata: {
    numberOfTopics: number;
    processingTime: string;
    pageRangeAnalyzed: string;
  };
}
