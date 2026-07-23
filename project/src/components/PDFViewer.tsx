
import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { FileNode } from '../contexts/FileContext';

const base64toBlob = (base64Data: string, contentType = 'application/pdf', sliceSize = 512) => {
  // Strip potential data URL prefix
  const cleaned = base64Data.includes('base64,') 
    ? base64Data.split('base64,')[1] 
    : base64Data.trim();

  // Validate that the string only contains Latin1 characters for atob
  if (/[^\x00-\xFF]/.test(cleaned)) {
    throw new Error("Data contains characters outside of the Latin1 range. This usually happens when binary data is incorrectly read as a text string.");
  }

  const byteCharacters = atob(cleaned);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
    
  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

interface PDFViewerProps {
  file: FileNode;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    
    const loadPDF = () => {
      setLoading(true);
      setError(null);
      if (file.content) {
        try {
          const blob = base64toBlob(file.content);
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        } catch (err) {
          console.error("Failed to load PDF from base64 content", err);
          setError(err instanceof Error ? err.message : "Failed to decode PDF data.");
          setPdfUrl(null);
        }
      } else {
        setPdfUrl(null);
      }
      setLoading(false);
    };

    loadPDF();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading PDF...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">Error Loading PDF</div>
        <p className="text-sm text-slate-500 max-w-xs">{error}</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="text-slate-400">No PDF content available</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100">
      <div className="flex-1">
        <iframe
          src={`${pdfUrl}#view=fitH`}
          className="w-full h-full border-0 bg-white"
          title={file.name}
          aria-label={`PDF preview of ${file.name}`}
        />
      </div>
    </div>
  );
};
