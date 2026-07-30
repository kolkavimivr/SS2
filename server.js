const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/survey', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const phone = req.query.ApiPhone || 'anonymous';
  const step = parseInt(req.query.step || '0', 10);
  const userVal = req.query.val || '';

  let q16 = req.query.q16 || '';
  let q17 = req.query.q17 || '';
  let q18 = req.query.q18 || '';

  // שלב 0: השמעת פתיח ומעבר לשאלה הראשונה
  if (step === 0) {
    return res.send('read=f-quiz_intro=val,no,1,1,5,Stt,no,1,2,3&step=1');
  }

  // שלבים 1 עד 15: שאלות חלק א' וב'
  if (step >= 1 && step <= 15) {
    const nextStep = step + 1;
    const fileNum = String(step).padStart(3, '0');
    return res.send(`read=f-v${fileNum}=val,no,1,1,5,Stt,no,1,2,3&step=${nextStep}&q16=${q16}&q17=${q17}&q18=${q18}`);
  }

  // שלב 16: שאלה 16 (נטייה חברתית)
  if (step === 16) {
    if (!req.query.val) {
      return res.send(`read=f-v016=val,no,1,1,5,Stt,no,1,2,3&step=16&q16=${q16}&q17=${q17}&q18=${q18}`);
    }
    q16 = userVal;
    return res.send(`read=f-v017=val,no,1,1,5,Stt,no,1,2,3&step=17&q16=${q16}&q17=${q17}&q18=${q18}`);
  }

  // שלב 17: שאלה 17 (עומס מינימלי)
  if (step === 17) {
    q17 = userVal;
    return res.send(`read=f-v018=val,no,1,1,5,Stt,no,1,2,3&step=18&q16=${q16}&q17=${q17}&q18=${q18}`);
  }

  // שלב 18: שאלה 18 (קונפורמיזם) וסיכום
  if (step === 18) {
    q18 = userVal;

    let feedbackFile = 'info_independent';

    if (q16 === '1' || q18 === '1') {
      feedbackFile = 'warning_social';
    } else if (q17 === '1') {
      feedbackFile = 'info_minimal_load';
    }

    return res.send(`id_list_message=f-${feedbackFile}&go_to_folder=/0/3`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
