const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

/**
 * دالة لإنشاء صورة تخص وحش معين مع اسم، وصف، ونقاط قوته.
 * @param {string} outputPath المسار الذي سيتم حفظ الصورة فيه.
 * @param {string} monsterName اسم الوحش.
 * @param {string} description وصف الوحش.
 * @param {number} power نقاط قوة الوحش.
 */
function createMonsterImage(outputPath, monsterName, description, power) {
    // تحديد أبعاد الصورة
    const width = 500; // العرض
    const height = 500; // الارتفاع

    // إنشاء القماش (canvas)
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ملء الخلفية باللون الأبيض
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // رسم مستطيل مزخرف (يمكن تغييره ليعكس هوية الوحش)
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(20, 20, width - 40, height - 40);

    // إضافة اسم الوحش
    ctx.fillStyle = 'black';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(monsterName, width / 2, 50);

    // إضافة الوصف
    ctx.font = '20px Arial';
    ctx.fillStyle = 'darkgray';
    ctx.textAlign = 'center';
    ctx.fillText(description, width / 2, 100);

    // إضافة نقاط القوة
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'green';
    ctx.fillText(`Power: ${power}`, width / 2, 150);

    // رسم شكل مختلف لكل وحش (دائرة بلون عشوائي)
    const circleX = width / 2;
    const circleY = height / 2;
    const circleRadius = 100;
    ctx.fillStyle = getRandomColor();
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // التأكد من أن المجلد "ImagesServers" موجود
    fs.mkdirSync('C:/ImagesServers', { recursive: true });

    // حفظ الصورة إلى الملف
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on('finish', () => {
        console.log(`تم إنشاء صورة للوحش "${monsterName}" وحفظها في ${outputPath}`);
    });
}

/**
 * دالة للحصول على لون عشوائي.
 * @returns {string} اللون العشوائي بصيغة HEX.
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// تصدير الدالة للاستخدام في ملف index.js
module.exports = createMonsterImage;
