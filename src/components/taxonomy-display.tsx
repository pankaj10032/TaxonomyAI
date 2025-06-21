"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderTree, FileText } from "lucide-react";

export interface TaxonomyNode {
  title: string;
  summary: string;
  subtopics?: TaxonomyNode[];
}

interface TaxonomyDisplayProps {
  data: TaxonomyNode[];
}

export function TaxonomyDisplay({ data }: TaxonomyDisplayProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Accordion type="multiple" className="w-full">
      {data.map((item, index) => (
        <AccordionItem value={`item-${item.title || 'item'}-${index}`} key={`${item.title || 'item'}-${index}`}>
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex items-center gap-3">
              {item.subtopics && item.subtopics.length > 0 ? (
                <FolderTree className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-accent" />
              )}
              <span className="font-medium text-base font-headline">{item.title}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-8 border-l-2 border-primary/20 ml-2.5">
              <p className="pb-4 text-muted-foreground">{item.summary}</p>
              {item.subtopics && item.subtopics.length > 0 && (
                <TaxonomyDisplay data={item.subtopics} />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
