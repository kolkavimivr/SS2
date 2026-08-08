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
     * @param {string} messagePart - החלק הראשון (הודעה להשמעה, כגון 't-אנא הקישו קוד')
     * @param {string} inputPart - החלק השני (הגדרת הקלט/הקשה, כגון 'val_name,,4,1,7,Number,yes,no,*\/')
     */
    addRead(messagePart, inputPart) {
        // שרשור לא נתמך בפקודת read, לכן זו תהיה הפקודה היחידה בתגובה
        this.commands = [`read=${messagePart}=${inputPart}`];
        return this;
    }

    /**
     * העברת המשתמש לשלוחה אחרת (go_to_folder)
     * @param {string} folder - נתיב השלוחה (לדוגמה '3' או '/1/5')
     */
    goToFolder(folder) {
        this.commands.push(`go_to_folder=${folder}`);
        return this;
    }

    /**
     * העברה לשלוחה והשמעת קובץ מנקודת עצירה (go_to_folder_and_play)
     * @param {string} folder - נתיב השלוחה
     * @param {string} file - שם הקובץ או נתיב מלא
     * @param {number} ms - נקודת עצירה באלפיות שניה
     */
    goToFolderAndPlay(folder, file, ms) {
        this.commands.push(`go_to_folder_and_play=${folder},${file},${ms}`);
        return this;
    }

    /**
     * ניתוב שיחה למספר ישראלי (routing)
     * @param {string} phones - מספרים לחיוג מופרדים בנקודה
     * @param {Object} options - הגדרות נוספות לניתוב
     */
    routing(phones, options = {}) {
        const params = [
            phones,
            options.routingStart || '',
            '', // routing_tor (לא פעיל)
            options.multiple ? 'yes' : '',
            options.multipleNumbers || '',
            options.yourId || '',
            options.record || '',
            '', // send_sms_befor_routing (לא פעיל)
            options.endTime || '',
            options.endGoto || '',
            options.musicOnHold || '',
            options.answerPlay || '',
            options.answerTfr || '',
            options.answerTfrHangupGoto || '',
            options.emailAddress || '',
            options.emailName || ''
        ];
        this.commands.push(`routing=${params.join(',')}`);
        return this;
    }

    /**
     * ניתוב למערכת אחרת בימות המשיח (routing_yemot)
     * @param {string} systemPhone - מספר המערכת
     */
    routingYemot(systemPhone) {
        this.commands.push(`routing_yemot=${systemPhone}`);
        return this;
    }

    /**
     * מעבר לסליקת אשראי (credit_card)
     * @param {Array} creditCardParams - פרמטרים לפי סדר התקן
     */
    creditCard(creditCardParams) {
        this.commands.push(`credit_card=${creditCardParams.join(',')}`);
        return this;
    }

    /**
     * השמעת מוזיקה בהמתנה (music_on_hold)
     * @param {string} music - שם המוזיקה להשמעה
     * @param {number} [seconds] - זמן בשניות
     */
    musicOnHold(music, seconds) {
        const val = seconds ? `${music},${seconds}` : music;
        this.commands.push(`music_on_hold=${val}`);
        return this;
    }

    /**
     * מחזיר תשובה פשוטה (למשל 'OK')
     * @param {string} text 
     */
    setTextResponse(text) {
        this.commands = [text];
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
    // איחוד נתוני GET ו-POST
    const params = { ...req.query, ...req.body };

    // הגדרת Header של טקסט פשוט בלבד כנדרש בתקן
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // אבחנה בניתוק שיחה (hangup=yes)
    if (params.hangup === 'yes') {
        console.log(`Call disconnected on extension ${params.ApiHangupExtension} for CallID ${params.ApiCallId}`);
        // בניתוק אין צורך להחזיר פקודות קוליות
        return res.send('OK');
    }

    const response = new YemotResponse();

    // חילוץ פרמטרי השיחה הנכנסים
    const { ApiCallId, ApiPhone, ApiDID, ApiExtension, ApiEnterID } = params;

    console.log(`Incoming call from ${ApiPhone} on DID ${ApiDID}, Extension: ${ApiExtension}`);

    // דיאלוג רב-שלבי באמצעות read
    if (params.user_id) {
        // המשתמש כבר הקיש תעודת זהות בשלב קודם
        console.log(`Received user_id: ${params.user_id}`);
        
        response.addMessage([
            't-תודה רבה',
            `n-${params.user_id}`,
            't-נתוניך התקבלו בהצלחה'
        ]).goToFolder('/1');

    } else {
        // שלב ראשון: בקשת תעודת זהות מהמשתמש
        // פורמט read: read=הודעה=שם_פרמטר,האם_להשתמש_בקיים,מקסימום,מינימום,זמן,סוג_השמעה...
        response.addRead(
            't-שלום וברכה, אנא הקישו את מספר תעודת הזהות שלכם ולאחריה סולמית',
            'user_id,yes,9,8,7,TeudatZehut,yes,no,*'
        );
    }

    // שליחת התשובה בפורמט טקסט פשוט
    return res.send(response.build());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Yemot API Server running on port ${PORT}`);
});
