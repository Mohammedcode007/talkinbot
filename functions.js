const fs = require('fs');
const path = require('path');
const moment = require('moment');  // التأكد من استيراد moment
const BigNumber = require('bignumber.js');




// Define the file path for storing login data
const loginDataFilePath = path.join(__dirname, 'users.json');
const filePathSearch = 'vipSerachProfile.json'; // تأكد من أن اسم الملف صحيح وموجود
const comicFilePath = path.join(__dirname, 'comic.json');

const tebot = path.join(__dirname, 'loginData.json');
const rooms = path.join(__dirname, 'rooms.json');
const USERS_FILE_PATH = path.join(__dirname, 'verifyusers.json');
// تحديد مسار ملف JSON
const filePath = path.join(__dirname, 'blockedUsers.json');

const filePathPlayers = './gameData.json'; // المسار إلى ملف JSON
const {items,hikam} = require('./data');

const bettingFile = './bettingPlayers.json';





// دالة لاختيار صورة عشوائية
function getRandomImageShot() {
    const data = fs.readFileSync('shoting.json', 'utf8');  // قراءة البيانات من ملف JSON بشكل متزامن
    const imagesData = JSON.parse(data);  // تحويل البيانات إلى كائن JSON
    const randomIndex = Math.floor(Math.random() * imagesData.images.length);
    return imagesData.images[randomIndex];  // إرجاع الصورة العشوائية
  }
  
  // كتابة البيانات إلى ملف جديد باستخدام writeFileSync
  function writeImageToFile(image) {
    const outputPath = 'output_image.json';  // تحديد مسار الملف الذي سيتم الكتابة إليه
    const imageData = {
      name: image.name,
      url: image.url,
      points: image.points
    };
  
    // كتابة البيانات إلى الملف بشكل متزامن
    fs.writeFileSync(outputPath, JSON.stringify(imageData, null, 2));  // تحويل الكائن إلى JSON وكتابة إلى الملف
  }

  const questions = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'bold_psychological_questions_1000.json'), 'utf8')
  ).questions;
  
  // تعريف الدالة getRandomQuestion
  function getRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex].text;
  }

  function getRandomComicImage() {
    try {
        const data = fs.readFileSync(comicFilePath, 'utf8');
        const comics = JSON.parse(data);
        if (comics.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * comics.length);
        return comics[randomIndex]; // يعيد الكائن كاملًا { id, url, addedBy }
    } catch (error) {
        console.error('خطأ أثناء قراءة ملف الكوميكس:', error.message);
        return null;
    }
}

