"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generatePdfTaxonomy } from "@/ai/flows/pdf-taxonomy-generation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TaxonomyDisplay } from "./taxonomy-display";
import type { TaxonomyNode } from "@/lib/types";
import { UploadCloud, File, X, AlertCircle } from "lucide-react";

export function TaxonomyGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [taxonomy, setTaxonomy] = useState<TaxonomyNode[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setTaxonomy(null);
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
    setTaxonomy(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const pdfDataUri = reader.result as string;
        const result = await generatePdfTaxonomy({ pdfDataUri });
        
        // The AI might return a single object or an array. Standardize to array.
        const taxonomyData = Array.isArray(result.taxonomy) ? result.taxonomy : [result.taxonomy];
        setTaxonomy(taxonomyData);

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
  }, [file]);

  return (
    <div className="w-full space-y-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Upload PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
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
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                        <X className="w-4 h-4 mr-2"/>
                        Remove
                    </Button>
                </div>
             )}
          </div>
          <Button onClick={handleSubmit} disabled={!file || isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg">
            {isLoading ? "Analyzing..." : "Analyze PDF"}
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
                <CardTitle className="font-headline text-2xl">Generated Taxonomy</CardTitle>
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
                <div className="space-y-2 p-2">
                    <Skeleton className="h-8 w-2/3" />
                     <div className="pl-8 space-y-2">
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      {taxonomy && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Generated Taxonomy</CardTitle>
          </CardHeader>
          <CardContent>
            <TaxonomyDisplay data={taxonomy} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
