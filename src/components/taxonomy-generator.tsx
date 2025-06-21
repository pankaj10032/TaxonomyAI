"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { generatePdfTaxonomy } from "@/ai/flows/pdf-taxonomy-generation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TaxonomyDisplay } from "./taxonomy-display";
import type { TaxonomyResult } from "@/lib/types";
import { UploadCloud, File, X, AlertCircle, Info } from "lucide-react";

export function TaxonomyGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [taxonomyResult, setTaxonomyResult] = useState<TaxonomyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depth, setDepth] = useState([3]);
  const [pageStart, setPageStart] = useState("");
  const [pageEnd, setPageEnd] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a valid PDF file.");
        setFile(null);
      }
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setTaxonomyResult(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTaxonomyResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const pdfDataUri = reader.result as string;
        const result = await generatePdfTaxonomy({ 
          pdfDataUri,
          depth: depth[0],
          pageStart: pageStart ? parseInt(pageStart, 10) : undefined,
          pageEnd: pageEnd ? parseInt(pageEnd, 10) : undefined,
         });
        setTaxonomyResult(result);

      } catch (e) {
        console.error(e);
        setError("An error occurred during taxonomy generation. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
      setIsLoading(false);
    };
  }, [file, depth, pageStart, pageEnd]);

  return (
    <div className="w-full space-y-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Upload & Analyze PDF</CardTitle>
          <CardDescription>Configure your analysis and upload a document to begin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <label
              htmlFor="file-upload"
              className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
            >
              {file ? (
                <div className="flex flex-col items-center justify-center text-center">
                    <File className="w-12 h-12 text-primary" />
                    <p className="mt-2 font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF (MAX. 20MB)</p>
                </div>
              )}
               <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="application/pdf" />
            </label>
             {file && (
                <div className="flex justify-end -mt-2">
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                        <X className="w-4 h-4 mr-2"/>
                        Remove
                    </Button>
                </div>
             )}
          </div>

          <div className="space-y-6 rounded-lg border p-4">
            <h3 className="font-headline text-lg font-medium">Analysis Options</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="depth-slider">Taxonomy Depth: {depth[0]}</Label>
                <Slider id="depth-slider" min={1} max={5} step={1} value={depth} onValueChange={setDepth} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="page-start">Page Start</Label>
                    <Input id="page-start" type="number" placeholder="e.g., 1" value={pageStart} onChange={(e) => setPageStart(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="page-end">Page End</Label>
                    <Input id="page-end" type="number" placeholder="e.g., 10" value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          
          <Button onClick={handleSubmit} disabled={!file || isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg">
            {isLoading ? "Analyzing Document..." : "Analyze PDF"}
          </Button>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Generating Taxonomy</CardTitle>
                <CardDescription>This may take a moment. The AI is parsing, extracting, and structuring the content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 p-2">
                    <Skeleton className="h-8 w-3/4" />
                    <div className="pl-8 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
                <div className="space-y-2 p-2">
                    <Skeleton className="h-8 w-1/2" />
                </div>
            </CardContent>
        </Card>
      )}

      {taxonomyResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline text-2xl">Generated Taxonomy</CardTitle>
                <CardDescription>Results from the document analysis.</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap justify-end max-w-xs">
                <Badge variant="outline">
                  <Info className="mr-1 h-3 w-3" />
                  Topics: {taxonomyResult.metadata.numberOfTopics}
                </Badge>
                <Badge variant="outline">
                  Pages: {taxonomyResult.metadata.pageRangeAnalyzed}
                </Badge>
                 <Badge variant="outline">
                  Time: {taxonomyResult.metadata.processingTime}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TaxonomyDisplay data={taxonomyResult.taxonomy} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
