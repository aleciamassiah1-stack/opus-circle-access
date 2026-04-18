import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

// Worker hosted via CDN — avoids bundler config and Chrome's PDF plugin block.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Props = { url: string };

const PdfPreview = ({ url }: Props) => {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageNumber(1);
    setError(null);
  }, [url]);

  return (
    <div className="space-y-2">
      <div
        ref={(el) => {
          if (el && el.clientWidth !== containerWidth) {
            setContainerWidth(el.clientWidth);
          }
        }}
        className="bg-background flex items-center justify-center min-h-[40vh] max-h-[60vh] overflow-auto"
      >
        {error ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-destructive font-body">{error}</p>
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Open PDF in new tab
              </a>
            </Button>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(e) => setError(e.message || "Failed to load PDF")}
            loading={
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={containerWidth || undefined}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        )}
      </div>

      {numPages > 0 && !error && (
        <div className="flex items-center justify-between px-3 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-body">
            Page {pageNumber} of {numPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" /> Open
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfPreview;
