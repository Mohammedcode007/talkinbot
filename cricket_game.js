const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'cricket_game.json');

// دالة لقراءة البيانات من الملف
function readCricketGameData() {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        // التحقق إذا كانت البيانات فارغة أو غير صالحة
        if (data) {
            return JSON.parse(data);
        }
        return {}; // إذا كانت البيانات فارغة، نعيد هيكل بيانات فارغ
    } catch (err) {
        if (err.code === 'ENOENT') {
            // إنشاء ملف فارغ إذا لم يكن موجودًا
            fs.writeFileSync(filePath, '{}', 'utf8');
            return {};  // إرجاع هيكل بيانات فارغ في حال كان الملف غير موجود
        } else if (err.name === 'SyntaxError') {
            console.error('Error parsing cricket game data. Invalid JSON format.');
            return {};  // في حالة وجود خطأ في التنسيق، نعيد هيكل بيانات فارغ
        }
        console.error('Error reading cricket game data:', err);
        return {};  // إرجاع هيكل بيانات فارغ في حال حدوث أي خطأ آخر
    }
}

// دالة لحفظ البيانات في الملف
function writeCricketGameData(cricketGameData) {
    try {
        // تحويل البيانات إلى صيغة JSON
        const data = JSON.stringify(cricketGameData, null, 2);
        // كتابة البيانات الجديدة إلى الملف
        fs.writeFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error('Error saving cricket game data:', err);
    }
}

// دالة لمسح (حذف) الملف
function deleteCricketGameData() {
    try {
        // مسح محتويات الملف
        fs.truncateSync(filePath, 0); // يعيد تعيين حجم الملف إلى 0
        console.log('Cricket game data deleted successfully.');
    } catch (err) {
        console.error('Error deleting cricket game data:', err);
    }
}

function writeCricketGameDataTime(data) {
    Object.values(data).forEach(game => {
        // إزالة timeout من البيانات قبل حفظها
        if (game.timeoutId) {
            clearTimeout(game.timeoutId);  // إلغاء الـ timeout
            delete game.timeoutId;  // إزالة الـ timeout
        }
    });
    fs.writeFileSync(filePath, JSON.stringify(data));
}


module.exports = { readCricketGameData, writeCricketGameData, deleteCricketGameData,writeCricketGameDataTime };
