export const SABAN_OCR_SCHEMA = {
  description: "Extract delivery note data from Saban 94 documents",
  type: "object",
  properties: {
    invoiceNumber: { type: "string", description: "6-7 digit number at the top left" },
    customerName: { type: "string", description: "Customer name in parentheses" },
    deliveryAddress: { type: "string", description: "Address after 'פרטי אספקה'" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          itemId: { type: "string", description: "מק\"ט" },
          name: { type: "string", description: "שם פריט" },
          unit: { type: "string", description: "מידה" },
          quantity: { type: "number", description: "כמות" }
        }
      }
    },
    handwrittenNotes: { type: "string", description: "Any manual ink notes like 'returned items'" }
  },
  required: ["invoiceNumber", "customerName", "items"]
};

export const SABAN_PROMPT = `נתח את תעודת המשלוח של ח. סבן. 
חלץ את מספר התעודה, שם הלקוח, ורשימת הפריטים. 
שים לב במיוחד להערות בכתב יד אם קיימות (כמו "הוחזר", "חוסר").
החזר תשובה בפורמט JSON בלבד.`;
