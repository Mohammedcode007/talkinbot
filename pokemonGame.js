const fs = require("fs");
const path = require("path");

// مسار ملف JSON
const dataPath = path.join(__dirname, "pokemonPlayersData.json");

// قراءة أو إنشاء ملف JSON
let gameData = {
  users: []
};

if (fs.existsSync(dataPath)) {
  gameData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
} else {
  fs.writeFileSync(dataPath, JSON.stringify(gameData, null, 2), "utf8");
}

// حفظ البيانات
function saveData() {
  fs.writeFileSync(dataPath, JSON.stringify(gameData, null, 2), "utf8");
}

// قائمة الوحوش المتاحة
const availableMonsters = [
    { name: "Pikachu", power: 50, image: "https://example.com/images/pikachu.png" },
    { name: "Charmander", power: 60, image: "https://example.com/images/charmander.png" },
    { name: "Bulbasaur", power: 55, image: "https://example.com/images/bulbasaur.png" },
    { name: "Squirtle", power: 58, image: "https://example.com/images/squirtle.png" }
  ];
  
// إضافة لاعب جديد
function addPlayer(username) {
  if (gameData.users.some(user => user.username === username)) {
    return `⚠️ اللاعب ${username} موجود بالفعل.`;
  }

  if (gameData.users.length >= 2) {
    return "🚫 اللعبة تدعم لاعبين فقط.";
  }

  gameData.users.push({
    username,
    points: 100,
    monsters: []
  });

  saveData();
  return `✅ تم إضافة اللاعب ${username} بنجاح!`;
}

// أمر /catch
function handleCatch(username) {
    const player = gameData.users.find(user => user.username === username);
  
    if (!player) {
      return "❌ اللاعب غير موجود.";
    }
  
    // اختيار وحش عشوائي
    const randomMonster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
  
    // إضافة الوحش إلى اللاعب
    player.monsters.push({
      name: randomMonster.name,
      power: randomMonster.power,
      image: randomMonster.image
    });
  
    saveData();
  
    return `🎉 تم الإمساك بالوحش ${randomMonster.name}! القوة: ${randomMonster.power}. الصورة: ${randomMonster.image}`;
  }
  

// أمر /battle
function handleBattle(player1, player2) {
  const user1 = gameData.users.find(user => user.username === player1);
  const user2 = gameData.users.find(user => user.username === player2);

  if (!user1 || !user2) {
    return "❌ أحد اللاعبين غير موجود.";
  }

  if (user1.monsters.length === 0 || user2.monsters.length === 0) {
    return "❌ يجب أن يمتلك كل لاعب وحوش لخوض المعركة.";
  }

  const power1 = user1.monsters.reduce((sum, monster) => sum + monster.power, 0);
  const power2 = user2.monsters.reduce((sum, monster) => sum + monster.power, 0);

  if (power1 > power2) {
    user1.points += 50;
    user2.points -= 30;
    saveData();
    return `🏆 ${player1} فاز بالمعركة! النقاط الجديدة: ${user1.points} لـ ${player1} و ${user2.points} لـ ${player2}.`;
  } else if (power2 > power1) {
    user2.points += 50;
    user1.points -= 30;
    saveData();
    return `🏆 ${player2} فاز بالمعركة! النقاط الجديدة: ${user2.points} لـ ${player2} و ${user1.points} لـ ${player1}.`;
  } else {
    return "🤝 المعركة انتهت بالتعادل!";
  }
}

// أمر /profile
function getProfile(username) {
    const player = gameData.users.find(user => user.username === username);
  
    if (!player) {
      return "❌ اللاعب غير موجود.";
    }
  
    let profileMessage = `📜 الملف الشخصي للاعب ${username}:\n`;
    profileMessage += `✨ الوحوش:\n`;
  
    player.monsters.forEach(monster => {
      profileMessage += `- ${monster.name} (القوة: ${monster.power})\n`;
      profileMessage += `  🖼️ صورة: ${monster.image}\n`;
    });
  
    return profileMessage;
  }
  


// تدريب الوحش
function trainMonster(username, monsterName) {
    const player = gameData.users.find(user => user.username === username);
  
    if (!player) {
      return "❌ اللاعب غير موجود.";
    }
  
    const monster = player.monsters.find(m => m.name.toLowerCase() === monsterName.toLowerCase());
  
    if (!monster) {
      return `❌ الوحش ${monsterName} غير موجود في قائمة ${username}.`;
    }
  
    // تحديد مقدار التدريب
    const trainingPower = Math.floor(Math.random() * 11) + 5; // زيادة بين 5 و 15
    monster.power += trainingPower;
  
    saveData();
  
    return `💪 تم تدريب الوحش ${monster.name}! زادت قوته بمقدار ${trainingPower}، والقوة الحالية: ${monster.power}.`;
  }
  
  module.exports = { addPlayer, handleCatch, handleBattle, getProfile, trainMonster };
  
