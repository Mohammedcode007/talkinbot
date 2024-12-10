const fs = require('fs');

// دالة لاختيار فستان عشوائي من الملف JSON
function getRandomItemDress() {
    const dresses = JSON.parse(fs.readFileSync('./dress.json', 'utf8'));
    const randomIndex = Math.floor(Math.random() * dresses.length);
    return dresses[randomIndex];
}

module.exports = getRandomItemDress;
