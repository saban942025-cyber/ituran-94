'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';

export default function SmartCamera() {
  const webcamRef = useRef<Webcam>(null);
  const [guideMessage, setGuideMessage] = useState("כוון את המצלמה לתעודה");
  const [isCaptured, setIsCaptured] = useState(false);

  // פונקציה ששולחת צילום לג'ימיני לבדיקה טכנית (האם התמונה ברורה?)
  const validateWithGemini = async (image: string) => {
    setGuideMessage("בודק איכות צילום...");
    // כאן נשלח למסלול ה-API שמחובר למפתח ה-AI שלך
    const res = await fetch('/api/gemini/validate', {
      method: 'POST',
      body: JSON.stringify({ image })
    });
    const data = await res.json();
    
    if (data.isClear) {
      setGuideMessage("תמונה מצוינת! מעלה לארכיון...");
      setIsCaptured(true);
      // שליחה סופית ל-Google Drive/GitHub
    } else {
      setGuideMessage(data.instruction); // למשל: "תתקרב, הטקסט מטושטש"
    }
  };

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) validateWithGemini(imageSrc);
  }, [webcamRef]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center">
      <div className="relative w-full flex-1 flex items-center justify-center">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="h-full w-full object-cover"
        />
        {/* מסגרת הכוונה על המסך */}
        <div className="absolute border-2 border-[#C9A227] w-[80%] h-[60%] rounded-lg shadow-[0_0_0_2000px_rgba(0,0,0,0.5)]"></div>
        
        {/* הודעת הדרכה צפה */}
        <div className="absolute top-10 bg-black/70 text-white px-6 py-2 rounded-full font-bold border border-[#C9A227]">
          {guideMessage}
        </div>
      </div>

      <div className="h-32 bg-[#202c33] w-full flex items-center justify-center border-t border-gray-700">
        {!isCaptured ? (
          <button onClick={capture} className="p-6 bg-[#C9A227] rounded-full shadow-2xl active:scale-90 transition-all">
            <Camera size={32} className="text-black" />
          </button>
        ) : (
          <div className="flex flex-col items-center text-green-500">
            <CheckCircle size={48} />
            <span className="text-[10px] font-black uppercase mt-1">התעודה בארכיון</span>
          </div>
        )}
      </div>
    </div>
  );
}
