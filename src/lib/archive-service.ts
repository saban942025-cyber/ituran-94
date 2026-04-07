// src/lib/archive-service.ts
export const ArchiveService = {
  /**
   * יוצר לינק קסם מאובטח לצפייה ועריכה
   */
  generateMagicLink(ticketDocId: string, token: string) {
    const domain = process.env.NEXT_PUBLIC_APP_URL || "https://saban-os.vercel.app";
    // הלינק מוביל ישירות לדף העורך עם הפרמטרים [cite: 24, 25]
    return `${domain}/admin/editor?id=${ticketDocId}&auth=${token}`;
  },

  /**
   * פונקציה לשליחת הלינק (דמיון: חיבור ל-API של וואטסאפ בעתיד)
   */
  async shareTicket(ticketId: string, phone: string) {
    // כאן תבוא לוגיקת שליחה
    console.log(`Sending Ticket ${ticketId} to ${phone}...`);
  }
};
