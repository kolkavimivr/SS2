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
    // 2. בדיקת שאלות ברצף (כולל בקשת אישור "לאישור הקישו 1")
    // -------------------------------------------------------------

    // שאלה 01: פתיח ראשי + שאלה q01
    if (!params.q01) {
        return res.send('id_list_message=f-quiz_intro&read=f-q01=q01,yes,1,1,7,Number,yes,no,1.2.3');
    }

    // שאלות 02 עד 14
    if (!params.q02) return res.send('read=f-q02=q02,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q03) return res.send('read=f-q03=q03,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q04) return res.send('read=f-q04=q04,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q05) return res.send('read=f-q05=q05,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q06) return res.send('read=f-q06=q06,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q07) return res.send('read=f-q07=q07,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q08) return res.send('read=f-q08=q08,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q09) return res.send('read=f-q09=q09,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q10) return res.send('read=f-q10=q10,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q11) return res.send('read=f-q11=q11,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q12) return res.send('read=f-q12=q12,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q13) return res.send('read=f-q13=q13,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q14) return res.send('read=f-q14=q14,yes,1,1,7,Number,yes,no,1.2.3');

    // שאלה 15: מעברון חלק ג' + שאלה q15
    if (!params.q15) {
        return res.send('id_list_message=f-mid_intro3&read=f-q15=q15,yes,1,1,7,Number,yes,no,1.2.3');
    }

    // שאלות 16 ו-17
    if (!params.q16) return res.send('read=f-q16=q16,yes,1,1,7,Number,yes,no,1.2.3');
    if (!params.q17) return res.send('read=f-q17=q17,yes,1,1,7,Number,yes,no,1.2.3');

    // -------------------------------------------------------------
    // 3. שלב סיום: חישוב תוצאות ומשוב
    // -------------------------------------------------------------
    const { 
        q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, 
        q12, q13, q14, q15, q16, q17 
    } = params;

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
