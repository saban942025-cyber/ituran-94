export const SABAN_OCR_SCHEMA = {
  type: "object",
  properties: {
    invoiceNumber: { type: "string", description: "6-7 digit number" },
    customerName: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          itemId: { type: "string" },
          name: { type: "string" },
          originalQty: { type: "number" },
          newQty: { type: "number" }
        }
      }
    },
    signatureFound: { type: "boolean" },
    hasChanges: { type: "boolean" }
  },
  required: ["invoiceNumber", "items", "signatureFound"]
};

export const SABAN_PROMPT = `נתח את תעודת המשלוח. השווה לטיוטה המצורפת. 
זהה חתימה בפינה שמאלית תחתונה. 
אם יש תיקון ידני בכמות (למשל איקס או מספר חדש), עדכן ב-newQty.
החזר JSON בלבד.`;
