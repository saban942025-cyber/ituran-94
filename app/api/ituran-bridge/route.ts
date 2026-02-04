import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { driver, alertName, location, time } = data;

    // 1. עדכון סטטוס נהג ב-Firestore (שימוש ב-doc ו-setDoc במקום ref)
    const driverRef = doc(db, 'team', driver);
    await setDoc(driverRef, {
      status: alertName,
      location: location,
      lastUpdate: time || new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. רישום לוג היסטורי לצורך הצלבה עתידית מול תעודות משלוח
    const logsRef = collection(db, 'ituran_logs');
    await addDoc(logsRef, {
      driver,
      alertName,
      location,
      eventTime: time,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      message: `סטטוס נהג ${driver} עודכן ל-${alertName} ב-Firestore` 
    });

  } catch (error: any) {
    console.error('Ituran Bridge Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
