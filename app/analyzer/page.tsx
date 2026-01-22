const processWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const apiKey = "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI";
      
      // תיקון ה-URL: הוספת v1beta והסרת טעויות תחביר
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const prompt = `נתח את נתוני ח. סבן. חלץ ל-JSON נקי: ticketId, customer, date, itemsDetailed (name, qty, unit), techographPTO (open, close). טקסט: ${rawContent}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Server Error');
      }

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
      setStagedTickets(JSON.parse(aiText));
      
    } catch (e) {
      console.error("AI Error:", e);
      alert(`שגיאה בחיבור ל-Gemini: ${e.message}`);
    }
    setIsAnalyzing(false);
  };
