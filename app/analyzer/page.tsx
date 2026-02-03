// 1. תוודא שה-imports שלך נראים ככה למעלה:
import { db } from '@/lib/firebase'; // וודא שבקובץ ה-lib הגדרת את Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ... בתוך הפונקציה ...

setIsProcessing(true);
try {
  // יצירת התייחסות לאוסף ב-Firestore (במקום ה-ref שהכשיל את ה-Build)
  const historyCollection = collection(db, 'delivery_history');

  for (const item of stagedData) {
    // הוספת מסמך חדש ל-Firestore
    await addDoc(historyCollection, {
      ...item,
      timestamp: serverTimestamp(), // מוסיף זמן שרת מדויק
      status: 'archived'
    });
  }
  
  // ... המשך הקוד שלך (איפוס סטייט וכו') ...
}
