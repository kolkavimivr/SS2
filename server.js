const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/survey', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const step = parseInt(req.query.step || '0', 10);
  const userVal = req.query.val || '';

  // קליטת התשובות מהשלבים הקודמים (שימוש ב-v עבור כל המשתנים)
  let v01 = req.query.v01 || '';
  let v02 = req.query.v02 || '';
  let v03 = req.query.v03 || '';
  let v04 = req.query.v04 || '';
  let v05 = req.query.v05 || '';
  let v11 = req.query.v11 || '';
  let v16 = req.query.v16 || '';
  let v17 = req.query.v17 || '';
  let v18 = req.query.v18 || '';

  // פונקציית עזר לשרשור הפרמטרים לשלב הבא
  const buildQuery = (nextStep, updated) => {
    const params = new URLSearchParams({
      step: nextStep,
      v01: updated.v01 !== undefined ? updated.v01 : v01,
      v02: updated.v02 !== undefined ? updated.v02 : v02,
      v03: updated.v03 !== undefined ? updated.v03 : v03,
      v04: updated.v04 !== undefined ? updated.v04 : v04,
      v05: updated.v05 !== undefined ? updated.v05 : v05,
      v11: updated.v11 !== undefined ? updated.v11 : v11,
      v16: updated.v16 !== undefined ? updated.v16 : v16,
      v17: updated.v17 !== undefined ? updated.v17 : v17,
      v18: updated.v18 !== undefined ? updated.v18 : v18
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
    // השמעת שאלה 1 (v001.wav)
    const q = buildQuery(2, {});
    return res.send(`read=f-v001=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 2) {
    // שמירת שאלה 1 + השמעת שאלה 2 (v002.wav)
    const q = buildQuery(3, { v01: userVal });
    return res.send(`read=f-v002=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 3) {
    // שמירת שאלה 2 + השמעת שאלה 3 (v003.wav)
    const q = buildQuery(4, { v02: userVal });
    return res.send(`read=f-v003=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 4) {
    // שמירת שאלה 3 + השמעת שאלה 4 (v004.wav)
    const q = buildQuery(5, { v03: userVal });
    return res.send(`read=f-v004=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 5) {
    // שמירת שאלה 4 + השמעת שאלה 5 (v005.wav)
    const q = buildQuery(11, { v04: userVal });
    return res.send(`read=f-v005=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  // -------------------------------------------------------------
  // חלק ב': העדפות עבודה וסביבת לימודים (שאלה 11)
  // -------------------------------------------------------------
  if (step === 11) {
    // שמירת שאלה 5 + השמעת שאלה 11 (v011.wav)
    const q = buildQuery(16, { v05: userVal });
    return res.send(`read=f-v011=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  // -------------------------------------------------------------
  // חלק ג': סגנון בחירה ועצמאות (שאלות 16-18)
  // -------------------------------------------------------------
  if (step === 16) {
    // שמירת שאלה 11 + מעברון mid_intro3 + השמעת שאלה 16 (v016.wav)
    const q = buildQuery(17, { v11: userVal });
    return res.send(`read=f-mid_intro3,f-v016=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 17) {
    // שמירת שאלה 16 + השמעת שאלה 17 (v017.wav)
    const q = buildQuery(18, { v16: userVal });
    return res.send(`read=f-v017=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  if (step === 18) {
    // שמירת שאלה 17 + השמעת שאלה 18 (v018.wav)
    const q = buildQuery(19, { v17: userVal });
    return res.send(`read=f-v018=val,no,1,1,5,Stt,no,1,2,3&${q}`);
  }

  // -------------------------------------------------------------
  // שלב סיום: חישוב 3 המגמות המומלצות + משוב דינמי
  // -------------------------------------------------------------
  if (step === 19) {
    v18 = userVal;

    // 1. ניקוד 5 המגמות
    const scores = {
      m_accounting: 0, // חשבונאות
      m_tech: 0,       // תקשוב
      m_graphics: 0,   // גרפיקה
      m_education: 0,  // חינוך
      m_sewing: 0      // תפירה
    };

    // ניתוח חלק א'
    if (v01 === '1') scores.m_accounting += 2;
    if (v01 === '2') { scores.m_education += 0.5; scores.m_graphics += 0.5; }

    if (v02 === '1') scores.m_tech += 2;

    if (v03 === '1') scores.m_graphics += 2;

    if (v04 === '1') scores.m_education += 2;
    if (v04 === '2') { scores.m_tech += 0.5; scores.m_accounting += 0.5; }

    if (v05 === '1') scores.m_sewing += 2;

    // ניתוח חלק ב' (סגנון לימוד)
    if (v11 === '1') {
      scores.m_accounting += 1;
      scores.m_tech += 1;
    } else if (v11 === '2') {
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
    if (v16 === '1' || v18 === '1') {
      playList.push('warning_social');
    }
    if (v17 === '1') {
      playList.push('info_minimal_load');
    }
    if (v16 === '2' && v18 === '2') {
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
