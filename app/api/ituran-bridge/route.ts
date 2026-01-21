import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase'; // יוצאים 3 רמות החוצה
import { ref, set, push, serverTimestamp } from 'firebase/database';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const [header, alertName, driver, plate, location, time, speed] = body.split('|');

    if (header !== 'SABAN_ALERT') {
      return NextResponse.json({ error: 'Invalid Format' }, { status: 400 });
    }

    // 1. עדכון סטטוס נהג
    await set(ref(db, `team/${driver}`), {
      status: alertName,
      location,
      time,
      lastUpdate: serverTimestamp()
    });

    // 2. רישום הודעה בהיסטוריה
    await push(ref(db, 'internal_messages'), {
      driver,
      alertName,
      text: `התראה: ${alertName} מרכב ${plate}`,
      timestamp: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
