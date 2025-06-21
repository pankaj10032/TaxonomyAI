export interface TaxonomyNode {
  title: string;
  summary: string;
  subtopics?: TaxonomyNode[];
}
