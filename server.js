const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/survey', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const step = parseInt(req.query.step || '0', 10);
  const userVal = req.query.val || '';

  // קליטת התשובות מהשלבים הקודמים
  let q01 = req.query.q01 || '';
  let q02 = req.query.q02 || '';
  let q03 = req.query.q03 || '';
  let q04 = req.query.q04 || '';
  let q05 = req.query.q05 || '';
  let q11 = req.query.q11 || '';
  let q16 = req.query.q16 || '';
  let q17 = req.query.q17 || '';
  let q18 = req.query.q18 || '';

  // פונקציית עזר לשרשור הפרמטרים לשלב הבא
  const buildQuery = (nextStep, updated) => {
    const params = new URLSearchParams({
      step: nextStep,
      q01: updated.q01 !== undefined ? updated.q01 : q01,
      q02: updated.q02 !== undefined ? updated.q02 : q02,
      q03: updated.q03 !== undefined ? updated.q03 : q03,
      q04: updated.q04 !== undefined ? updated.q04 : q04,
      q05: updated.q05 !== undefined ? updated.q05 : q05,
      q11: updated.q11 !== undefined ? updated.q11 : q11,
      q16: updated.q16 !== undefined ? updated.q16 : q16,
      q17: updated.q17 !== undefined ? updated.q17 : q17,
      q18: updated.q18 !== undefined ? updated.q18 : q18
    });
    return params.toString();
  };

  // -------------------------------------------------------------
  // שלב 0: הודעת פתיחה
  // -------------------------------------------------------------
  if (step === 0) {
    const q = buildQuery(1, {});
    return res.send(`read=f-quiz_intro=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  // -------------------------------------------------------------
  // חלק א': כישורים ונטיות לימודיות (שאלות 1-5)
  // -------------------------------------------------------------
  if (step === 1) {
    // השמעת שאלה 1 (חשבונאות)
    const q = buildQuery(2, {});
    return res.send(`read=f-q01=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 2) {
    // שמירת שאלה 1 + השמעת שאלה 2 (תקשוב)
    const q = buildQuery(3, { q01: userVal });
    return res.send(`read=f-q02=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 3) {
    // שמירת שאלה 2 + השמעת שאלה 3 (גרפיקה)
    const q = buildQuery(4, { q02: userVal });
    return res.send(`read=f-q03=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 4) {
    // שמירת שאלה 3 + השמעת שאלה 4 (חינוך)
    const q = buildQuery(5, { q03: userVal });
    return res.send(`read=f-q04=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 5) {
    // שמירת שאלה 4 + השמעת שאלה 5 (תפירה)
    const q = buildQuery(11, { q04: userVal });
    return res.send(`read=f-q05=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  // -------------------------------------------------------------
  // חלק ב': העדפות עבודה וסביבת לימודים (שאלה 11)
  // -------------------------------------------------------------
  if (step === 11) {
    // שמירת שאלה 5 + השמעת שאלה 11
    const q = buildQuery(16, { q05: userVal });
    return res.send(`read=f-q11=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  // -------------------------------------------------------------
  // חלק ג': סגנון בחירה ועצמאות (שאלות 16-18)
  // -------------------------------------------------------------
  if (step === 16) {
    // שמירת שאלה 11 + מעברון mid_intro3 + השמעת שאלה 16
    const q = buildQuery(17, { q11: userVal });
    return res.send(`read=f-mid_intro3,f-q16=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 17) {
    // שמירת שאלה 16 + השמעת שאלה 17
    const q = buildQuery(18, { q16: userVal });
    return res.send(`read=f-q17=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 18) {
    // שמירת שאלה 17 + השמעת שאלה 18
    const q = buildQuery(19, { q17: userVal });
    return res.send(`read=f-q18=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  // -------------------------------------------------------------
  // שלב סיום: חישוב 3 המגמות המומלצות + משוב דינמי
  // -------------------------------------------------------------
  if (step === 19) {
    q18 = userVal;

    // 1. ניקוד 5 המגמות
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

    // ניתוח חלק ב' (סגנון לימוד)
    if (q11 === '1') {
      scores.m_accounting += 1;
      scores.m_tech += 1;
    } else if (q11 === '2') {
      scores.m_graphics += 1;
      scores.m_sewing += 1;
      scores.m_education += 0.5;
    }

    // מיון המגמות לפי ניקוד ובחירת 3 המובילות
    const sortedMajors = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    const top1 = sortedMajors[0];
    const top2 = sortedMajors[1];
    const top3 = sortedMajors[2];

    // בניה של רשימת קבצי השמע להשמעה ברצף
    const playList = [
      'quiz_results',
      top1,
      top2,
      top3
    ];

    // 2. בדיקת תנאי חלק ג' והוספת קבצי משוב/אזהרה
    if (q16 === '1' || q18 === '1') {
      playList.push('warning_social');
    }
    if (q17 === '1') {
      playList.push('info_minimal_load');
    }
    if (q16 === '2' && q18 === '2') {
      playList.push('info_independent');
    }

    // הרכבת המחרוזת בפורמט id_list_message של ימות המשיח
    const idListMessage = playList.map(file => `f-${file}`).join(',');

    return res.send(`id_list_message=${idListMessage}&go_to_folder=/0/4/2`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
