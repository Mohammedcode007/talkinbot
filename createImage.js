const { createCanvas } = require('canvas');
const fs = require('fs');

/**
 * دالة لإنشاء صورة مربعة زرقاء وحفظها في المسار المحدد.
 * @param {string} outputPath المسار الذي سيتم حفظ الصورة فيه.
 */
function createBlueSquareImage(outputPath) {
    // تحديد أبعاد الصورة
    const width = 500;  // العرض
    const height = 500; // الارتفاع

    // إنشاء القماش (canvas)
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ملء الخلفية باللون الأبيض
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // رسم مربع أزرق في المنتصف
    const squareSize = 200; // حجم المربع
    const squareX = (width - squareSize) / 2; // إحداثيات المربع X
    const squareY = (height - squareSize) / 2; // إحداثيات المربع Y
    ctx.fillStyle = 'blue'; // تحديد اللون الأزرق
    ctx.fillRect(squareX, squareY, squareSize, squareSize);

    // التأكد من أن المجلد "ImagesServers" موجود
    fs.mkdirSync('C:/ImagesServers', { recursive: true });

    // حفظ الصورة إلى الملف
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on('finish', () => {
        console.log('تم إنشاء الصورة وحفظها في ' + outputPath);
    });
}

// تصدير الدالة للاستخدام في ملف index.js
module.exports = createBlueSquareImage;
