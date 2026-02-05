'use server';

// ... (לוגיקת ה-API וניהול המפתחות שכתבנו קודם) ...

      const result = await model.generateContent([
        { inlineData: { data: cleanBase64, mimeType: mimeType } },
        { text: `Extract only these 3 fields from the delivery note. 
          Return ONLY JSON: 
          {
            "invoiceNumber": "string",
            "customerName": "string",
            "invoiceDate": "string"
          }` 
        }
      ]);

// ... (המשך השמירה ל-Firebase) ...
