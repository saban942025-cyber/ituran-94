'use client'

import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import jsPDF from 'jspdf'
import { PenTool, Stamp, Type, Printer, MousePointer2 } from 'lucide-react'

export default function CanvasStudio({ backgroundSrc }: { backgroundSrc: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<fabric.Canvas | null>(null)

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
      img.scaleToWidth(700)
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
    if (!canvasRef.current) return
    canvasRef.current.isDrawingMode = true
    const brush = new fabric.PencilBrush(canvasRef.current)
    brush.color = "rgba(255, 235, 59, 0.4)"
    brush.width = 20
    canvasRef.current.freeDrawingBrush = brush
  }

  const addStamp = () => {
    fabric.Image.fromURL('/stamps/approved.png', (img) => {
      img.scale(0.1)
      canvasRef.current?.add(img)
    }, { crossOrigin: 'anonymous' })
  }

  const addText = () => {
    const text = new fabric.IText('הערה: ', {
      left: 50, top: 50,
      fontFamily: 'Arial', fontSize: 20,
      fill: 'red', direction: 'rtl'
    })
    canvasRef.current?.add(text)
  }

  const exportPDF = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL({ format: 'png' })
    const pdf = new jsPDF('p', 'px', [canvas.getWidth(), canvas.getHeight()])
    pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.getWidth(), canvas.getHeight())
    pdf.save('signed-document.pdf')
  }

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-[#FAF9F8]">
        <button onClick={() => { if(canvasRef.current) canvasRef.current.isDrawingMode = false }} className="btn-icon"><MousePointer2 size={18}/></button>
        <button onClick={addMarker} className="btn-icon text-yellow-600"><PenTool size={18}/></button>
        <button onClick={addStamp} className="btn-icon text-blue-600"><Stamp size={18}/></button>
        <button onClick={addText} className="btn-icon text-red-600"><Type size={18}/></button>
        <div className="flex-1" />
        <button onClick={exportPDF} className="bg-[#0078D4] text-white px-3 py-1 rounded text-sm flex items-center gap-2">
          <Printer size={16}/> הדפסה
        </button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center bg-gray-50" />
      <style jsx>{`
        .btn-icon { p: 8px; border-radius: 4px; border: 1px solid #E2E8F0; background: white; cursor: pointer; }
        .btn-icon:hover { background: #F3F2F1; }
      `}</style>
    </div>
  )
}
