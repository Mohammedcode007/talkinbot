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
            console.log(`User: ${user.username}, Points reset to: ${user.points}`);

            // التأكد من وجود الأصول (assets) وتحديثها
            if (user.assets && typeof user.assets === 'object') {
                Object.keys(user.assets).forEach(asset => {
                    user.assets[asset] = 0; // تصفير كل أصل
                    console.log(`Asset: ${asset}, Reset to: 0 for User: ${user.username}`);
                });
            } else {
                user.assets = {}; // إنشاء كائن أصول فارغ إذا لم يكن موجودًا
                console.log(`Assets initialized as empty object for User: ${user.username}`);
            }
        });

        // كتابة البيانات المحدثة إلى الملف بشكل تزامني
        try {
            fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
            console.log('All user points and assets have been reset to 0.');
        } catch (writeError) {
            console.error('Error writing to file:', writeError);
        }

        // قراءة البيانات مرة أخرى للتأكد من التحديث
        const updatedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log('Updated Data:', updatedData);

    } catch (err) {
        console.error('Error reading or processing the file:', err);
    }
}

// تشغيل الدالة لإعادة تعيين النقاط والأصول

// Function to get the length of an array
function getArrayLength(array) {
    return array.length;
}

// Export the functions
module.exports = { resetPointsAndAssets, getArrayLength };