function startSendingSpecMessage(socket, users, parsedData) {
    // Send the spec@ message every 2 minutes (120,000 milliseconds)
    const interval = setInterval(() => {
        socket.emit('message', {
            room: parsedData.room,
            body: 'spec@100', // Adjust the bet amount as needed
            from: parsedData.from
        });
    }, 120000); // 2 minutes

    // Ensure the interval is cleared when the user leaves or disconnects
    socket.on('disconnect', () => {
        clearInterval(interval);
    });
}
function readVipFile() {
    try {
        const data = fs.readFileSync('vip.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}
function readVipSearchFile() {
    try {
        const data = fs.readFileSync('vipSerachProfile.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Error reading vip.json, initializing as empty:', error);
        return [];
    }
}

// وظيفة لكتابة بيانات JSON إلى ملف
function writeVipFile(data) {
    try {
        fs.writeFileSync('vip.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log('vip.json updated successfully.');
    } catch (error) {
        console.log('Error writing to vip.json:', error);
    }
}

// Helper function to read the JSON file
function readBettingData() {
    if (!fs.existsSync(bettingFile)) {
        fs.writeFileSync(bettingFile, JSON.stringify({}));
    }
    const data = fs.readFileSync(bettingFile);
    return JSON.parse(data);
}

// Helper function to write to the JSON file
function writeBettingData(data) {
    fs.writeFileSync(bettingFile, JSON.stringify(data, null, 2));
}
function generateUnits(startExp = 3, step = 3, count = 200) {
    const baseNames = [
        'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
        'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
        'Lambda', 'Sigma', 'Omega', 'Nova', 'Lux',
        'Xeno', 'Void', 'Chrono', 'Aether', 'Quant',
        'Hyper', 'Neuro', 'Vortex', 'Cryo', 'Omni',
        'Tera', 'Astro', 'Mega', 'Inferna', 'Prisma'
    ];

    const suffixes = [
        '', 'on', 'ion', 'is', 'us', 'ar', 'ium', 'or', 'ex', 'ix'
    ];

    const units = [];

    for (let i = 0; i < count; i++) {
        const exp = startExp + i * step;
        const nameIndex = i % baseNames.length;
        const suffixIndex = Math.floor(i / baseNames.length) % suffixes.length;

        const name = baseNames[nameIndex] + suffixes[suffixIndex];

        units.unshift({ value: 10 ** exp, suffix: name });
    }

    // ✅ إضافة وحدات مخصصة وهمية بأكبر قيمة ممكنة
    const customUnits = [
        { suffix: "Qu", value: 10 ** 30 },
        { suffix: "Sigmais", value: 10 ** 45 },
        { suffix: "Quantium", value: 10 ** 60 },
        { suffix: "Ultimium", value: 10 ** 150 }, // وحدة ضخمة جدًا
        { suffix: "InfinityCore", value: 10 ** 300 } // أعلى وحدة وهمية
    ];

    for (const custom of customUnits) {
        const alreadyExists = units.some(u => u.suffix === custom.suffix);
        if (!alreadyExists) {
            units.push(custom);
        }
    }

    return units;
}




function formatPoints(input) {
    let points;

    if (typeof input === 'string') {
        points = new BigNumber(input.replace(/,/g, ''));
    } else if (input instanceof BigNumber) {
        points = input;
    } else {
        points = new BigNumber(input);
    }

    if (!points.isFinite() || points.isNaN()) {
        return '0';
    }

    const units = generateUnits();

    // ابحث عن أكبر وحدة أصغر أو تساوي القيمة
    for (const unit of units) {
        const unitVal = new BigNumber(unit.value);
        if (points.isGreaterThanOrEqualTo(unitVal)) {
            const value = points.dividedBy(unitVal);
            // تقريب للنقطة العشرية الأولى، وإزالة الصفر بعد الفاصلة إذا كان صحيح
            let formatted = value.toFixed(1);
            if (formatted.endsWith('.0')) {
                formatted = formatted.slice(0, -2);
            }
            return `${formatted} ${unit.suffix}`;
        }
    }

    return points.toFormat(); // صيغة مع فواصل الآلاف
}








  function getRandomHikma() {
    const randomIndex = Math.floor(Math.random() * hikam.length);
    return hikam[randomIndex].text;
  }

// دالة لتحديث `lasttimegift` إلى الوقت الحالي + 30 ثانية
function updateLastTimeGift(username, currentTime) {
    try {
        const data = fs.readFileSync('verifyusers.json', 'utf8');
        const users = JSON.parse(data);

        const user = users.find((us) => us.username === username);

        if (user) {
            // إذا كانت قيمة `lasttimegift` موجودة ويجب أن ننتظر 30 ثانية قبل التحديث
            if (!user.lasttimegift || moment().diff(moment(user.lasttimegift), 'seconds') >= 30) {
                user.lasttimegift = currentTime;  // حفظ الوقت في `lasttimegift`
                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                // حذف `lasttimegift` بعد 30 ثانية
                setTimeout(() => {
                    removeLastTimeGift(username);
                }, 300000);  // 30000 ميلي ثانية (30 ثانية)
            } else {
            }
        } else {
            console.error(`User ${username} not found`);
        }
    } catch (err) {
        console.error('Error updating lasttimegift:', err);
    }
}



function removeLastTimeGift(username) {
    try {
        const data = fs.readFileSync('verifyusers.json', 'utf8');
        const users = JSON.parse(data);

        const user = users.find((us) => us.username === username);
        const currentTime = moment().local();

        // تحويل وقت الهدية السابقة إلى الوقت المحلي
        if (user) {
            user.lasttimegift = null;  // حذف الوقت
            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
            console.log(`Successfully removed lasttimegift for ${username}`);
        } else {
            console.error(`User ${username} not found`);
        }
    } catch (err) {
        console.error('Error removing lasttimegift:', err);
    }
}

function canSendGift(username) {
    try {
        const data = fs.readFileSync('verifyusers.json', 'utf8');
        const users = JSON.parse(data);

        const user = users.find((us) => us.username === username);

        if (user && user.lasttimegift) {
            const currentTime = moment();
            const lastGiftTime = moment(user.lasttimegift);
            const timeDifference = currentTime.diff(lastGiftTime, 'seconds');  // Difference in seconds

            if (timeDifference < 300) {
                const remainingTime = 300 - timeDifference;
                return `Please wait\n${username} ${remainingTime} seconds to send another gift.`; // User must wait
            }
        }
        return true;  // Can send gift if no lasttimegift or 30 seconds passed
    } catch (err) {
        console.error('Error checking lasttimegift:', err);
        return false;
    }
}







function getRandomNumber() {
    return Math.floor(Math.random() * 25) + 1;
}


function loadPuzzles() {
    const rawData = fs.readFileSync('path_puzzles.json'); // تحديث اسم الملف هنا
    return JSON.parse(rawData);
}
// قراءة البيانات من الملف عند بداية اللعبة
function readGameData() {
    try {
        const data = fs.readFileSync(filePathPlayers, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading game data file:', error);
        return { lastUserWhoSentTreasure: null }; // إذا فشل القراءة، قم بإرجاع قيمة افتراضية
    }
}

// تحديث بيانات اللعبة في ملف JSON
function saveGameData(gameData) {
    try {
        fs.writeFileSync(filePathPlayers, JSON.stringify(gameData, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing to game data file:', error);
    }
}


// قراءة محتوى JSON
function readBlockedUsers() {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data).blocked;
}

// تحديث ملف JSON
function writeBlockedUsers(users) {
    const data = JSON.stringify({ blocked: users }, null, 2);
    fs.writeFileSync(filePath, data, 'utf-8');
}

// 1. إضافة مستخدم جديد
function addBlockedUser(username) {
    const users = readBlockedUsers();
    if (!users.includes(username)) {
        users.push(username);
        writeBlockedUsers(users);
        console.log(`${username} تم إضافته إلى القائمة المحظورة.`);
    } else {
        console.log(`${username} موجود بالفعل في القائمة المحظورة.`);
    }
}

// 2. حذف مستخدم
function deleteBlockedUser(username) {
    let users = readBlockedUsers();
    if (users.includes(username)) {
        users = users.filter(user => user !== username);
        writeBlockedUsers(users);
        console.log(`${username} تم حذفه من القائمة المحظورة.`);
    } else {
        console.log(`${username} غير موجود في القائمة المحظورة.`);
    }
}


// تحميل ملف JSON
const loadImagesData = () => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'imagesGift.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return null;
    }
};

// دالة لاختيار صورة عشوائية من نوع معين
const getRandomImage = (type) => {
    const data = loadImagesData();

    if (data && data[type]) {
        const images = data[type];
        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex].url;
    }

    return null;
};
const isUserInMasterBot = (username) => {
    try {
        const data = fs.readFileSync('masterbot.json', 'utf8');
        const usersInMasterBot = JSON.parse(data);
        return usersInMasterBot.includes(username);
    } catch (error) {
        console.error('Error reading masterbot file:', error);
        return false; // في حالة حدوث خطأ، يتم افتراض أن المستخدم غير موجود في masterbot
    }
};

// دالة لإضافة مستخدم إلى ملف masterbot
const addUserToMasterBot = (username) => {
    try {
        const data = fs.readFileSync('masterbot.json', 'utf8');
        const usersInMasterBot = JSON.parse(data);

        if (!usersInMasterBot.includes(username)) {
            usersInMasterBot.push(username);
            fs.writeFileSync('masterbot.json', JSON.stringify(usersInMasterBot, null, 2));
        } else {
        }
    } catch (error) {
        console.error('Error adding user to masterbot:', error);
    }
};

// دالة لحذف مستخدم من ملف masterbot
const removeUserFromMasterBot = (username) => {
    try {
        const data = fs.readFileSync('masterbot.json', 'utf8');
        const usersInMasterBot = JSON.parse(data);

        const index = usersInMasterBot.indexOf(username);
        if (index !== -1) {
            usersInMasterBot.splice(index, 1);
            fs.writeFileSync('masterbot.json', JSON.stringify(usersInMasterBot, null, 2));
            console.log(`User ${username} removed from masterbot.`);
        } else {
            console.log(`User ${username} not found in masterbot.`);
        }
    } catch (error) {
        console.error('Error removing user from masterbot:', error);
    }
};
const readUsersFromFile = () => {
    try {
        if (fs.existsSync(USERS_FILE_PATH)) {
            const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
            return data ? JSON.parse(data) : [];
        }
    } catch (error) {
        console.error("Error reading users file:", error);
    }
    return [];
};

// Function to write users to JSON file
const writeUsersToFile = (users) => {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
};

// Initialize users array from file
let users = readUsersFromFile();


const getPuzzles = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('puzzles.json', 'utf8', (err, data) => {
            if (err) {
                reject('Error reading puzzles file');
            } else {
                const puzzles = JSON.parse(data);
                resolve(puzzles.puzzles); // Return puzzles array
            }
        });
    });
};


