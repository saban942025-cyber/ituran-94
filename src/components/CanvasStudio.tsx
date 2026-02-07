'use client'

import React, { useEffect, useRef } from 'react'
import { fabric } from 'fabric'
import jsPDF from 'jspdf'
import { MousePointer2, PenTool, Stamp, Type, Printer } from 'lucide-react'

export default function CanvasStudio({ backgroundSrc }: { backgroundSrc: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const el = document.createElement('canvas')
    containerRef.current.appendChild(el)

    const canvas = new fabric.Canvas(el, {
      backgroundColor: '#fff',
      selection: true,
    })
    canvasRef.current = canvas

    fabric.Image.fromURL(backgroundSrc, (img) => {
      img.scaleToWidth(750)
      canvas.setWidth(img.getScaledWidth())
      canvas.setHeight(img.getScaledHeight())
      canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas))
    }, { crossOrigin: 'anonymous' })

    return () => {
      canvas.dispose()
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [backgroundSrc])

  const addMarker = () => {
    canvasRef.current.isDrawingMode = true
    const brush = new fabric.PencilBrush(canvasRef.current)
    brush.color = "rgba(255, 235, 59, 0.4)"
    brush.width = 20
    canvasRef.current.freeDrawingBrush = brush
  }

  const exportPDF = () => {
    const dataUrl = canvasRef.current.toDataURL({ format: 'png' })
    const pdf = new jsPDF('p', 'px', [canvasRef.current.getWidth(), canvasRef.current.getHeight()])
    pdf.addImage(dataUrl, 'PNG', 0, 0, canvasRef.current.getWidth(), canvasRef.current.getHeight())
    pdf.save('signed-saban.pdf')
  }

  return (
    <div className="flex flex-col w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-4 p-2 bg-[#FAF9F8] border-b border-gray-200">
        <button onClick={() => canvasRef.current.isDrawingMode = false} className="p-2 hover:bg-gray-200 rounded"><MousePointer2 size={18}/></button>
        <button onClick={addMarker} className="p-2 hover:bg-gray-200 rounded text-yellow-600"><PenTool size={18}/></button>
        <button onClick={() => {}} className="p-2 hover:bg-gray-200 rounded text-blue-600"><Stamp size={18}/></button>
        <button onClick={() => {}} className="p-2 hover:bg-gray-200 rounded text-red-600"><Type size={18}/></button>
        <button onClick={exportPDF} className="mr-auto bg-[#0078D4] text-white px-4 py-1 rounded flex items-center gap-2 text-sm">
          <Printer size={16}/> הדפסה
        </button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-[#F3F2F1] p-10 flex justify-center" />
    </div>
  )
}
