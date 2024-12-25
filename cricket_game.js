const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'cricket_game.json');

function readCricketGameData() {
    try {
        // قراءة البيانات الحالية من الملف
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // في حال عدم وجود البيانات أو وجود خطأ، يتم إرجاع كائن فارغ
        console.error('Error reading cricket game data:', err);
        return {};
    }
}

function writeCricketGameData(cricketGameData) {
    try {
        // تحويل البيانات إلى صيغة JSON
        const data = JSON.stringify(cricketGameData, null, 2);
        
        // كتابة البيانات الجديدة إلى الملف
        fs.writeFileSync(filePath, data, 'utf8');
        console.log('Cricket game data saved successfully.');
    } catch (err) {
        console.error('Error saving cricket game data:', err);
    }
}

module.exports = { readCricketGameData, writeCricketGameData };