/**
 * دالة تضيف صورة جديدة إلى ملف comic.json مع ID تلقائي
 * @param {string} imageUrl رابط الصورة
 * @returns {object|null} العنصر الجديد أو null في حال الخطأ
 */

function addComicImage(url, username) {
    try {
        console.log('Reading the comic file...');

        // التحقق إذا كان الملف فارغًا أو غير موجود
        let comics = [];

        // إذا كان الملف غير موجود أو فارغ، نقوم بتهيئته بمصفوفة فارغة
        if (fs.existsSync(comicFilePath)) {
            const fileData = fs.readFileSync(comicFilePath, 'utf8');
            if (fileData.trim()) {
                comics = JSON.parse(fileData);
            }
        }

        // إذا كانت البيانات فارغة، نقوم بتهيئة الملف بمصفوفة فارغة
        if (comics.length === 0) {
            console.log('No comics found. Initializing with an empty array.');
        }

        console.log('File data successfully read:', comics);

        // تحديد ID جديد بناءً على آخر ID موجود في الملف
        const newId = comics.length > 0 ? comics[comics.length - 1].id + 1 : 1;

        console.log(`Generated new ID for comic: ${newId}`);

        // إنشاء الكائن الجديد للصورة مع الاسم
        const newComic = { 
            id: newId, 
            url, 
            addedBy: username // إضافة اسم الشخص الذي أضاف الصورة
        };

        // إضافة الكائن الجديد إلى قائمة الكوميكس
        comics.push(newComic);

        // كتابة البيانات المعدلة إلى الملف
        fs.writeFileSync(comicFilePath, JSON.stringify(comics, null, 2), 'utf8');
        console.log('Comic image successfully added to the file.');

        return newComic; // إرجاع الكائن الجديد { id, url, addedBy }
    } catch (error) {
        console.error('Error adding comic:', error.message);
        return null;
    }
}



