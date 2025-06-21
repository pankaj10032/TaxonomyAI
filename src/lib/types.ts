export interface ImageTableInfo {
  type: "image" | "table";
  description: string;
  pageNumber: number;
  caption?: string;
}

export interface TaxonomyNode {
  title: string;
  summary: string;
  confidenceScore: number;
  subtopics?: TaxonomyNode[];
  image_table_info?: ImageTableInfo[];
}

export interface TaxonomyResult {
  taxonomy: TaxonomyNode[];
  metadata: {
    numberOfTopics: number;
    processingTime: string;
    pageRangeAnalyzed: string;
    imagesTablesAnalyzed: number;
  };
}
