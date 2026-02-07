'use client'

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric'; 
import jsPDF from 'jspdf';
import { MousePointer2, PenTool, Stamp, Type, Printer, Loader2 } from 'lucide-react';

export default function CanvasStudio({ backgroundSrc }: { backgroundSrc: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // הגנה קריטית ל-Vercel: הקנבס רץ רק בדפדפן
    if (typeof window === 'undefined' || !containerRef.current) return;

    const el = document.createElement('canvas');
    containerRef.current.appendChild(el);

    const canvas = new fabric.fabric.Canvas(el, {
      backgroundColor: '#fff',
      selection: true,
      preserveObjectStacking: true,
    });
    canvasRef.current = canvas;

    fabric.fabric.Image.fromURL(backgroundSrc, (img) => {
      const maxWidth = 800;
      img.scaleToWidth(maxWidth);
      canvas.setWidth(img.getScaledWidth());
      canvas.setHeight(img.getScaledHeight());
      canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas));
      setLoading(false);
    }, { crossOrigin: 'anonymous' });

    return () => {
      canvas.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [backgroundSrc]);

  const setMarkerMode = () => {
    if (!canvasRef.current) return;
    canvasRef.current.isDrawingMode = true;
    const brush = new fabric.fabric.PencilBrush(canvasRef.current);
    brush.color = "rgba(255, 235, 59, 0.4)";
    brush.width = 25;
    canvasRef.current.freeDrawingBrush = brush;
  };

  const downloadPDF = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL({ format: 'png', quality: 1 });
    const pdf = new jsPDF({
      orientation: canvasRef.current.width > canvasRef.current.height ? 'l' : 'p',
      unit: 'px',
      format: [canvasRef.current.width, canvasRef.current.height]
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
    pdf.save(`saban_doc_${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-3 border-b border-[#E2E8F0] bg-[#FAF9F8]">
        <button onClick={() => { if(canvasRef.current) canvasRef.current.isDrawingMode = false }} className="p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all text-gray-700">
          <MousePointer2 size={18}/>
        </button>
        <button onClick={setMarkerMode} className="p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all text-yellow-600">
          <PenTool size={18}/>
        </button>
        <button onClick={() => {}} className="p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all text-red-600">
          <Type size={18}/>
        </button>
        <div className="flex-1" />
        <button onClick={downloadPDF} className="bg-[#0078D4] hover:bg-[#106EBE] text-white px-4 py-1.5 rounded flex items-center gap-2 text-sm font-medium shadow-sm transition-all">
          <Printer size={16}/> הדפסה ל-PDF
        </button>
      </div>
      <div className="relative flex-1 overflow-auto bg-[#F3F2F1] p-8 flex justify-center items-start min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <Loader2 className="animate-spin text-[#0078D4]" size={40} />
          </div>
        )}
        <div ref={containerRef} className="bg-white shadow-2xl border border-gray-300" />
      </div>
    </div>
  );
}
