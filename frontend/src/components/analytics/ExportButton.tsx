"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ExportButtonProps {
  targetId: string;
  filename?: string;
}

export function ExportButton({ targetId, filename = "finsight-analytics" }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setShowOptions(false);
      const element = document.getElementById(targetId);
      if (!element) throw new Error("Target element not found");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
    } catch {
      // ignore
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    try {
      setIsExporting(true);
      setShowOptions(false);
      const element = document.getElementById(targetId);
      if (!element) throw new Error("Target element not found");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // ignore
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Download size={16} />}
        isLoading={isExporting}
        onClick={() => setShowOptions(!showOptions)}
      >
        Export
      </Button>

      {showOptions && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={handleExportPDF}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              <FileText size={16} className="mr-3 text-gray-400" />
              Download as PDF
            </button>
            <button
              onClick={handleExportImage}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              <ImageIcon size={16} className="mr-3 text-gray-400" />
              Download as Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
