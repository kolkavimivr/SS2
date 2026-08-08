const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// נקודת קצה בסיסית לבדיקת חיבור
app.all('/yemot-api', (req, res) => {
    // הגדרת Header חובה לפי התקן
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // הדפסת הפרמטרים הנכנסים ללוג ב-Render
    console.log('Received Query:', req.query);
    console.log('Received Body:', req.body);

    // מענה טקסט פשוט ונקי בלבד
    return res.send('id_list_message=t-שלום עולם, החיבור לשרת עובד בהצלחה&go_to_folder=/1');
});

// הגדרת פורט תואם ל-Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
