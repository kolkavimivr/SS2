const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * מחלקת עזר לבניית תגובות לפי התקן של ימות המשיח
 */
class YemotResponse {
    constructor() {
        this.commands = [];
    }

    /**
     * השמעת הודעות ונתונים למשתמש (id_list_message)
     * @param {Array<string>|string} messages - הודעות בפורמט התקן (למשל: 't-שלום', 'n-123', 'f-001')
     */
    addMessage(messages) {
        const msgStr = Array.isArray(messages) ? messages.join('.') : messages;
        this.commands.push(`id_list_message=${msgStr}`);
        return this;
    }

    /**
     * קבלת נתונים מהמשתמש (read)
     * @param {string} messagePart - החלק הראשון (הודעה להשמעה)
     * @param {string} inputPart - החלק השני (הגדרת הקלט)
     */
    addRead(messagePart, inputPart) {
        // פקודת read אינה תומכת בשרשור פקודות נוספות
        this.commands = [`read=${messagePart}=${inputPart}`];
        return this;
    }

    /**
     * העברת המשתמש לשלוחה אחרת (go_to_folder)
     * @param {string} folder - נתיב השלוחה (למשל '3' או '/1/5')
     */
    goToFolder(folder) {
        this.commands.push(`go_to_folder=${folder}`);
        return this;
    }

    /**
     * ניתוב שיחה למספר אחר (routing)
     */
    routing(phones) {
        this.commands.push(`routing=${phones}`);
        return this;
    }

    /**
     * מעבר לסליקת אשראי (credit_card)
     */
    creditCard(creditCardParams) {
        this.commands.push(`credit_card=${creditCardParams.join(',')}`);
        return this;
    }

    /**
     * הפיכת האובייקט למחרוזת טקסט פשוטה בהתאם לתקן
     */
    build() {
        return this.commands.join('&');
    }
}

// נקודת קצה לטיפול בפניות ה-API של ימות המשיח (תמיכה ב-GET ו-POST)
app.all('/yemot-api', (req, res) => {
    // הגדרת Header של טקסט פשוט בלבד כנדרש בתקן ימות המשיח
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    try {
        // איחוד נתוני GET ו-POST
        const params = { ...req.query, ...req.body };

        // זיהוי ניתוק שיחה (hangup=yes)
        if (params.hangup === 'yes') {
            console.log(`Call disconnected on extension ${params.ApiHangupExtension} for CallID: ${params.ApiCallId}`);
            return res.send('OK');
        }

        const response = new YemotResponse();

        // חילוץ פרמטרים בסיסיים
        const { ApiCallId, ApiPhone, ApiDID, ApiExtension } = params;
        console.log(`Incoming call from ${ApiPhone} on DID ${ApiDID}, Extension: ${ApiExtension}`);

        // דוגמה לדיאלוג רב-שלבי:
        if (params.user_id) {
            // במידה וכבר התקבל הקלט בשלב הקודם
            console.log(`Received user_id: ${params.user_id}`);
            
            response.addMessage([
                't-תודה רבה',
                `n-${params.user_id}`,
                't-נתוניך התקבלו בהצלחה'
            ]).goToFolder('/1');

        } else {
            // שלב ראשון: בקשת תעודת זהות
            response.addRead(
                't-שלום וברכה, אנא הקישו את מספר תעודת הזהות שלכם ולאחריה סולמית',
                'user_id,yes,9,8,7,TeudatZehut,yes,no,*'
            );
        }

        // שליחת התשובה בפורמט טקסט פשוט
        return res.send(response.build());

    } catch (error) {
        console.error("Server Error:", error);
        // מניעת קריסה והחזרת תשובה קולית במקום HTML
        return res.send('id_list_message=t-אירעה שגיאה בעיבוד הנתונים&go_to_folder=/0');
    }
});

// הגדרת האזנה לפורט דינמי המותאם ל-Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Yemot API Server running on port ${PORT}`);
});
