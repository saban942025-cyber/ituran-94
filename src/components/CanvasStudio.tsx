'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { fabric } from 'fabric'
import jsPDF from 'jspdf'
import { FileText, PenTool, Stamp, Type, Printer, AlertCircle } from 'lucide-react'

/* סוגי נתונים לחילוץ AI */
type ItemRow = {
  name: string
  ordered: number
  delivered: number
  diff?: number
}

export default function CanvasStudio({ backgroundSrc }: { backgroundSrc: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<fabric.Canvas | null>(null)
  const [items, setItems] = useState<ItemRow[]>([
    { name: 'בלוק 20/20', ordered: 10, delivered: 8 }, // דוגמה לחריגה
    { name: 'צמנט 50 ק"ג', ordered: 5, delivered: 5 }
  ])

  useEffect(() => {
    if (!containerRef.current) return
    const el = document.createElement('canvas')
    containerRef.current.appendChild(el)

    const canvas = new fabric.Canvas(el, {
      backgroundColor: '#fff',
      selection: true,
      enableRetinaScaling: true
    })
    canvasRef.current = canvas

    fabric.Image.fromURL(backgroundSrc, (img) => {
      img.scaleToWidth(800)
      canvas.setWidth(img.getScaledWidth())
      canvas.setHeight(img.getScaledHeight())
      canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas))
    })

    return () => canvas.dispose()
  }, [backgroundSrc])

  // כלי עריכה
  const addMarker = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.isDrawingMode = true
    const brush = new fabric.PencilBrush(canvas)
    brush.color = "rgba(255, 235, 59, 0.4)" // מרקר צהוב
    brush.width = 25
    canvas.freeDrawingBrush = brush
  }

  const addStamp = () => {
    fabric.Image.fromURL('/stamps/approved.png', (img) => {
      img.scale(0.15)
      img.set({ left: 100, top: 100 })
      canvasRef.current?.add(img)
    })
  }

  const addText = () => {
    const text = new fabric.IText('הערה: ', {
      left: 100, top: 150,
      fontFamily: 'Segoe UI', fontSize: 20,
      fill: '#D32F2F', textAlign: 'right',
      direction: 'rtl'
    })
    canvasRef.current?.add(text)
  }

  const printPDF = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL({ format: 'png' })
    const pdf = new jsPDF('p', 'px', [canvas.getWidth(), canvas.getHeight()])
    pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.getWidth(), canvas.getHeight())
    pdf.save(`תעודה_חתומה_${Date.now()}.pdf`)
  }

  return (
    <div className="flex flex-col h-screen bg-[#F3F2F1] font-sans">
      {/* סרגל כלים Ribbon */}
      <div className="h-14 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 shadow-sm">
        <div className="flex items-center gap-2 border-r pr-4 border-gray-200">
          <button onClick={() => { if(canvasRef.current) canvasRef.current.isDrawingMode = false }} className="office-btn"><PenTool size={16} className="ml-2"/> בחר</button>
          <button onClick={addMarker} className="office-btn bg-yellow-50"><PenTool size={16} className="ml-2 text-yellow-600"/> מרקר</button>
          <button onClick={addStamp} className="office-btn"><Stamp size={16} className="ml-2 text-blue-600"/> חותמת</button>
          <button onClick={addText} className="office-btn"><Type size={16} className="ml-2 text-red-600"/> הערה</button>
        </div>
        <button onClick={printPDF} className="office-btn-primary office-btn mr-auto"><Printer size={16} className="ml-2"/> הדפס PDF</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* פאנל נתונים Microsoft Style */}
        <aside className="w-80 bg-white border-r border-[#E2E8F0] p-4 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center text-[#323130]"><FileText size={20} className="ml-2"/> נתוני תעודה</h2>
          
          <div className="office-card">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#FAF9F8] border-b border-gray-100">
                <tr>
                  <th className="p-2">פריט</th>
                  <th className="p-2">הוזמן</th>
                  <th className="p-2">סופק</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${row.delivered < row.ordered ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="p-2 text-center">{row.ordered}</td>
                    <td className={`p-2 text-center font-bold ${row.delivered < row.ordered ? 'text-red-600' : ''}`}>{row.delivered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.some(r => r.delivered < r.ordered) && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-2 rounded border border-red-100">
              <AlertCircle size={14}/> נמצאו חריגות בכמויות לספירה
            </div>
          )}
        </aside>

        {/* משטח עבודה קנבס */}
        <main className="flex-1 overflow-auto flex justify-center p-8 bg-[#F3F2F1]">
          <div ref={containerRef} className="shadow-2xl border border-gray-300 bg-white rounded-sm" />
        </main>
      </div>
    </div>
  )
}
