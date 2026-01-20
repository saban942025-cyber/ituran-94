import { NextResponse } from 'next/server';
import { db } from '../../../lib/Firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../../../lib/firebase';  try {
    const body = await request.text();
    // פענוח ה-SABAN_ALERT שהגדרנו במאקרו
    const [header, alertName, driver, plate, location, time, speed] = body.split('|');

    if (header !== 'SABAN_ALERT') {
      return NextResponse.json({ error: 'Invalid Format' }, { status: 400 });
    }

    // 1. עדכון סטטוס נהג בזמן אמת
    await set(ref(db, `team/${driver}`), {
      last_seen: location,
      speed: speed,
      status: alertName.includes('PTO') ? 'עבודת מנוף' : 'בתנועה',
      updatedAt: serverTimestamp()
    });

    // 2. רישום ביומן הודעות פנימי
    await push(ref(db, 'internal_messages'), {
      message: `התראה: ${alertName} לנהג ${driver} ב-${location}`,
      type: alertName.includes('PTO') ? 'work' : 'info',
      timestamp: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
