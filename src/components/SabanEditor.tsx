'use client'
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

// הוספת סוג למשתנה fileUrl והגדרת ה-Refs בצורה נכונה ל-TypeScript
export default function SabanEditor({ fileUrl }: { fileUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // אתחול הקנבס
    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1100,
      backgroundColor: '#fff',
    });
  }, []);

  // כלי המרקר הצהוב
  const addMarker = () => {
    fabricRef.current.isDrawingMode = true;
    fabricRef.current.freeDrawingBrush = new fabric.PencilBrush(fabricRef.current);
    fabricRef.current.freeDrawingBrush.color = "rgba(255, 255, 0, 0.4)"; // צהוב מרקר
    fabricRef.current.freeDrawingBrush.width = 20;
  };

  // הוספת חותמת מאושר (מתמונה במאגר)
  const addStamp = () => {
    fabric.Image.fromURL('/stamps/approved.png', (img) => {
      img.scale(0.2);
      img.set({ left: 100, top: 100 });
      fabricRef.current.add(img);
    });
  };

  // הוספת הערת טקסט בעברית
  const addComment = () => {
    const text = new fabric.IText('הערת רמי: ', {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 'red',
      direction: 'rtl'
    });
    fabricRef.current.add(text);
  };

  return (
    <div className="editor-container">
      <div className="toolbar flex gap-2 p-4 bg-gray-100 border-b">
        <button onClick={addMarker} className="p-2 bg-yellow-200 rounded">🖍️ מרקר</button>
        <button onClick={addStamp} className="p-2 bg-blue-200 rounded">🛡️ חותמת</button>
        <button onClick={addComment} className="p-2 bg-red-200 rounded">📝 הערה</button>
        <button onClick={() => window.print()} className="p-2 bg-green-200 rounded">🖨️ הדפסה</button>
      </div>
      <canvas ref={canvasRef} className="border shadow-lg mx-auto" />
    </div>
  );
}
