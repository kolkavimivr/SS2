const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// זיכרון זמני לשמירת מצב השיחה לפי מזהה שיחה של ימות המשיח
const sessions = {};

// מיפוי שמות המגמות לתצוגה בשמע/TTS
const MAJOR_NAMES = {
    accounting: 'חשבונאות',
    graphics: 'גרפיקה',
    tech: 'תקשוב',
    education: 'חינוך',
    sewing: 'תפירה ויצירה',
    marketing: 'שיווק',
    hr: 'ניהול משאבי אנוש'
};

// הגדרת 11 שאלות חלק א' (השוואה בין מגמות)
const PAIRWISE_QUESTIONS = [
    { id: 'q01', file: 'q01.wav', majorA: 'accounting', majorB: 'graphics' },
    { id: 'q02', file: 'q02.wav', majorA: 'tech',       majorB: 'education' },
    { id: 'q03', file: 'q03.wav', majorA: 'sewing',     majorB: 'marketing' },
    { id: 'q04', file: 'q04.wav', majorA: 'hr',         majorB: 'accounting' },
    { id: 'q05', file: 'q05.wav', majorA: 'graphics',   majorB: 'tech' },
    { id: 'q06', file: 'q06.wav', majorA: 'education',  majorB: 'hr' },
    { id: 'q07', file: 'q07.wav', majorA: 'marketing',  majorB: 'sewing' },
    { id: 'q08', file: 'q08.wav', majorA: 'accounting', majorB: 'tech' },
    { id: 'q09', file: 'q09.wav', majorA: 'graphics',   majorB: 'hr' },
    { id: 'q10', file: 'q10.wav', majorA: 'education',  majorB: 'marketing' },
    { id: 'q11', file: 'q11.wav', majorA: 'sewing',     majorB: 'accounting' }
];

// נקודת הקצה הראשית שמקבלת את הפניות מימות המשיח
app.all('/ivr', (req, res) => {
    const params = { ...req.query, ...req.body };
    const callId = params.ApiCallId || params.ApiPhone || 'default_session';
    const userVal = params.val; // הקשת המקש של התלמידה

    // אתחול סשן חדש אם השיחה עוד לא קיימת בזיכרון
    if (!sessions[callId]) {
        sessions[callId] = {
            step: 1,
            scores: {
                accounting: 0,
                graphics: 0,
                tech: 0,
                education: 0,
                sewing: 0,
                marketing: 0,
                hr: 0
            },
            answers: {}
        };
    }

    const session = sessions[callId];

    // אם התקבל שידור נתונים עם תשובה מהשלב הקודם
    if (userVal) {
        // בדיקת תקינות המקש (מותר רק 1, 2 או 3)
        if (!['1', '2', '3'].includes(userVal)) {
            return res.send(buildReadResponse(`q${String(session.step).padStart(2, '0')}.wav`));
        }

        // שמירת התשובה בסיכום
        const currentQId = `q${String(session.step).padStart(2, '0')}`;
        session.answers[currentQId] = userVal;

        // עיבוד הניקוד עבור שאלות 1 עד 11
        if (session.step <= 11) {
            const qConfig = PAIRWISE_QUESTIONS[session.step - 1];
            if (userVal === '1') {
                session.scores[qConfig.majorA] += 1;
            } else if (userVal === '2') {
                session.scores[qConfig.majorB] += 1;
            } else if (userVal === '3') {
                // מניעת אינפלציית נקודות: 0.5 נקודות לכל מגמה
                session.scores[qConfig.majorA] += 0.5;
                session.scores[qConfig.majorB] += 0.5;
            }
        }

        // מתקדמים לשאלה הבאה
        session.step++;
    }

    // -------------------------------------------------------------
    // ניתוח והקראת השאלות/המעברים בהתאם לשלב (session.step)
    // -------------------------------------------------------------

    // שלב 1: פתיח + שאלה 1
    if (session.step === 1) {
        return res.send(`id_list_message=f-quiz_intro.wav&${buildReadResponse('q01.wav')}`);
    }

    // שאלות 2 עד 14
    if (session.step >= 2 && session.step <= 14) {
        const qFile = `q${String(session.step).padStart(2, '0')}.wav`;
        return res.send(buildReadResponse(qFile));
    }

    // שלב 15: מעברון + שאלה 15
    if (session.step === 15) {
        return res.send(`id_list_message=f-mid_intro3.wav&${buildReadResponse('q15.wav')}`);
    }

    // שאלות 16 ו-17
    if (session.step === 16 || session.step === 17) {
        const qFile = `q${session.step}.wav`;
        return res.send(buildReadResponse(qFile));
    }

    // -------------------------------------------------------------
    // שלב 18: סיום המבדק - חישוב תוצאות והשמעת התניות
    // -------------------------------------------------------------
    if (session.step > 17) {
        // מיון המגמות לפי ניקוד מהגבוה לנמוך
        const sortedMajors = Object.keys(session.scores)
            .sort((a, b) => session.scores[b] - session.scores[a])
            .map(key => MAJOR_NAMES[key]);

        const top1 = sortedMajors[0];
        const top2 = sortedMajors[1];
        const top3 = sortedMajors[2];

        // הרכבת רשימת השמעות לסיום השיחה
        let responseMessages = [];

        // 1. פתיח תוצאות + הקראת הטופ 3 ב-TTS (או בקבצים מוקלטים)
        responseMessages.push('f-quiz_results.wav');
        responseMessages.push(`t-במקום הראשון: ${top1}. במקום השני: ${top2}. במקום השלישי: ${top3}.`);

        // 2. תנאי חברתי (warning_social.wav) - מקש 1 בשאלה 15 או 17
        if (session.answers['q15'] === '1' || session.answers['q17'] === '1') {
            responseMessages.push('f-warning_social.wav');
        }

        // 3. תנאי עומס מבוקר (info_minimal_load.wav) - מקש 1 בשאלה 16
        if (session.answers['q16'] === '1') {
            responseMessages.push('f-info_minimal_load.wav');
        }

        // 4. תנאי עצמאות (info_independent.wav) - מקש 2 בשאלות 15 וגם 17
        if (session.answers['q15'] === '2' && session.answers['q17'] === '2') {
            responseMessages.push('f-info_independent.wav');
        }

        // ניקוי הסשן מהזיכרון
        delete sessions[callId];

        // שליחת הפקודה לסיום השיחה בימות המשיח
        return res.send(`id_list_message=${responseMessages.join(':')}&hangup`);
    }
});

/**
 * פונקציית עזר להרכבת פקודת קליטת מקש (read) בימות המשיח
 * @param {string} fileName - שם קובץ השמע להשמעה
 */
function buildReadResponse(fileName) {
    // f-filename = השמעת הקובץ
    // val = שם המשתנה שיוחזר בפוסט/גט הבא
    // no,1,1,1,Y,1,N = הגדרות מקש יחיד, מינימום 1 ספרה, מקסימום 1 ספרה, טיימאאוט וכו'
    return `read=f-${fileName}=val,no,1,1,1,Y,1,N`;
}

// הפעלת השרת על פורט 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
});
