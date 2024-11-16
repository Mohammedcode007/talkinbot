const { Console } = require('console');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Define the file path for storing login data
const loginDataFilePath = path.join(__dirname, 'users.json');
const tebot = path.join(__dirname, 'loginData.json');
const rooms = path.join(__dirname, 'rooms.json');
const USERS_FILE_PATH = path.join(__dirname, 'verifyusers.json');
// تحديد مسار ملف JSON
const filePath = path.join(__dirname, 'blockedUsers.json');

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

// 3. تنفيذ عملية map على المصفوفة
function mapBlockedUsers(callback) {
    const users = readBlockedUsers();
    return users.map(callback);
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
            console.log(`User ${username} added to masterbot.`);
        } else {
            console.log(`User ${username} is already in masterbot.`);
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

function readLoginDataTeBot() {
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


function saveRoomName(roomName) {
    try {
        let existingRooms = [];
        if (fs.existsSync(rooms)) {
            const rawData = fs.readFileSync(rooms, 'utf8');
            existingRooms = JSON.parse(rawData);
        }

        // Check if the room name already exists
        if (!existingRooms.includes(roomName)) {
            existingRooms.push(roomName); // Add new room name
            fs.writeFileSync(rooms, JSON.stringify(existingRooms, null, 2));
            console.log('Room name saved to loginData.json');
        } else {
            console.log('Duplicate room name found. Skipping save.');
        }
    } catch (error) {
        console.error('Error writing room name to file:', error);
    }
}


function deleteRoomName(roomName) {
    try {
        let existingRooms = [];
        if (fs.existsSync(rooms)) {
            const rawData = fs.readFileSync(rooms, 'utf8');
            existingRooms = JSON.parse(rawData);
        }

        // Check if the room name exists
        const roomIndex = existingRooms.indexOf(roomName);
        if (roomIndex !== -1) {
            existingRooms.splice(roomIndex, 1); // Remove the room name
            fs.writeFileSync(rooms, JSON.stringify(existingRooms, null, 2));
            console.log(`Room name "${roomName}" deleted from loginData.json`);
        } else {
            console.log(`Room name "${roomName}" not found. No deletion performed.`);
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

// Function to save login data to the file
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




const ws_TeBot = async ({ username, password, roomName }) => {
    const socket = new WebSocket('wss://chatp.net:5333/server');

    socket.onopen = () => {
        const loginMessage = {
            handler: 'login',
            username: username,
            password: password,
            session: 'PQodgiKBfujFZfvJTnmM',
            sdk: '25',
            ver: '332',
            id: 'xOEVOVDfdSwVCjYqzmTT'
        };
        socket.send(JSON.stringify(loginMessage));
        console.log(`Login request sent for username: ${username}`);
        // Join the room
        const joinRoomMessage = {
            handler: 'room_join',
            id: 'QvyHpdnSQpEqJtVbHbFY',
            name: 'shot'
        };
        socket.send(JSON.stringify(joinRoomMessage));

    };

    socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);

        if (parsedData.handler === 'room_event') {

            if (parsedData.body && parsedData.body.includes('@'), parsedData.room === "shot") {
                const [command, roomName] = parsedData.body.split('@');
                console.log(`Chat message received1: ${parsedData?.from}`);

                if (command === 'login' && roomName) {

                    // Save login data to the JSON file
                    saveRoomName(roomName);


                    // Join the room
                    const joinRoomMessage = {
                        handler: 'room_join',
                        id: 'QvyHpdnSQpEqJtVbHbFY',
                        name: roomName
                    };
                    socket.send(JSON.stringify(joinRoomMessage));

                    const roomJoinSuccessMessage = {
                        handler: 'chat_message',
                        id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                        to: parsedData?.from,
                        body: 'تم الدخول إلى الغرفة بنجاح!',
                        type: 'text'
                    };
                    socket.send(JSON.stringify(roomJoinSuccessMessage));
                } else if (command === 'dc' && roomName) {

                    deleteRoomName(roomName);
                    const roomJoinSuccessMessage = {
                        handler: 'chat_message',
                        id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                        to: parsedData?.from,
                        body: 'تم الخروج من الغرفة بنجاح!',
                        type: 'text'
                    };
                    socket.send(JSON.stringify(roomJoinSuccessMessage));
                } else if (command === 'msg' && roomName) {

                    const [command, message] = parsedData.body.split('@');
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const rooms = JSON.parse(data);

                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                        console.log(message);

                        const sendMainMessage = (room, message) => {
                            const verificationMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: 'egypt',
                                url: '',
                                length: '',
                                body: message
                            };
                            socket.send(JSON.stringify(verificationMessage));
                            console.log('Verification message sent:', message);
                        };
                        sendMainMessage(String(ur), message);

                        const verificationMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: String(ur),  // تحويل ur إلى نص
                            url: '',
                            length: '',
                            body: message
                        };
                        socket.send(JSON.stringify(verificationMessage));
                    }


                } else if (command === 'blk' && roomName) {
                    const users = readBlockedUsers();

                    const [command, username] = parsedData.body.split('@');
                    console.log(command, username);

                    addBlockedUser(username); // إضافة



                    const verificationMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: 'shot',
                        url: '',
                        length: '',
                        body: `blocked user ${username}`
                    };
                    socket.send(JSON.stringify(verificationMessage));

                } else if (command === 'ublk' && roomName) {
                    const users = readBlockedUsers();

                    const [command, username] = parsedData.body.split('@');
                    console.log(command, username);

                    deleteBlockedUser(username); // إضافة



                    const verificationMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: 'shot',
                        url: '',
                        length: '',
                        body: `Unblocked User ${username}`
                    };
                    socket.send(JSON.stringify(verificationMessage));

                } else {
                    console.log('Invalid message format for login');
                }
            }
        }
    };

    socket.onclose = () => {
        console.log(`Socket closed for username: ${username}`);
    };

    socket.onerror = (error) => {
        console.error(`Socket error for username: ${username}`, error);
    };
};

