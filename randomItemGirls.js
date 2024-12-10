const fs = require('fs');

// قراءة ملف JSON
const items = JSON.parse(fs.readFileSync('girlsmarried.json', 'utf8'));
const itemsboy = JSON.parse(fs.readFileSync('boyesmarried.json', 'utf8'));

// دالة لجلب عنصر عشوائي
function getRandomItem() {
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

function getRandomItemBoy() {
    const randomIndex = Math.floor(Math.random() * itemsboy.length);
    return itemsboy[randomIndex];
  }
  

// تصدير الدالة
module.exports = {getRandomItem,getRandomItemBoy};
