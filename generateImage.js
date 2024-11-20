const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// إعدادات الرسم
const canvasSize = 500; // حجم الصورة
const squareSize = canvasSize / 5; // حجم كل مربع (5 مربعات في كل صف وعمود)
const smallSquareSize = squareSize / 2; // حجم المربعات الصغيرة التي تحتوي على الأرقام

const canvas = createCanvas(canvasSize, canvasSize);
const ctx = canvas.getContext('2d');

// الأرقام الثابتة من 1 إلى 25
const numbers = [
  1, 2, 3, 4, 5,
  6, 7, 8, 9, 10,
  11, 12, 13, 14, 15,
  16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];

// تحميل صورة الأفتار
async function loadAvatarImage(imageUrl) {
  try {
    return await loadImage(imageUrl);
  } catch (error) {
    console.error('فشل تحميل الصورة:', error);
    return null;
  }
}

// دالة لإعادة رسم الصورة من البداية (إعادة تعيين الصورة)
async function resetImage() {
  // تعيين الخلفية
  ctx.fillStyle = '#f0f0f0'; // خلفية فاتحة
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // رسم المربعات مع الأرقام
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = col * squareSize;
      const y = row * squareSize;

      // رسم المربع الكبير
      ctx.fillStyle = '#3498db'; // لون المربع
      ctx.fillRect(x, y, squareSize, squareSize);

      // رسم المربع الصغير داخل المربع الكبير
      const smallX = x + (squareSize - smallSquareSize) / 2;
      const smallY = y + (squareSize - smallSquareSize) / 2;
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(smallX, smallY, smallSquareSize, smallSquareSize);

      // إضافة الرقم الثابت داخل المربع الصغير
      const number = numbers[row * 5 + col];
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number, smallX + smallSquareSize / 2, smallY + smallSquareSize / 2);
    }
  }

  // تحديد مسار المجلد
  const imagesFolder = path.join(__dirname, 'images');

  // التأكد من أن المجلد موجود
  if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder, { recursive: true }); // إنشاء المجلد إذا لم يكن موجودًا
  }

  // حفظ الصورة في المجلد
  const out = fs.createWriteStream(path.join(imagesFolder, 'squares_image.png'));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('تم حفظ الصورة بنجاح بعد إعادة تعيينها في مجلد images.'));
}

// دالة لحفظ الصورة مع شطب عدة أرقام ورسم صورة أفتار
async function saveImage(numbersToCrossOut, avatarUrl) {
  // تحميل صورة الأفتار
  const avatarImage = await loadAvatarImage(avatarUrl);
  if (!avatarImage) {
    console.log('لم يتم تحميل صورة الأفتار، سيتم استخدام الخط الأحمر.');
    return;
  }

  // إعادة رسم المربعات مع الأرقام كما في الرسم الأساسي
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = col * squareSize;
      const y = row * squareSize;

      // رسم المربع الكبير
      ctx.fillStyle = '#3498db'; // لون المربع
      ctx.fillRect(x, y, squareSize, squareSize);

      // رسم المربع الصغير داخل المربع الكبير
      const smallX = x + (squareSize - smallSquareSize) / 2;
      const smallY = y + (squareSize - smallSquareSize) / 2;
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(smallX, smallY, smallSquareSize, smallSquareSize);

      // إضافة الرقم الثابت داخل المربع الصغير
      const number = numbers[row * 5 + col];
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number, smallX + smallSquareSize / 2, smallY + smallSquareSize / 2);

      // إذا كان الرقم من الأرقام التي نريد شطبها، نرسم صورة الأفتار
      if (numbersToCrossOut.includes(number)) {
        // رسم صورة الأفتار على المربع
        const avatarSize = smallSquareSize;
        ctx.drawImage(avatarImage, smallX, smallY, avatarSize, avatarSize);
      }
    }
  }

  // تحديد مسار المجلد
  const imagesFolder = path.join(__dirname, 'images');

  // التأكد من أن المجلد موجود
  if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder, { recursive: true }); // إنشاء المجلد إذا لم يكن موجودًا
  }

  // حفظ الصورة في المجلد
  const out = fs.createWriteStream(path.join(imagesFolder, 'squares_image.png'));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log(`تم حفظ الصورة بنجاح بعد شطب الأرقام ${numbersToCrossOut.join(', ')} في مجلد images.`));
}

// تصدير الدوال
module.exports = { saveImage, resetImage };