function readLoginDatatebot() {
    try {
        if (fs.existsSync(tebot)) {
            const rawData = fs.readFileSync(tebot, 'utf8');
            return JSON.parse(rawData);
        }
        return [];
    } catch (error) {
        console.error('Error reading login data from file:', error);
        return [];
    }
}

function readLoginDataRooms() {
    try {
        if (fs.existsSync(rooms)) {
            const rawData = fs.readFileSync(rooms, 'utf8');
            return JSON.parse(rawData);
        }
        return [];
    } catch (error) {
        console.error('Error reading login data from file:', error);
        return [];
    }
}


function saveRoom(room) {
    try {
        let existingRooms = [];

        // Check if the file exists and read its content
        if (fs.existsSync(rooms)) {
            const rawData = fs.readFileSync(rooms, 'utf8');
            existingRooms = JSON.parse(rawData);
        }

        // Check if a room with the same name already exists
        const roomExists = existingRooms.some(existingRoom => existingRoom.name === room.name);

        if (!roomExists) {
            existingRooms.push(room); // Add new room object
            fs.writeFileSync(rooms, JSON.stringify(existingRooms, null, 2));
        } else {
        }
    } catch (error) {
        console.error('Error writing room to file:', error);
    }
}



function deleteRoomName(roomName) {
    try {
        let existingRooms = [];

        // Check if the file exists
        if (fs.existsSync(rooms)) {
            const rawData = fs.readFileSync(rooms, 'utf8');
            existingRooms = JSON.parse(rawData);
        }

        // Find the index of the room object by its "name" property
        const roomIndex = existingRooms.findIndex(room => room.name === roomName);
        if (roomIndex !== -1) {
            // Remove the room object from the array
            existingRooms.splice(roomIndex, 1);
            // Save the updated rooms array back to the file
            fs.writeFileSync(rooms, JSON.stringify(existingRooms, null, 2));
        } else {
        }
    } catch (error) {
        console.error('Error deleting room name from file:', error);
    }
}


