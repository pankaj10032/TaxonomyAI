"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { generatePdfTaxonomy } from "@/ai/flows/pdf-taxonomy-generation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { TaxonomyDisplay } from "./taxonomy-display";
import type { TaxonomyResult } from "@/lib/types";
import { UploadCloud, File, X, AlertCircle, Info, BookOpen, Camera } from "lucide-react";

export function TaxonomyGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [taxonomyResult, setTaxonomyResult] = useState<TaxonomyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageStart, setPageStart] = useState("");
  const [pageEnd, setPageEnd] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setProgress(10);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(timer);
            return 95;
          }
          return prev + 5;
        });
      }, 800);
    } else {
      setProgress(0);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isLoading]);


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
          pageStart: pageStart ? parseInt(pageStart, 10) : undefined,
          pageEnd: pageEnd ? parseInt(pageEnd, 10) : undefined,
         });
        setTaxonomyResult(result);

      } catch (e) {
        console.error(e);
        let errorMessage = "An error occurred during taxonomy generation. Please try again.";
        if (e instanceof Error) {
            if (e.message.includes('503') || e.message.toLowerCase().includes('overloaded')) {
              errorMessage = "The AI service is currently busy. Please wait a moment and try again.";
            } else if (e.message.toLowerCase().includes('deadline exceeded')) {
                errorMessage = "The request timed out, which can happen with large documents. Please try a smaller page range or a simpler document.";
            } else if (e.message.toLowerCase().includes('invalid') || e.message.toLowerCase().includes('unexpected') || e.message.toLowerCase().includes('json')) {
                errorMessage = "The AI returned a response that could not be processed. This may be a temporary issue. Please try again.";
            } else {
                errorMessage = "An unexpected server error occurred. Please try again later.";
            }
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
      setIsLoading(false);
    };
  }, [file, pageStart, pageEnd]);

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
                <CardDescription>The AI is performing a deep analysis. This may take a moment.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <p>Parsing PDF, analyzing content & generating hierarchy...</p>
                  </div>
                  <Progress value={progress} className="w-full" />
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
                  <BookOpen className="mr-1 h-3 w-3" />
                  Pages: {taxonomyResult.metadata.pageRangeAnalyzed}
                </Badge>
                <Badge variant="outline">
                  <Camera className="mr-1 h-3 w-3" />
                  Visuals: {taxonomyResult.metadata.imagesTablesAnalyzed}
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
