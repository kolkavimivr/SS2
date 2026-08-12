const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.all(['/survey', '/ivr', '/'], (req, res) => {
    // הגדרת Content-Type כטקסט נקי
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // איחוד הפרמטרים הנכנסים מימות המשיח (GET / POST)
    const params = { ...req.query, ...req.body };

    // 1. טיפול בניתוק שיחה
    if (params.hangup === 'yes') {
        return res.send('OK');
    }

    // -------------------------------------------------------------
    // 2. בדיקה סדרתית: איזה פרמטר חסר? (שאלות 01 עד 17)
    // -------------------------------------------------------------

    // חלק א': העדפות וכישורי ליבה (שאלות 1–11)
    if (!params.q01) {
        return res.send('read=f-quiz_intro,f-q01=q01,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q02) {
        return res.send('read=f-q02=q02,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q03) {
        return res.send('read=f-q03=q03,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q04) {
        return res.send('read=f-q04=q04,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q05) {
        return res.send('read=f-q05=q05,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q06) {
        return res.send('read=f-q06=q06,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q07) {
        return res.send('read=f-q07=q07,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q08) {
        return res.send('read=f-q08=q08,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q09) {
        return res.send('read=f-q09=q09,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q10) {
        return res.send('read=f-q10=q10,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q11) {
        return res.send('read=f-q11=q11,yes,1,1,7,Number,no,no,1.2.3');
    }

    // חלק ב': סגנון למידה וסביבת עבודה (שאלות 12–14)
    if (!params.q12) {
        return res.send('read=f-q12=q12,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q13) {
        return res.send('read=f-q13=q13,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q14) {
        return res.send('read=f-q14=q14,yes,1,1,7,Number,no,no,1.2.3');
    }

    // חלק ג': סגנון קבלת החלטות ודגלים (שאלות 15–17, כולל מעברון לפני 15)
    if (!params.q15) {
        return res.send('read=f-mid_intro3,f-q15=q15,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q16) {
        return res.send('read=f-q16=q16,yes,1,1,7,Number,no,no,1.2.3');
    }
    if (!params.q17) {
        return res.send('read=f-q17=q17,yes,1,1,7,Number,no,no,1.2.3');
    }

    // -------------------------------------------------------------
    // 3. שלב סיום: כל 17 התשובות התקבלו! חישוב תוצאות ומשוב
    // -------------------------------------------------------------
    const { 
        q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, 
        q12, q13, q14, q15, q16, q17 
    } = params;

    // א. אתחול ניקוד 7 המגמות
    const scores = {
        m_accounting: 0, // חשבונאות
        m_graphics: 0,   // גרפיקה
        m_tech: 0,       // תקשוב
        m_education: 0,  // חינוך
        m_sewing: 0,     // תפירה ויצירה
        m_marketing: 0,  // שיווק
        m_hr: 0          // ניהול משאבי אנוש
    };

    // ב. ניתוח תשובות חלק א' (שאלות 1–11)
    const pairwiseQuestions = [
        { ans: q01, a: 'm_accounting', b: 'm_graphics' },
        { ans: q02, a: 'm_tech',       b: 'm_education' },
        { ans: q03, a: 'm_sewing',     b: 'm_marketing' },
        { ans: q04, a: 'm_hr',         b: 'm_accounting' },
        { ans: q05, a: 'm_graphics',   b: 'm_tech' },
        { ans: q06, a: 'm_education',  b: 'm_hr' },
        { ans: q07, a: 'm_marketing',  b: 'm_sewing' },
        { ans: q08, a: 'm_accounting', b: 'm_tech' },
        { ans: q09, a: 'm_graphics',   b: 'm_hr' },
        { ans: q10, a: 'm_education',  b: 'm_marketing' },
        { ans: q11, a: 'm_sewing',     b: 'm_accounting' }
    ];

    pairwiseQuestions.forEach(q => {
        if (q.ans === '1') {
            scores[q.a] += 1;
        } else if (q.ans === '2') {
            scores[q.b] += 1;
        } else if (q.ans === '3') {
            scores[q.a] += 0.5;
            scores[q.b] += 0.5;
        }
    });

    // ג. דירוג 7 המגמות מהגבוה לנמוך ובחירת 3 המקומות הראשונים
    const sortedMajors = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    const top1 = sortedMajors[0];
    const top2 = sortedMajors[1];
    const top3 = sortedMajors[2];

    // ד. הרכבת רשימת השמעה לתוצאות בסיום
    const playList = [
        'quiz_results',
        top1,
        top2,
        top3
    ];

    // ה. בדיקת התניות חלק ג' והוספת קבצי משוב/אזהרה לפי התשובות
    // תנאי חברתי (שאלה 15 או 17 הקישה 1)
    if (q15 === '1' || q17 === '1') {
        playList.push('warning_social');
    }

    // תנאי עומס מבוקר (שאלה 16 הקישה 1)
    if (q16 === '1') {
        playList.push('info_minimal_load');
    }

    // תנאי עצמאות (שאלה 15 וגם 17 הקישה 2)
    if (q15 === '2' && q17 === '2') {
        playList.push('info_independent');
    }

    // ו. יצירת מחרוזת id_list_message (שרשור קבצים עם נקודה)
    const idListMessage = playList.map(file => `f-${file}`).join('.');

    // החזרת תשובת סיום ומעבר לשלוחה /0/4/2
    return res.send(`id_list_message=${idListMessage}&go_to_folder=/0/4/2`);
});

// הגדרת פורט מותאם ל-Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
