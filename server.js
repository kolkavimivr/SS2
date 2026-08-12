const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.all('/survey', (req, res) => {
    // חובה: הגדרת Content-Type כטקסט נקי
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // איחוד הפרמטרים הנכנסים מימות המשיח (GET / POST)
    const params = { ...req.query, ...req.body };

    // 1. טיפול בניתוק שיחה
    if (params.hangup === 'yes') {
        return res.send('OK');
    }

    // -------------------------------------------------------------
    // 2. בדיקה סדרתית: איזה פרמטר חסר? (מהתחלה לסוף)
    // -------------------------------------------------------------

    // שאלה 01 - כולל השמעת פתיח השאלון (quiz_intro)
    if (!params.q01) {
        return res.send('read=f-quiz_intro,f-v001=q01,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 02
    if (!params.q02) {
        return res.send('read=f-v002=q02,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 03
    if (!params.q03) {
        return res.send('read=f-v003=q03,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 04
    if (!params.q04) {
        return res.send('read=f-v004=q04,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 05
    if (!params.q05) {
        return res.send('read=f-v005=q05,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 11 (חלק ב')
    if (!params.q11) {
        return res.send('read=f-v011=q11,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 16 (חלק ג' - כולל מעברון mid_intro3)
    if (!params.q16) {
        return res.send('read=f-mid_intro3,f-v016=q16,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 17
    if (!params.q17) {
        return res.send('read=f-v017=q17,no,1,1,5,Stt,no,1,2,3');
    }

    // שאלה 18
    if (!params.q18) {
        return res.send('read=f-v018=q18,no,1,1,5,Stt,no,1,2,3');
    }

    // -------------------------------------------------------------
    // 3. שלב סיום: כל 9 התשובות התקבלו! חישוב תוצאות ומשוב
    // -------------------------------------------------------------
    const { q01, q02, q03, q04, q05, q11, q16, q17, q18 } = params;

    // א. ניקוד 5 המגמות
    const scores = {
        m_accounting: 0, // חשבונאות
        m_tech: 0,       // תקשוב
        m_graphics: 0,   // גרפיקה
        m_education: 0,  // חינוך
        m_sewing: 0      // תפירה
    };

    // ניתוח חלק א'
    if (q01 === '1') scores.m_accounting += 2;
    if (q01 === '2') { scores.m_education += 0.5; scores.m_graphics += 0.5; }

    if (q02 === '1') scores.m_tech += 2;

    if (q03 === '1') scores.m_graphics += 2;

    if (q04 === '1') scores.m_education += 2;
    if (q04 === '2') { scores.m_tech += 0.5; scores.m_accounting += 0.5; }

    if (q05 === '1') scores.m_sewing += 2;

    // ניתוח חלק ב'
    if (q11 === '1') {
        scores.m_accounting += 1;
        scores.m_tech += 1;
    } else if (q11 === '2') {
        scores.m_graphics += 1;
        scores.m_sewing += 1;
        scores.m_education += 0.5;
    }

    // ב. דירוג המגמות מהגבוה לנמוך ובחירת 3 המקומות הראשונים
    const sortedMajors = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    const top1 = sortedMajors[0];
    const top2 = sortedMajors[1];
    const top3 = sortedMajors[2];

    // ג. הרכבת רשימת השמעה לתוצאות
    const playList = [
        'quiz_results',
        top1,
        top2,
        top3
    ];

    // ד. בדיקת התניות חלק ג' והוספת קבצי משוב/אזהרה
    if (q16 === '1' || q18 === '1') {
        playList.push('warning_social');
    }
    if (q17 === '1') {
        playList.push('info_minimal_load');
    }
    if (q16 === '2' && q18 === '2') {
        playList.push('info_independent');
    }

    // ה. יצירת מחרוזת id_list_message (קובצי השמעה מופרדים בנקודה)
    const idListMessage = playList.map(file => `f-${file}`).join('.');

    // החזרת תשובת סיום ומעבר לשלוחה /0/4/2
    return res.send(`id_list_message=${idListMessage}&go_to_folder=/0/4/2`);
});

// הגדרת פורט מותאם ל-Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
