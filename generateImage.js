const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

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

// دالة لإعادة رسم الصورة من البداية (إعادة تعيين الصورة)
function resetImage() {
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

// دالة لحفظ الصورة مع شطب عدة أرقام ورسم الخطوط
function saveImage(numbersToCrossOut) {
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

      // إذا كان الرقم من الأرقام التي نريد شطبها، نرسم خطًا عبره
      if (numbersToCrossOut.includes(number)) {
        ctx.strokeStyle = 'red'; // تحديد لون الخط
        ctx.lineWidth = 5; // تحديد سمك الخط
        ctx.beginPath();
        ctx.moveTo(smallX, smallY); // نقطة البداية للخط
        ctx.lineTo(smallX + smallSquareSize, smallY + smallSquareSize); // نقطة النهاية للخط
        ctx.stroke();
      }
    }
  }

  // التحقق إذا كانت الأرقام المرسلة تمثل صفًا أو عمودًا
  const rowNumbers = numbersToCrossOut.filter(num => Math.floor((num - 1) / 5) === Math.floor((numbersToCrossOut[0] - 1) / 5));
  const colNumbers = numbersToCrossOut.filter(num => (num - 1) % 5 === (numbersToCrossOut[0] - 1) % 5);

  // رسم الخط عبر الصف إذا كانت الأرقام تمثل صفًا
  if (rowNumbers.length === 5) {
    const row = Math.floor((rowNumbers[0] - 1) / 5);
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, row * squareSize + squareSize / 2);
    ctx.lineTo(canvasSize, row * squareSize + squareSize / 2);
    ctx.stroke();
  }

  // رسم الخط عبر العمود إذا كانت الأرقام تمثل عمودًا
  if (colNumbers.length === 5) {
    const col = (colNumbers[0] - 1) % 5;
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(col * squareSize + squareSize / 2, 0);
    ctx.lineTo(col * squareSize + squareSize / 2, canvasSize);
    ctx.stroke();
  }

  // إضافة كلمة WIN في حالة وجود صف أو عمود كامل
  if (rowNumbers.length === 5 || colNumbers.length === 5) {
    ctx.fillStyle = 'green';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;  // خط عريض
    ctx.strokeText('WIN', canvasSize / 2, canvasSize / 2); // رسم النص بخط عريض
    ctx.fillText('WIN', canvasSize / 2, canvasSize / 2); // ملء النص
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