// Function to delete a user from the file
function deleteUserFromFile(username) {
    try {
        const existingData = readLoginData();

        // Filter out the user by username
        const updatedData = existingData.filter(user => user.username !== username);

        // Save the updated data back to the file
        fs.writeFileSync(loginDataFilePath, JSON.stringify(updatedData, null, 2));
        console.log(`User ${username} deleted from the file`);
    } catch (error) {
        console.error('Error deleting user from file:', error);
    }
}

// Function to save login data to the file, ensuring no duplicates
function saveLoginData(loginData) {
    try {
        let existingData = [];
        if (fs.existsSync(loginDataFilePath)) {
            const rawData = fs.readFileSync(loginDataFilePath, 'utf8');
            existingData = JSON.parse(rawData);
        }

        // Check if the username or roomName already exists
        const isDuplicate = existingData.some(
            user => user.username === loginData.username
        );

        if (!isDuplicate) {
            // If no duplicate, push the new login data to the array
            existingData.push(loginData);
            fs.writeFileSync(loginDataFilePath, JSON.stringify(existingData, null, 2));
            console.log('Login data saved to loginData.json');
        } else {
            console.log('Duplicate username or roomName found. Skipping save.');
        }
    } catch (error) {
        console.error('Error writing login data to file:', error);
    }
}
/**
 * دالة تحذف صورة من comic.json حسب ID
 * @param {number} id رقم الصورة
 * @returns {boolean} true إذا تم الحذف، false إذا لم يتم
 */
function deleteComicImageById(id) {
    try {
        const data = fs.readFileSync(comicFilePath, 'utf8');
        const comics = JSON.parse(data);

        const updated = comics.filter(c => c.id !== id);
        if (updated.length === comics.length) return false; // لم يتم العثور على ID

        fs.writeFileSync(comicFilePath, JSON.stringify(updated, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('خطأ أثناء حذف صورة كوميكس:', error.message);
        return false;
    }
}


function addUser(newUser) {
    // قراءة الملف الحالي
    fs.readFile(filePathSearch, 'utf8', (err, data) => {
        if (err) {
            console.error('خطأ في قراءة الملف:', err);
            return;
        }
        
        let users = [];
        try {
            users = JSON.parse(data); // تحويل النص إلى JSON
        } catch (parseError) {
            console.error('خطأ في تحليل JSON:', parseError);
            return;
        }
        
        users.push(newUser); // إضافة المستخدم الجديد
        
        // كتابة التحديثات إلى الملف
        fs.writeFile(filePathSearch, JSON.stringify(users, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('خطأ في كتابة الملف:', writeErr);
            } else {
                console.log('تمت إضافة المستخدم بنجاح!');
            }
        });
    });
}




function getRandomEmoji() {
  const randomIndex = Math.floor(Math.random() * items.length);
  const { emoji, text } = items[randomIndex];
  return `${emoji} - ${text}`;
}



module.exports = {
    readBettingData,
    writeBettingData,
    updateLastTimeGift,
    canSendGift,
    saveLoginData,
    getRandomEmoji,
    deleteUserFromFile,
    deleteRoomName,
    deleteComicImageById,
    getRandomComicImage,
    readVipFile,
    readVipSearchFile,
    writeVipFile,
    addComicImage,
    saveRoom,
    readLoginDatatebot,
    isUserInMasterBot,
    readLoginDataRooms,
    removeUserFromMasterBot,
    formatPoints,
    addBlockedUser,
    getPuzzles,
    startSendingSpecMessage,
    loadPuzzles,
    writeImageToFile,
    writeBlockedUsers,
    readGameData,
    canSendGift,
    addUser,
    addUserToMasterBot,
    writeUsersToFile,
    removeLastTimeGift,
    loadImagesData,
    readBlockedUsers,
    deleteBlockedUser,
    getRandomImageShot,
    saveGameData,
    users,
    generateUnits,
    getRandomQuestion,
    getRandomNumber,
    getRandomImage,
    getRandomHikma
};