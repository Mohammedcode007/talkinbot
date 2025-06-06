const { Console } = require('console');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const moment = require('moment');  // التأكد من استيراد moment
const ws_tebot = require('./ws_tebot');
const ws_Rooms = require('./ws_Rooms');
const { resetPointsAndAssets, getArrayLength } = require('./resetPoints');

const {
    updateLastTimeGift,
    canSendGift,
    saveLoginData,
    deleteUserFromFile,
    deleteRoomName,
    saveRoomName,
    readLoginDatatebot,
    isUserInMasterBot,
    readLoginDataRooms,
    removeUserFromMasterBot,
    addBlockedUser,
    getPuzzles,
    loadPuzzles,
    writeBlockedUsers,
    readGameData,
    users,
    addUserToMasterBot,
    writeUsersToFile,
    removeLastTimeGift,
    loadImagesData,
    readBlockedUsers,
    deleteBlockedUser,
    saveGameData,
    getRandomNumber,
    getRandomImage,
}= require('./functions');

// const createCanvasWithBackground = require('./createImage');

// // تحديد مسار حفظ الصورة

// const outputPath = 'C:/ImagesServers/monster1.png';
// const backgroundImagePath = './images/moon.jpg';  // مسار صورة القمر
// const overlayImageUrl = 'https://cdn.goenhance.ai/user/2024/07/19/c0c1400b-abc2-4541-a849-a7e4f361d28d_0.jpg';  // رابط الصورة الثانية

// createCanvasWithBackground(backgroundImagePath, overlayImageUrl, outputPath);
// استدعاء الدالة لإنشاء صورة وحش






// Start WebSocket connection for users in the JSON file
async function startConnections() {
    const users = await readLoginDatatebot();

    if (users.length === 0) {
        return;
    }
    ws_tebot({ username: 'tebot', password: 'Moha@76@5-', roomName: 'shot' });


    users.forEach(user => {
        if (user.username && user.password && user.roomName) {
            // ws_tebot({ username: user.username, password: user.password, roomName: user.roomName });
        } else {
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
    ws_Rooms({ username: 'tebot', password: 'Moha@76@5-', roomName: '' });

    // التحقق من الغرف التي لم ينضم إليها البوت بعد
    rooms.forEach(room => {
        if (room && !joinedRooms.includes(room)) {
            // ws_Rooms({ username: 'tebot', password: 'Moha@76@5-', roomName: room });
            joinedRooms.push(room); // إضافة الغرفة إلى قائمة الغرف المنضمة
        } else if (joinedRooms.includes(room)) {
        } else {
            console.log('User data is missing username, password, or roomName');
        }
    });
}

// Function to process incoming WebSocket messages and extract login data
function processMessage(message) {
    const parsedData = JSON.parse(message);

    if (parsedData.handler === 'chat_message') {
        // console.log(`Chat message received: ${parsedData.body}`);

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




// resetPointsAndAssets()

