'use client'

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric'; // וודא שמותקן fabric@5.3.0
import { 
  MousePointer2, 
  PenTool, 
  RotateCw, 
  Save, 
  Trash2, 
  Type, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface SabanEditorProps {
  fileUrl: string;
  onSave?: (dataUrl: string) => void;
}

export default function SabanEditor({ fileUrl, onSave }: SabanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'marker' | 'text'>('select');

  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    // אתחול הקנבס של Fabric
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1100,
      backgroundColor: '#fff',
      preserveObjectStacking: true,
      selection: true
    });
    
    fabricRef.current = canvas;

    // טעינת תמונת הרקע (התעודה שנסרקה)
    fabric.Image.fromURL(fileUrl, (img) => {
      const maxWidth = 750;
      img.scaleToWidth(maxWidth);
      
      // התאמת גודל הקנבס לתמונה
      canvas.setWidth(img.getScaledWidth() + 40);
      canvas.setHeight(img.getScaledHeight() + 40);
      
      canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas), {
        left: 20,
        top: 20,
        originX: 'left',
        originY: 'top'
      });
      
      setLoading(false);
    }, { crossOrigin: 'anonymous' });

    return () => {
      canvas.dispose();
    };
  }, [fileUrl]);

  // פונקציות כלי עבודה
  const enableSelection = () => {
    if (!fabricRef.current) return;
    fabricRef.current.isDrawingMode = false;
    setActiveTool('select');
  };

  const enableMarker = () => {
    if (!fabricRef.current) return;
    fabricRef.current.isDrawingMode = true;
    const brush = new fabric.PencilBrush(fabricRef.current);
    brush.color = "rgba(255, 255, 0, 0.4)"; // צהוב מרקר שקוף
    brush.width = 25;
    fabricRef.current.freeDrawingBrush = brush;
    setActiveTool('marker');
  };

  const addText = () => {
    if (!fabricRef.current) return;
    const text = new fabric.IText('הקלד טקסט כאן', {
      left: 100,
      top: 100,
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 20,
      fill: '#323130'
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    enableSelection();
  };

  const rotateImage = () => {
    if (!fabricRef.current) return;
    const bg = fabricRef.current.backgroundImage as fabric.Image;
    if (bg) {
      bg.rotate(((bg.angle || 0) + 90) % 360);
      fabricRef.current.requestRenderAll();
    }
  };

  const handleSave = () => {
    if (!fabricRef.current) return;
    const dataUrl = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1
    });
    if (onSave) onSave(dataUrl);
    alert('השינויים נשמרו בהצלחה!');
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#F3F2F1] rounded-lg border border-[#EDEBE9] overflow-hidden shadow-lg">
      {/* סרגל כלים בסגנון Microsoft 365 Ribbon */}
      <div className="flex items-center gap-2 p-2 bg-white border-b border-[#EDEBE9] shadow-sm">
        <button 
          onClick={enableSelection}
          className={`p-2 rounded transition-colors ${activeTool === 'select' ? 'bg-[#EDEBE9] text-[#0078D4]' : 'hover:bg-[#F3F2F1]'}`}
          title="בחר"
        >
          <MousePointer2 size={20} />
        </button>
        
        <button 
          onClick={enableMarker}
          className={`p-2 rounded transition-colors ${activeTool === 'marker' ? 'bg-[#FFF4CE] text-[#813e00]' : 'hover:bg-[#F3F2F1]'}`}
          title="מרקר"
        >
          <PenTool size={20} />
        </button>

        <button 
          onClick={addText}
          className="p-2 rounded hover:bg-[#F3F2F1] transition-colors"
          title="הוסף טקסט"
        >
          <Type size={20} />
        </button>

        <div className="w-[1px] h-6 bg-[#EDEBE9] mx-1" />

        <button 
          onClick={rotateImage}
          className="p-2 rounded hover:bg-[#F3F2F1] transition-colors"
          title="סובב תמונה"
        >
          <RotateCw size={20} />
        </button>

        <button 
          onClick={() => fabricRef.current?.clear()}
          className="p-2 rounded hover:bg-[#FDF3F2] text-[#A4262C] transition-colors"
          title="נקה הכל"
        >
          <Trash2 size={20} />
        </button>

        <div className="flex-1" />

        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#0078D4] hover:bg-[#106EBE] text-white px-4 py-1.5 rounded text-sm font-semibold transition-all shadow-sm"
        >
          <Save size={18} />
          שמור שינויים
        </button>
      </div>

      {/* אזור העריכה */}
      <div className="relative flex-1 overflow-auto p-10 flex justify-center items-start bg-[#F3F2F1]">
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="animate-spin text-[#0078D4] mb-2" size={40} />
            <p className="text-sm font-medium text-[#323130]">טוען תעודה לסטודיו...</p>
          </div>
        )}
        
        <div className="bg-white shadow-2xl border border-[#EDEBE9] rounded-sm transition-opacity duration-300">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* סרגל סטטוס תחתון */}
      <div className="bg-white border-t border-[#EDEBE9] px-4 py-1 flex items-center justify-between text-[11px] text-[#605E5C]">
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-[#107C10]" />
          <span>מוכן לעריכה</span>
        </div>
        <div>Saban Logistics - Intelligent Editor v2.0</div>
      </div>
    </div>
  );
}
