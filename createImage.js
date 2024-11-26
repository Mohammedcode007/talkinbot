// canvasUtils.js

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

// دالة لإنشاء Canvas مع خلفية مخصصة
function createCanvasWithBackground(backgroundImagePath, overlayImageUrl, outputImagePath) {
    loadImage(backgroundImagePath).then((backgroundImage) => {
        // تحديد أبعاد الـ Canvas بناءً على أبعاد الصورة الخلفية
        const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
        const ctx = canvas.getContext('2d');

        // رسم الخلفية (القمر)
        ctx.drawImage(backgroundImage, 0, 0);

        // تحميل الصورة التي ستظهر فوق القمر
        loadImage(overlayImageUrl).then((overlayImage) => {
            // ضبط الشفافية (جعل الصورة شبه شفافة)
            ctx.globalAlpha = 0.5;  // 0.5 تعني أن الصورة ستكون بنسبة 50% شفافة

            // رسم الصورة الثانية فوق القمر
            const x = (canvas.width - overlayImage.width) / 2;  // لتحديد المكان في وسط الصورة
            const y = (canvas.height - overlayImage.height) / 2; // لتحديد المكان في وسط الصورة
            ctx.drawImage(overlayImage, x, y);

            // حفظ الصورة الناتجة
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputImagePath, buffer);
            console.log('تم إنشاء الصورة بنجاح!');
        }).catch(err => {
            console.error('خطأ في تحميل الصورة الثانية:', err);
        });
    }).catch(err => {
        console.error('خطأ في تحميل الصورة الخلفية:', err);
    });
}

module.exports = createCanvasWithBackground;
