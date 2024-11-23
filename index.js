const { Console } = require('console');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const moment = require('moment');  // التأكد من استيراد moment
const ws_TeBot = require('./ws_TeBot');
const ws_Rooms = require('./ws_Rooms');

const {
    updateLastTimeGift,
    canSendGift,
    saveLoginData,
    deleteUserFromFile,
    deleteRoomName,
    saveRoomName,
    readLoginDataTeBot,
    isUserInMasterBot,
    readLoginDataRooms,
    removeUserFromMasterBot,
    addBlockedUser,
    getPuzzles,
    loadPuzzles,
    writeBlockedUsers,
    readGameData,
    addUserToMasterBot,
    writeUsersToFile,
    removeLastTimeGift,
    loadImagesData,
    readBlockedUsers,
    deleteBlockedUser,
    saveGameData,
    users,
    getRandomNumber,
    getRandomImage,
}= require('./functions');








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