const ws_Rooms = async ({ username, password, roomName }) => {
    const socket = new WebSocket('wss://chatp.net:5333/server');
    let answerTimeout;
    let reminderInterval;
    let timeLeft = 30; // 30 seconds
    let correctAnswer = null;
    let puzzleInProgress = false;
    let revealedLayers = 5; // Number of parts to reveal gradually


    socket.onopen = () => {
        const loginMessage = {
            handler: 'login',
            username: username,
            password: password,
            session: 'PQodgiKBfujFZfvJTnmM',
            sdk: '25',
            ver: '332',
            id: 'xOEVOVDfdSwVCjYqzmTT'
        };
        socket.send(JSON.stringify(loginMessage));
        const data = fs.readFileSync('rooms.json', 'utf8');
        const rooms = JSON.parse(data);
        rooms.forEach(room => {
            const joinRoomMessage = {
                handler: 'room_join',
                id: 'QvyHpdnSQpEqJtVbHbFY',
                name: room
            };
            socket.send(JSON.stringify(joinRoomMessage));
            console.log(`Joined room: ${room}`);
        })


    };

    socket.onmessage = async (event) => {
        const parsedData = JSON.parse(event.data);
        // console.log('Received message:88', parsedData);
        const usersblockes = readBlockedUsers();



        // تحقق مما إذا كان المستخدم موثقًا
        if (parsedData.handler === 'room_event' && parsedData.body === 'فزوره') {
            const senderUsername = parsedData.from; // المستخدم الذي أرسل كلمة "فزوره"

            const userblocked = usersblockes.find(user => user === senderUsername);

            if (userblocked) {
                const notVerifiedMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `User ${userblocked} is  blocked!.`
                };
                socket.send(JSON.stringify(notVerifiedMessage));
                return;
            }
            // ابحث عن المستخدم في ملف المستخدمين
            let user = users.find(user => user.username === senderUsername);

            // إذا لم يكن المستخدم موثقًا
            if (!user || !user.verified) {
                const notVerifiedMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `User ${senderUsername} is not verified! Please verify first.`
                };
                socket.send(JSON.stringify(notVerifiedMessage));
                console.log(`User ${senderUsername} is not verified.`);
                return; // إيقاف الكود إذا كان المستخدم غير موثق
            }

            // إذا كان المستخدم موثقًا، استمر في المعالجة
            if (puzzleInProgress) {
                const existingPuzzleMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: 'Puzzle already in progress. Please wait.'
                };
                socket.send(JSON.stringify(existingPuzzleMessage));
                return;
            }

            try {
                const puzzles = await getPuzzles();
                const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];

                const message = {
                    handler: "room_message",
                    id: "TclBVHgBzPGTMRTNpgWV",
                    type: "text",
                    room: parsedData.room,
                    url: "",
                    length: "",
                    body: randomPuzzle.question
                };

                socket.send(JSON.stringify(message));

                correctAnswer = randomPuzzle.answer.toLowerCase();
                puzzleInProgress = true;
                revealedLayers = 5;

                clearTimeout(answerTimeout);
                clearInterval(reminderInterval);

                answerTimeout = setTimeout(() => {
                    sendCorrectAnswer(parsedData.room, correctAnswer);
                    puzzleInProgress = false;  // تعيين حالة الفزورة بعد انتهاء الوقت

                }, 30000);

                timeLeft = 30;
                reminderInterval = setInterval(() => {
                    timeLeft -= 10;
                    if (timeLeft > 0) {
                        sendReminder(parsedData.room, timeLeft);
                    }
                }, 10000);

            } catch (error) {
                console.error('Error fetching puzzles:', error);
            }
        } else if (parsedData.handler === 'room_event' && correctAnswer) {
            const userblocked = users.find(user => user === parsedData.from);

            if (userblocked) {
                const notVerifiedMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `User ${userblocked} is not blocked!.`
                };
                socket.send(JSON.stringify(notVerifiedMessage));
                return;
            }
            const userResponse = parsedData.body?.trim().toLowerCase();
            if (userResponse && userResponse === correctAnswer) {
                clearTimeout(answerTimeout);
                clearInterval(reminderInterval);

                const correctAnswerMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `Correct answer + 100 Points`
                };
                socket.send(JSON.stringify(correctAnswerMessage));
                // إضافة 100 نقطة للمستخدم
                let respondingUser = users.find(user => user.username === parsedData.from);
                if (respondingUser) {

                    respondingUser.points += 100; // إضافة 100 نقطة
                    console.log(`User ${respondingUser.username} now has ${respondingUser.points} points.`);
                    writeUsersToFile(users);

                }


                revealedLayers--;
                correctAnswer = null;
                puzzleInProgress = false;
            }
        }
        if (parsedData.handler === 'room_event' && parsedData.type === 'user_joined') {
            // sendMainMessage(parsedData.name, `🌟𝗪𝗘𝗟𝗖𝗢𝗠𝗘🌟 \n ${parsedData.username}`);
        }

        // التعامل مع التحقق من المستخدم عند إضافة أو حذف مستخدم
        if (parsedData.handler === 'room_event') {
            const userblocked = users.find(user => user === parsedData.from);

            if (userblocked) {
                const notVerifiedMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `User ${userblocked} is not blocked!.`
                };
                socket.send(JSON.stringify(notVerifiedMessage));
                return;
            }
            const body = parsedData.body || '';
            if (body.startsWith('ver@')) {
                const usernameToVerify = body.split('@')[1].trim();
                console.log('78888', parsedData.from);

                // تحقق مما إذا كان المستخدم موجودًا في ملف masterbot
                if (!isUserInMasterBot(parsedData.from)) {
                    console.log(`User ${parsedData.from} not found in masterbot, verification skipped.`);
                    return;
                }

                let user = users.find(user => user.username === usernameToVerify);
                if (!user) {
                    user = { username: usernameToVerify, verified: true };
                    users.push(user);
                    console.log(`New user added: ${usernameToVerify}`);
                    sendVerificationMessage(parsedData.room, `User verified: ${usernameToVerify}`);
                } else {
                    user.verified = true;
                    console.log(`User verified: ${usernameToVerify}`);
                    sendVerificationMessage(parsedData.room, `User verified: ${usernameToVerify}`);
                }

                writeUsersToFile(users);
            } else if (body.startsWith('delver@')) {
                const usernameToDelete = body.split('@')[1].trim();

                const userIndex = users.findIndex(user => user.username === usernameToDelete);
                if (userIndex !== -1) {
                    users.splice(userIndex, 1);
                    console.log(`User removed: ${usernameToDelete}`);
                    sendVerificationMessage(parsedData.room, `User removed: ${usernameToDelete}`);
                    writeUsersToFile(users);
                } else {
                    console.log(`User not found: ${usernameToDelete}`);
                }
            } else if (body.startsWith('ms@') && parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا") {

                const usernameToAdd = body.split('@')[1].trim();
                addUserToMasterBot(usernameToAdd);
                sendVerificationMessage(parsedData.room, `User Added Master: ${usernameToAdd}`);


                // تحقق من الرسائل التي تبدأ بـ delms@ لحذف المستخدم من masterbot
            } else if (body.startsWith('delms@') && parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا") {
                const usernameToRemove = body.split('@')[1].trim();
                removeUserFromMasterBot(usernameToRemove);
                sendVerificationMessage(parsedData.room, `User removed Master: ${usernameToRemove}`);

            } else if (body.startsWith('.p@')) {
                const username = body.split('@')[1].trim();
                let respondingUser = users.find(user => user.username === username);
                if (respondingUser) {

                    sendMainMessage(parsedData.room, `User ${username}  have : ${respondingUser?.points} points`);

                }


            } else if (body === '.lg') {


                sendMainMessage(parsedData.room, ` ① ✧･ﾟ🍳 𝑬𝒈𝒈𝒔
② 🍔 𝑩𝒖𝒓𝒈𝒆𝒓
③ 🌯 𝑺𝒉𝒂𝒘𝒂𝒓𝒎𝒂
④ 🍕 𝑷𝒊𝒛𝒛𝒂
⑤ 🍟 𝑭𝒓𝒆𝒏𝒄𝒉 𝑭𝒓𝒊𝒆𝒔
⑥ 🐈 𝑪𝒂𝒕
⑦ 🐷 𝑷𝒊𝒈
⑧ 𝑻𝒊𝒎𝒐𝒏 𝒂𝒏𝒅 𝑷𝒖𝒎𝒃𝒂𝒂
⑨ 🦁 𝑺𝒊𝒎𝒃𝒂
⑩ 🦁😈 𝑺𝒄𝒂𝒓
Ex : agi@NumberGift@username@message

`);

                sendMainMessage(parsedData.room, ` 
 ⑪ 🍹 𝑺𝒖𝒈𝒂𝒓𝒄𝒂𝒏𝒆 𝑱𝒖𝒊𝒄𝒆
⑫ 🐎 𝑯𝒐𝒓𝒔𝒆
⑬ 🌸 𝑭𝒍𝒐𝒘𝒆𝒓
⑭ 🦁 𝑳𝒊𝒐𝒏
⑮ ❤️ 𝑳𝒐𝒗𝒆
⑯ ☕ 𝑪𝒐𝒇𝒇𝒆𝒆
⑰ 🐉 𝑫𝒓𝒂𝒈𝒐𝒏
⑱ 🎂 𝑩𝒊𝒓𝒕𝒉𝒅𝒂𝒚
⑲ 🐭 𝑴𝒊𝒄𝒌𝒆𝒚 𝑴𝒐𝒖𝒔𝒆
⑳ 🐶 𝑺𝒄𝒐𝒐𝒃𝒚-𝑫𝒐𝒐
    
Ex : agi@NumberGift@username@message
    
    `);

                sendMainMessage(parsedData.room, ` 
   ㉑ 🐰 𝑩𝒖𝒈𝒔 𝑩𝒖𝒏𝒏𝒚
㉒ 🍍 𝑺𝒑𝑜𝒏𝒈𝑩𝒐𝒃
㉓ 🌟 𝑫𝒐𝒓𝒂 𝒕𝒉𝒆 𝑬𝒙𝒑𝒍𝒐𝒓𝒆𝒓
㉔ 🦸‍♂️ 𝑺𝒖𝒑𝒆𝒓𝒎𝒂𝒏
㉕ ❄️ 𝑭𝒓𝒐𝒛𝒆𝒏
㉖ 🌊 𝑴𝒐𝒂𝒏𝒂
㉗ 🚗 𝑪𝒂𝒓

Ex : agi@NumberGift@username@message


        
        `);

            } else if (body.startsWith('gi@')) {
                const atCount = (body.match(/@/g) || []).length; // عد عدد الرموز @ في النص

                // التحقق إذا كان يوجد أكثر من 2 @
                if (atCount === 2) {
                    const username = body.split('@')[2].trim();

                    const id = Number(body.split('@')[1].trim());



                    if (body && parsedData.room && id === 1) {
                        imageType = 'eggs';

                        if (imageType === 'eggs') {
                            const imageUrl = getRandomImage(imageType);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }


                    } else if (id && id === 2) {
                        imageType2 = 'burger';

                        if (imageType2 === 'burger') {
                            const imageUrl = getRandomImage(imageType2);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }
                    } else if (id === 3) {
                        imageType3 = 'shawarma';

                        if (imageType3 === 'shawarma') {
                            const imageUrl = getRandomImage(imageType3);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }

                    } else if (id === 4) {
                        imageType4 = 'pizza';

                        if (imageType4 === 'pizza') {
                            const imageUrl = getRandomImage(imageType4);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }

                    } else if (id === 5) {
                        imageType5 = 'potato';

                        if (imageType5 === 'potato') {
                            const imageUrl = getRandomImage(imageType5);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }

                    }

                } else if (atCount === 3) {

                    if (body.startsWith('gi@')) {
                        const username = body.split('@')[2].trim();
                        const msg = body.split('@')[3].trim();

                        const id = Number(body.split('@')[1].trim());
                        console.log(username, id);



                        if (body && parsedData.room && id === 1 && msg) {
                            imageType = 'eggs';

                            if (imageType === 'eggs' && msg) {
                                const imageUrl = getRandomImage(imageType);
                                if (imageUrl) {
                                    sendMainImageMessage(parsedData.room, imageUrl);
                                    sendMainMessage(parsedData.room, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                } else {
                                    console.error('No images found for the specified type.');
                                }
                            }


                        } else if (id && id === 2) {
                            imageType2 = 'burger';

                            if (imageType2 === 'burger') {
                                const imageUrl = getRandomImage(imageType2);
                                if (imageUrl) {
                                    sendMainImageMessage(parsedData.room, imageUrl);
                                    sendMainMessage(parsedData.room, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                } else {
                                    console.error('No images found for the specified type.');
                                }
                            }
                        } else if (id === 3) {
                            imageType3 = 'shawarma';

                            if (imageType3 === 'shawarma') {
                                const imageUrl = getRandomImage(imageType3);
                                if (imageUrl) {
                                    sendMainImageMessage(parsedData.room, imageUrl);
                                    sendMainMessage(parsedData.room, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                } else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 4) {
                            imageType4 = 'pizza';

                            if (imageType4 === 'pizza') {
                                const imageUrl = getRandomImage(imageType4);
                                if (imageUrl) {
                                    sendMainImageMessage(parsedData.room, imageUrl);
                                    sendMainMessage(parsedData.room, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                } else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 5) {
                            imageType5 = 'potato';

                            if (imageType5 === 'potato') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    sendMainImageMessage(parsedData.room, imageUrl);
                                    sendMainMessage(parsedData.room, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                } else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        }

                    }

                }

            }
            else if (body.startsWith('agi@')) {
                const atCount = (body.match(/@/g) || []).length; // عد عدد الرموز @ في النص

                // التحقق إذا كان يوجد أكثر من 2 @
                if (atCount === 2) {
                    const username = body.split('@')[2].trim();

                    const id = Number(body.split('@')[1].trim());
                    console.log(username, id);



                    if (body && parsedData.room && id === 1) {
                        imageType = 'eggs';

                        if (imageType === 'eggs') {
                            const imageUrl = getRandomImage(imageType);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }


                    } else if (id && id === 2) {
                        imageType2 = 'burger';

                        if (imageType2 === 'burger') {
                            const imageUrl = getRandomImage(imageType2);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }
                    } else if (id === 3) {
                        imageType3 = 'shawarma';

                        if (imageType3 === 'shawarma') {
                            const imageUrl = getRandomImage(imageType3);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }

                    } else if (id === 4) {
                        imageType4 = 'pizza';

                        if (imageType4 === 'pizza') {
                            const imageUrl = getRandomImage(imageType4);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }

                    } else if (id === 5) {
                        imageType5 = 'potato';

                        if (imageType5 === 'potato') {
                            const imageUrl = getRandomImage(imageType5);
                            if (imageUrl) {
                                sendMainImageMessage(parsedData.room, imageUrl);
                                sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ 🎉`);
                            } else {
                                console.error('No images found for the specified type.');
                            }
                        }

                    }

                } else if (atCount === 3) {

                    if (body.startsWith('agi@')) {
                        const username = body.split('@')[2].trim();
                        const msg = body.split('@')[3].trim();

                        const id = Number(body.split('@')[1].trim());
                        console.log(username, id);



                        if (body && parsedData.room && id === 1 && msg) {
                            imageType = 'eggs';

                            if (imageType === 'eggs' && msg) {
                                const imageUrl = getRandomImage(imageType);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);


                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach


                                        sendMainMessage(ur, ` ✅ ᵀᴴᴱ ᴹᴱᔆᔆᴬᴳᴱ ᴴᴬᔆ ᴮᴱᴱᴺ ᔆᵁᶜᶜᴱᔆᔆᶠᵁᴸᴸʸ ᔆᴱᴺᵀ ᵀᴼ ᴬᴸᴸ ᴿᴼᴼᴹᔆ`);

                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }


                        } else if (id && id === 2) {
                            imageType2 = 'burger';

                            if (imageType2 === 'burger') {
                                const imageUrl = getRandomImage(imageType2);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }
                        } else if (id === 3) {
                            imageType3 = 'shawarma';

                            if (imageType3 === 'shawarma') {
                                const imageUrl = getRandomImage(imageType3);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 4) {
                            imageType4 = 'pizza';

                            if (imageType4 === 'pizza') {
                                const imageUrl = getRandomImage(imageType4);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 5) {
                            imageType5 = 'potato';

                            if (imageType5 === 'potato') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 6) {
                            imageType5 = 'cats';

                            if (imageType5 === 'cats') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 7) {
                            imageType5 = 'pig';

                            if (imageType5 === 'pig') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 8) {
                            imageType5 = 'temon';

                            if (imageType5 === 'temon') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 9) {
                            imageType5 = 'sembaa';

                            if (imageType5 === 'sembaa') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 10) {
                            imageType5 = 'scar';

                            if (imageType5 === 'scar') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 11) {
                            imageType5 = '2sp';

                            if (imageType5 === '2sp') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 12) {
                            imageType5 = 'hourse';

                            if (imageType5 === 'hourse') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 13) {
                            imageType5 = 'Flower';

                            if (imageType5 === 'Flower') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 14) {
                            imageType5 = 'Lion';

                            if (imageType5 === 'Lion') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 15) {
                            imageType5 = 'Love';

                            if (imageType5 === 'Love') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 16) {
                            imageType5 = 'Coffee';

                            if (imageType5 === 'Coffee') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 17) {
                            imageType5 = 'Dragon';

                            if (imageType5 === 'Dragon') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 18) {
                            imageType5 = 'Birthday';

                            if (imageType5 === 'Birthday') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 19) {
                            imageType5 = 'MickeyMouse';

                            if (imageType5 === 'MickeyMouse') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 20) {
                            imageType5 = 'Scooby-Doo';

                            if (imageType5 === 'Scooby-Doo') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 21) {
                            imageType5 = 'BugsBunny';

                            if (imageType5 === 'BugsBunny') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 22) {
                            imageType5 = 'SpongeBob';

                            if (imageType5 === 'SpongeBob') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 23) {
                            imageType5 = 'DoratheExplorer';

                            if (imageType5 === 'DoratheExplorer') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 24) {
                            imageType5 = 'superman';

                            if (imageType5 === 'superman') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 25) {
                            imageType5 = 'Frozen';

                            if (imageType5 === 'Frozen') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 26) {
                            imageType5 = 'Moana';
                            if (imageType5 === 'Moana') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 27) {
                            imageType5 = 'Car';
                            if (imageType5 === 'Car') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        } else if (id === 28) {
                            imageType5 = 'Fuck';
                            if (imageType5 === 'Fuck') {
                                const imageUrl = getRandomImage(imageType5);
                                if (imageUrl) {
                                    const data = fs.readFileSync('rooms.json', 'utf8');
                                    const rooms = JSON.parse(data);

                                    console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                    for (let ur of rooms) {  // استخدام for...of بدلاً من forEach
                                        console.log(`Sending message to room: ${ur}`);
                                        sendMainImageMessage(ur, imageUrl);
                                        sendMainMessage(ur, ` 🎁 G ✨ I 💫 F 🌈 T 🔥 🎉 \n 🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟 \n  𝗠𝗘𝗦𝗦𝗔𝗚𝗘 : ${msg} 🎉`);
                                    }
                                }
                                else {
                                    console.error('No images found for the specified type.');
                                }
                            }

                        }


                    }

                }

            }
        }

    };

    socket.onclose = () => {
        console.log(`Socket closed for username: ${username}`);
    };

    socket.onerror = (error) => {
        console.error(`Socket error for username: ${username}`, error);
    };

    const sendVerificationMessage = (room, message) => {
        console.log(room)
        console.log(message)
        const verificationMessage = {
            handler: 'room_message',
            id: 'TclBVHgBzPGTMRTNpgWV',
            type: 'text',
            room: room,
            url: '',
            length: '',
            body: message
        };
        socket.send(JSON.stringify(verificationMessage));
        console.log('Verification message sent:', message);
    };

    const sendMainMessage = (room, message) => {
        const verificationMessage = {
            handler: 'room_message',
            id: 'TclBVHgBzPGTMRTNpgWV',
            type: 'text',
            room: room,
            url: '',
            length: '',
            body: message
        };
        socket.send(JSON.stringify(verificationMessage));
        console.log('Verification message sent:', message);
    };

    const sendMainImageMessage = (room, imageURL) => {
        const revealMessage = {
            handler: 'room_message',
            id: 'TclBVHgBzPGTMRTNpgWV',
            type: 'image',
            room: room,
            url: imageURL,
            length: '',
            body: ''
        };
        socket.send(JSON.stringify(revealMessage));
    };

    const sendReminder = (room, timeLeft) => {
        const reminderMessage = {
            handler: 'room_message',
            id: 'TclBVHgBzPGTMRTNpgWV',
            type: 'text',
            room: room,
            url: '',
            length: '',
            body: `Time left to answer: ${timeLeft} seconds`
        };
        socket.send(JSON.stringify(reminderMessage));
        console.log(`Time left reminder: ${timeLeft}`);
    };


    const sendCorrectAnswer = (room, correctAnswer) => {
        const correctAnswerMessage = {
            handler: 'room_message',
            id: 'TclBVHgBzPGTMRTNpgWV',
            type: 'text',
            room: room,
            url: '',
            length: '',
            body: `Correct answer was: ${correctAnswer}`
        };
        socket.send(JSON.stringify(correctAnswerMessage));
        console.log('Correct answer message sent:', correctAnswer);
    };




};


// Start WebSocket connection for users in the JSON file
async function startConnections() {
    const users = await readLoginDataTeBot();

    if (users.length === 0) {
        console.log('No users found in the JSON file.');
        return;
    }
    ws_TeBot({ username: 'tebot', password: '12345678', roomName: 'shot' });


    users.forEach(user => {
        if (user.username && user.password && user.roomName) {
            // ws_TeBot({ username: user.username, password: user.password, roomName: user.roomName });
        } else {
            console.log('User data is missing username, password, or roomName');
        }
    });
}

let joinedRooms = []; // لتخزين الغرف التي انضم إليها البوت

async function startConnectionsBots() {
    const rooms = await readLoginDataRooms();

    if (rooms.length === 0) {
        console.log('No rooms found in the JSON file.');
        return;
    }
    ws_Rooms({ username: 'tebot', password: '12345678', roomName: '' });

    // التحقق من الغرف التي لم ينضم إليها البوت بعد
    rooms.forEach(room => {
        if (room && !joinedRooms.includes(room)) {
            console.log(`Joining room: ${room}`);
            // ws_Rooms({ username: 'tebot', password: '12345678', roomName: room });
            joinedRooms.push(room); // إضافة الغرفة إلى قائمة الغرف المنضمة
        } else if (joinedRooms.includes(room)) {
            console.log(`Bot already joined room: ${room}`);
        } else {
            console.log('User data is missing username, password, or roomName');
        }
    });
}

// Function to process incoming WebSocket messages and extract login data
function processMessage(message) {
    const parsedData = JSON.parse(message);

    if (parsedData.handler === 'chat_message') {
        console.log(`Chat message received: ${parsedData.body}`);

        const body = parsedData.body;

        // Check if the body contains a command (login or dc)
        if (body.includes('@')) {
            const parts = body.split('@');
            const command = parts[0];

            if (command === 'login' && parts.length === 4) {
                // Format: login@username@password@roomName
                const extractedUsername = parts[1];
                const extractedPassword = parts[2];
                const roomName = parts[3];


                // Save login data to the JSON file
                const loginData = { username: extractedUsername, password: extractedPassword, roomName };
                saveLoginData(loginData);

                // Re-attempt login with extracted credentials
                const newLoginMessage = {
                    handler: 'login',
                    username: extractedUsername,
                    password: extractedPassword,
                    session: 'PQodgiKBfujFZfvJTnmM',
                    sdk: '25',
                    ver: '332',
                    id: 'xOEVOVDfdSwVCjYqzmTT'
                };

                // Reconnect the user with the new login details
                // ws_({ username: extractedUsername, password: extractedPassword, roomName });
            } else if (command === 'dc' && parts.length === 2) {
                // Format: dc@username (only username to delete)
                const extractedUsername = parts[1];
                deleteUserFromFile(extractedUsername);
            } else {
                console.log('Invalid message format for login');
            }
        } else {
            console.log('Message does not contain @, ignoring...');
        }
    }
}


// Handle WebSocket connection and message events
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New connection established');

    ws.on('message', (message) => {
        // console.log(`Received message: ${message}`);
        processMessage(message);
    });

    ws.on('close', () => {
        console.log('Connection closed');
    });
});

// Start WebSocket server to listen for incoming connections
wss.on('listening', () => {
    console.log('WebSocket server is running on ws://localhost:8080');
});

// Start the connections with existing users
startConnections();
startConnectionsBots()
