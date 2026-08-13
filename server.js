const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.all(['/survey', '/ivr', '/'], (req, res) => {
    // הגדרת Content-Type כטקסט נקי עבור ימות המשיח
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // איחוד הפרמטרים הנכנסים מימות המשיח (GET / POST)
    const params = { ...req.query, ...req.body };

    // 1. טיפול בניתוק שיחה
    if (params.hangup === 'yes') {
        return res.send('OK');
    }

    // פונקציה לחילוץ בטוח של התשובות (תומכת ב-f-q01 וגם ב-q01)
    const getAns = (key) => {
        const val = params[`f-${key}`] || params[key];
        return val ? String(val).trim() : null;
    };

    const q01 = getAns('q01');
    const q02 = getAns('q02');
    const q03 = getAns('q03');
    const q04 = getAns('q04');
    const q05 = getAns('q05');
    const q06 = getAns('q06');
    const q07 = getAns('q07');
    const q08 = getAns('q08');
    const q09 = getAns('q09');
    const q10 = getAns('q10');
    const q11 = getAns('q11');
    const q12 = getAns('q12');
    const q13 = getAns('q13');
    const q14 = getAns('q14');
    const q15 = getAns('q15');
    const q16 = getAns('q16');
    const q17 = getAns('q17');

    // -------------------------------------------------------------
    // 2. מעבר שאלות רציף ללא בקשת אישור (מעבר מיידי בלחיצה)
    // -------------------------------------------------------------

    // שאלה 01: פתיח ראשי + שאלה q01
    if (!q01) {
        return res.send('id_list_message=f-quiz_intro&read=f-q01=q01,no,1,1,7,Number,no,no,1.2.3');
    }

    // שאלות 02 עד 14
    if (!q02) return res.send('read=f-q02=q02,no,1,1,7,Number,no,no,1.2.3');
    if (!q03) return res.send('read=f-q03=q03,no,1,1,7,Number,no,no,1.2.3');
    if (!q04) return res.send('read=f-q04=q04,no,1,1,7,Number,no,no,1.2.3');
    if (!q05) return res.send('read=f-q05=q05,no,1,1,7,Number,no,no,1.2.3');
    if (!q06) return res.send('read=f-q06=q06,no,1,1,7,Number,no,no,1.2.3');
    if (!q07) return res.send('read=f-q07=q07,no,1,1,7,Number,no,no,1.2.3');
    if (!q08) return res.send('read=f-q08=q08,no,1,1,7,Number,no,no,1.2.3');
    if (!q09) return res.send('read=f-q09=q09,no,1,1,7,Number,no,no,1.2.3');
    if (!q10) return res.send('read=f-q10=q10,no,1,1,7,Number,no,no,1.2.3');
    if (!q11) return res.send('read=f-q11=q11,no,1,1,7,Number,no,no,1.2.3');
    if (!q12) return res.send('read=f-q12=q12,no,1,1,7,Number,no,no,1.2.3');
    if (!q13) return res.send('read=f-q13=q13,no,1,1,7,Number,no,no,1.2.3');
    if (!q14) return res.send('read=f-q14=q14,no,1,1,7,Number,no,no,1.2.3');

    // שאלה 15: מעברון חלק ג' + שאלה q15
    if (!q15) {
        return res.send('id_list_message=f-mid_intro3&read=f-q15=q15,no,1,1,7,Number,no,no,1.2.3');
    }

    // שאלות 16 ו-17
    if (!q16) return res.send('read=f-q16=q16,no,1,1,7,Number,no,no,1.2.3');
    if (!q17) return res.send('read=f-q17=q17,no,1,1,7,Number,no,no,1.2.3');

    // -------------------------------------------------------------
    // 3. שלב סיום: חישוב תוצאות מדויק
    // -------------------------------------------------------------
    const scores = {
        m_accounting: 0,
        m_graphics: 0,
        m_tech: 0,
        m_education: 0,
        m_sewing: 0,
        m_marketing: 0,
        m_hr: 0
    };

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
        if (q.ans === '1') scores[q.a] += 1;
        else if (q.ans === '2') scores[q.b] += 1;
        else if (q.ans === '3') {
            scores[q.a] += 0.5;
            scores[q.b] += 0.5;
        }
    });

    const sortedMajors = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

    const playList = [
        'quiz_results',
        sortedMajors[0],
        sortedMajors[1],
        sortedMajors[2]
    ];

    if (q15 === '1' || q17 === '1') playList.push('warning_social');
    if (q16 === '1') playList.push('info_minimal_load');
    if (q15 === '2' && q17 === '2') playList.push('info_independent');

    const idListMessage = playList.map(file => `f-${file}`).join('.');
    return res.send(`id_list_message=${idListMessage}&go_to_folder=/0/4/2`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
