"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderTree, FileText, Image, Table } from "lucide-react";
import type { TaxonomyNode } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface TaxonomyDisplayProps {
  data: TaxonomyNode[];
}

export function TaxonomyDisplay({ data }: TaxonomyDisplayProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const getBadgeVariant = (score: number) => {
    if (score > 75) return "default";
    if (score > 40) return "secondary";
    return "destructive";
  };

  return (
    <Accordion type="multiple" className="w-full">
      {data.map((item, index) => (
        <AccordionItem value={`item-${item.title || 'item'}-${index}`} key={`key-${item.title || 'item'}-${index}`}>
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.subtopics && item.subtopics.length > 0 ? (
                  <FolderTree className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                )}
                <span className="font-medium text-base font-headline truncate">{item.title}</span>
              </div>
              {item.confidenceScore !== undefined && (
                 <Badge variant={getBadgeVariant(item.confidenceScore)} className="ml-4 flex-shrink-0">
                    {item.confidenceScore}%
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-8 border-l-2 border-primary/20 ml-2.5 space-y-4">
              <p className="pb-4 text-muted-foreground">{item.summary}</p>
              
              {item.image_table_info && item.image_table_info.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold font-headline text-sm">Visual Content Analysis</h4>
                  <ul className="space-y-2">
                  {item.image_table_info.map((info, infoIndex) => (
                    <li key={infoIndex} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                      {info.type === 'image' ? 
                        <Image className="h-5 w-5 text-accent flex-shrink-0 mt-1" /> : 
                        <Table className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                      }
                      <div className="flex-1">
                        <span className="font-semibold capitalize">{info.type}</span>
                        <p className="text-sm text-muted-foreground">{info.description}</p>
                      </div>
                    </li>
                  ))}
                  </ul>
                </div>
              )}

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
