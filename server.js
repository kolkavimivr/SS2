const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// זיכרון זמני לשמירת מצב השיחה לפי מזהה שיחה
const sessions = {};

// מיפוי שמות המגמות לתצוגה
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

// תמיכה בכל הקישורים האפשריים: /survey, /ivr, וגם הכתובת הראשית /
app.all(['/survey', '/ivr', '/'], (req, res) => {
    const params = { ...req.query, ...req.body };
    const callId = params.ApiCallId || params.ApiPhone || 'default_session';
    const userVal = params.val;

    // אתחול שיחה חדשה במידת הצורך
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

    // קליטת תשובה מהשלב הקודם
    if (userVal) {
        if (!['1', '2', '3'].includes(userVal)) {
            return res.send(buildReadResponse(`q${String(session.step).padStart(2, '0')}.wav`));
        }

        const currentQId = `q${String(session.step).padStart(2, '0')}`;
        session.answers[currentQId] = userVal;

        // חישוב ניקוד לשאלות 1-11
        if (session.step <= 11) {
            const qConfig = PAIRWISE_QUESTIONS[session.step - 1];
            if (userVal === '1') {
                session.scores[qConfig.majorA] += 1;
            } else if (userVal === '2') {
                session.scores[qConfig.majorB] += 1;
            } else if (userVal === '3') {
                session.scores[qConfig.majorA] += 0.5;
                session.scores[qConfig.majorB] += 0.5;
            }
        }

        session.step++;
    }

    // --- שרשור והשמעת השאלות ---

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
        return res.send(buildReadResponse(`q${session.step}.wav`));
    }

    // --- שלב סיום וחישוב תוצאות ---
    if (session.step > 17) {
        const sortedMajors = Object.keys(session.scores)
            .sort((a, b) => session.scores[b] - session.scores[a])
            .map(key => MAJOR_NAMES[key]);

        const top1 = sortedMajors[0];
        const top2 = sortedMajors[1];

        let responseMessages = [
            'f-quiz_results.wav',
            `t-במקום הראשון: ${top1}. במקום השני: ${top2}. במקום השלישי: ${sortedMajors[2]}.`
        ];

        if (session.answers['q15'] === '1' || session.answers['q17'] === '1') {
            responseMessages.push('f-warning_social.wav');
        }

        if (session.answers['q16'] === '1') {
            responseMessages.push('f-info_minimal_load.wav');
        }

        if (session.answers['q15'] === '2' && session.answers['q17'] === '2') {
            responseMessages.push('f-info_independent.wav');
        }

        delete sessions[callId];
        return res.send(`id_list_message=${responseMessages.join(':')}&hangup`);
    }
});

function buildReadResponse(fileName) {
    return `read=f-${fileName}=val,no,1,1,1,Y,1,N`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
