import { TaxonomyGenerator } from "@/components/taxonomy-generator";
import { Logo } from "@/components/icons";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <Logo className="h-6 w-6" />
              <span className="font-bold font-headline">TaxonomyAI</span>
            </a>
          </div>
        </div>
      </header>
      <main className="flex flex-1 w-full flex-col items-center justify-start p-4 sm:p-8 md:p-12">
        <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-5xl md:text-6xl">
            Generate Content Taxonomy from PDFs
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Upload a PDF document to automatically analyze its structure, identify key topics, and generate a hierarchical taxonomy with concise summaries.
          </p>
        </div>
        <div className="w-full max-w-4xl mt-8">
          <TaxonomyGenerator />
        </div>
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by an amazing AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
