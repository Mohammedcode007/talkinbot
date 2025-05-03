

const fs = require('fs');
const WebSocket = require('ws');

const {
    updateLastTimeGift,
    removeLastTimeGift,
    canSendGift,
    saveLoginData,
    deleteUserFromFile,
    deleteRoomName,
    saveRoom,
    readLoginDatatebot,
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
    loadImagesData,
    readBlockedUsers,
    deleteBlockedUser,
    saveGameData,
    users,
    getRandomNumber,
    getRandomImage,
} = require('./functions');

const reconnectInterval = 5000; // 5 seconds
const maxReconnectAttempts = 5; // Maximum attempts to reconnect

let reconnectAttempts = 0;
const reconnectDelayShort = 5000; // 5 seconds between retries
const reconnectDelayLong = 15 * 60 * 1000; // 15 minutes
const maxAttemptsPerCycle = 5;

let attemptsInCurrentCycle = 0;
const ws_tebot = async ({ username, password, roomName }) => {
    const createSocketConnection = () => {
        const socket = new WebSocket('wss://chatp.net:5333/server');

        socket.onopen = () => {
            attemptsInCurrentCycle = 0; // Reset attempts when connected

            console.log(`Connected to WebSocket server for username: ${username}`);
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

            const joinRoomMessage = {
                handler: 'room_join',
                id: 'QvyHpdnSQpEqJtVbHbFY',
                name: 'shot'
            };
            socket.send(JSON.stringify(joinRoomMessage));

            setInterval(() => {
                const autoMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: roomName,
                    url: '',
                    length: '',
                    body: `tebot`
                };
                socket.send(JSON.stringify(autoMessage));
            }, 60000); // 60000 milliseconds = 1 minute
        };

        socket.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);

            if (parsedData.handler === 'room_event') {
                if (parsedData.body && parsedData.body.includes('@') && parsedData.room === "shot") {
                    const [command, roomName] = parsedData.body.split('@');
                    
                    if (command === 'login' && roomName) {
                        // Save login data to the JSON file
                        const newRoom = {
                            name: roomName,
                            bet: true,
                            gift: true,
                            welcome: true
                        };
                        saveRoom(newRoom);

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
                        const roomsData = JSON.parse(data);
                        const rooms = roomsData.map(room => room.name);

                        for (let ur of rooms) {
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
                            };
                            sendMainMessage(String(ur), message);

                            const verificationMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: String(ur), 
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

                        addBlockedUser(username);

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

                        deleteBlockedUser(username);

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
                    }
                }
            }
        };

        socket.onclose = () => {
            attemptsInCurrentCycle++;

            console.log(`Socket closed for username: ${username}`);
            // if (reconnectAttempts < maxReconnectAttempts) {
            //     reconnectAttempts++;
            //     console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            //     setTimeout(createSocketConnection, reconnectInterval); // Try reconnecting after a delay
            // } else {
            //     console.log("Max reconnect attempts reached. Not reconnecting.");
            // }
            if (attemptsInCurrentCycle < maxAttemptsPerCycle) {
                console.log(`Attempting to reconnect... (${attemptsInCurrentCycle}/${maxAttemptsPerCycle})`);
                setTimeout(createSocketConnection, reconnectDelayShort);
            } else {
                console.log(`Max attempts in this cycle reached. Waiting 15 minutes before retrying...`);
                attemptsInCurrentCycle = 0; // Reset for next cycle
                setTimeout(createSocketConnection, reconnectDelayLong);
            }
        };

        socket.onerror = (error) => {
            console.error(`Socket error for username: ${username}`, error);
        };
    };

    createSocketConnection(); // Start the initial connection
};

module.exports = ws_tebot;
