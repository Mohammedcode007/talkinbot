const fs = require('fs');

const filePath = './verifyusers.json';

// Function to reset points and assets for all users
function resetPointsAndAssets() {
    try {
        // قراءة البيانات من الملف بشكل تزامني
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const users = JSON.parse(rawData);

        // التأكد من أن البيانات تم تحميلها
        console.log("Data loaded successfully.");

        // تحديث النقاط والأصول لكل مستخدم
        users.forEach(user => {
            user.points = 0; // تصفير النقاط
            console.log(`User: ${user.name}, Points reset to: ${user.points}`);

            // التأكد من وجود الأصول (assets) وتحديثها
            if (user.assets && typeof user.assets === 'object') {
                Object.keys(user.assets).forEach(asset => {
                    user.assets[asset] = 0; // تصفير كل أصل
                });
            } else {
                user.assets = {}; // إنشاء كائن أصول فارغ إذا لم يكن موجودًا
            }
        });

        // كتابة البيانات المحدثة إلى الملف بشكل تزامني
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
        console.log('All user points and assets have been reset to 0.');

    } catch (err) {
        console.error('Error reading or writing to file:', err);
    }
}

// تشغيل الدالة لإعادة تعيين البيانات


function getArrayLength(array) {
    return array.length;
}

// Export the function
module.exports = { resetPointsAndAssets, getArrayLength };
