const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;

// دالة لإنشاء Canvas مع خلفية مخصصة
async function createCanvasWithBackground(backgroundImagePath, overlayImageUrl, outputImagePath) {
    try {
        // تحميل الصورة الخلفية
        const backgroundImage = await loadImage(backgroundImagePath);

        // تحديد أبعاد الـ Canvas بناءً على أبعاد الصورة الخلفية
        const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
        const ctx = canvas.getContext('2d');

        // رسم الخلفية
        ctx.drawImage(backgroundImage, 0, 0);

        // تحميل الصورة الثانية
        const overlayImage = await loadImage(overlayImageUrl);

        // تحديد أبعاد الصورة الثانية
        const overlaySize = Math.min(canvas.width, canvas.height) / 2; // حجم الصورة الثانية يكون ربع حجم الخلفية
        const x = (canvas.width - overlaySize) / 2; // لتوسيط الصورة
        const y = (canvas.height - overlaySize) / 2; // لتوسيط الصورة

        // إنشاء مسار دائري للصورة
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + overlaySize / 2, y + overlaySize / 2, overlaySize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // رسم الصورة
        ctx.drawImage(overlayImage, x, y, overlaySize, overlaySize);
        ctx.restore();

        // حفظ الصورة الناتجة
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(outputImagePath, buffer);
        console.log('تم إنشاء الصورة بنجاح!');
    } catch (err) {
        console.error('حدث خطأ أثناء إنشاء الصورة:', err);
    }
}

module.exports = createCanvasWithBackground;
