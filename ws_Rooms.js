const fs = require('fs');
const path = require('path');
const { getRandomInstruction } = require('./getRandomText');
const getRandomItemDress = require('./dress'); // استيراد دالة اختيار الفستان العشوائي
const createCanvasWithBackground = require('./createImage');
const { addMessage } = require('./report.js');
const { readCricketGameData ,writeCricketGameData,deleteCricketGameData,writeCricketGameDataTime } = require('./cricket_game.js');


const moment = require('moment');  // التأكد من استيراد moment
const createGameBoard = require('./createImage');
const { resetPointsAndAssets, getArrayLength } = require('./resetPoints');
const { getRandomItem, getRandomItemBoy } = require('./randomItemGirls');
const { loadTweets,
    saveTweets,
    addTweet,
    deleteTweetById,
    getRandomTweet, } = require('./tweetsFun');

const WebSocket = require('ws');
const {
    readBettingData,
    writeBettingData,
    updateLastTimeGift,
    saveLoginData,
    deleteUserFromFile,
    startSendingSpecMessage,
    deleteRoomName,
    saveRoom,
    getRandomImageShot,
    readLoginDataTeBot,
    getRandomEmoji,
    isUserInMasterBot,
    writeImageToFile,
    readLoginDataRooms,
    removeUserFromMasterBot,
    addBlockedUser,
    getPuzzles,
    loadPuzzles,
    writeBlockedUsers,
    readGameData,
    canSendGift,
    addUserToMasterBot,
    writeUsersToFile,
    removeLastTimeGift,
    formatPoints,
    loadImagesData,
    readVipFile,
    writeVipFile,
    readBlockedUsers,
    deleteBlockedUser,
    saveGameData,
    users,
    getRandomNumber,
    getRandomHikma,
    getRandomImage,
} = require('./functions');



const ws_Rooms = async ({ username, password, roomName }) => {
    const socket = new WebSocket('wss://chatp.net:5333/server');

  
    const cricketGameTimeouts = new Map();

    let players = new Map();  // تخزين اللاعبين
    let playerNumbers = new Map();  // تخزين الأرقام التي يرسلها اللاعبون
    let playerSequences = new Map(); // حفظ تسلسل الأرقام لكل لاعب
    let turn = 1;  // تحديد الدور (1 للاعب الأول، 2 للاعب الثاني)
    const validNumbers = Array.from({ length: 16 }, (_, i) => i + 1);  // الأرقام من 1 إلى 16
    let timeout;  // متغير لتخزين timeout
    const timeoutDuration = 30000; // 30 ثانية
    let selectedNumbers = [];  // لتخزين الأرقام المرسلة

    let answerTimeout;
    let reminderInterval;
    let timeLeft = 30; // 30 seconds
    let correctAnswer = null;
    let puzzleInProgress = false;
    let revealedLayers = 5; // Number of parts to reveal gradually
    const pendingSvipRequests = new Map(); // لتتبع طلبات svip
    const lastSpecTime = new Map();
    const activeUsers = new Map(); // تخزين المؤقتات لكل مستخدم باستخدام Map
    const userLastTweetTime = new Map();
    const activeUsersdress = new Map(); // تخزين المستخدمين الذين قاموا بطلب فستان في دقيقتين الأخيرة

    const storedImages = new Map(); // لتخزين الصور المرسلة لكل مستخدم
    const lastSvipRequestTime = new Map(); // لتتبع توقيت آخر طلب لكل مستخدم
    const THIRTY_SECONDS = 30 * 1000; // 30 ثانية بالمللي ثانية
    const lastSendTime = new Map(); // لتتبع توقيت الإرسال الأخير لكل مستخدم
    const SEND_COOLDOWN = 10 * 60 * 1000; // فترة التهدئة: 10 دقائق
    let pikachuAlive = true; // حالة بيكاتشو (حي عند البداية)

    let VIPGIFTTOUSER = null
    let VIPGIFTFROMUSER = null
    const FIVE_MINUTES = 10 * 60 * 1000; // بالمللي ثانية
    let emojiTimer;
    let currentEmoji = null;
    let emojiPoints = 0;
    const emojis = [
        { emoji: '🍎', points: 1000 },   // تفاحة
        { emoji: '🍌', points: 2000 },   // موزة
        { emoji: '🍓', points: 2500 },   // فراولة
        { emoji: '🍉', points: 3000 },   // بطيخ
        { emoji: '🍇', points: 500 },   // عنب
        { emoji: '🍍', points: 1500 },   // أناناس
        { emoji: '🥭', points: 1500 },   // مانجو
        { emoji: '🍒', points: 100 },  // كرز
        { emoji: '🍑', points: 1000 },  // خوخ
        { emoji: '🍋', points: 10000 },  // ليمون
        { emoji: '🍊', points: 500 },  // برتقال
        { emoji: '🐉', points: 50000 } // تنين
    ];
    const investmentCooldownMap = new Map();
    const userLastLuckyTimeMap = new Map();
    const forbiddenWords = [
        'كسي', 'كسى', 'كس', 
        'زب', 'قحبة', 'خول', 
        'شرموطة', 'زبري', 'زبي',  
        'عرص', 'انيكك', 'زبى',  
        'ابن الحرام', 'كسمك', 'متناكة',  
        'افشخك', 'متناكة', 'متناك',  
        'اركبك', 'يلعن شرفك', 'زبى' 
      ];
      

    let gameTimer; // المؤقت
    let choiceTimeout; // متغير للوقت المحدد لإنهاء اللعبة
    let isGameActive = false; // حالة اللعبة لتحديد ما إذا كانت هناك لعبة جارية أم لا
    let userChoiceTimeout; // مؤقت لرسالة تحفيزية
    let canChoosePath = false; // لمنع اللاعب من اختيار الطريق قبل كلمة "ابدأ"
    let puzzleTimeout;
    let tweetIndex = 0; // لتتبع التغريدة الحالية
    let lastTweetId = null; // معرف التغريدة الأخيرة المرسلة
    const tweets = loadTweets(); // تحميل التغريدات من ملف JSON
    // دالة لإيقاف اللعبة بعد 30 ثانية
    let roundTimeout;

    function sendDressImageMessage(room, image) {
        const message = {
            handler: 'room_message',
            id: 'TclBVHgBzPGTMRTNpgWV',
            type: 'image',
            room: room,
            url: image,
            length: '',
            body: ''
        };
        socket.send(JSON.stringify(message));
    }

    function stopGameAfterChoiceTimeout(parsedData) {
        choiceTimeout = setTimeout(() => {
            // إذا لم يتم إرسال اختيار الطريق في الوقت المحدد، يتم إرسال رسالة "انتهاء اللعبة"
            const timeoutMessage = {
                handler: 'room_message',
                id: 'TclBVHgBzPGTMRTNpgWV',
                type: 'text',
                room: parsedData.room,
                url: '',
                length: '',
                body: `⏳ انتهت مدة اختيار الطريق! تم إنهاء اللعبة.`
            };

            socket.send(JSON.stringify(timeoutMessage));

            // إعادة تعيين المتغيرات لإنهاء اللعبة
            isGameActive = false; // إيقاف اللعبة
            currentEmoji = null;
            clearInterval(gameTimer); // إيقاف المؤقت
            clearTimeout(choiceTimeout); // إيقاف مؤقت اختيار الطريق
            gameTimer = null; // إعادة تعيين المؤقت
            canChoosePath = false; // إعادة تعيين القدرة على اختيار الطريق
        }, 30000); // 30 ثوانٍ
    }

    // دالة لإرسال رسائل تحفيزية بعد 10 ثوانٍ إذا لم يرسل اللاعب اختيارًا
    function sendReminderMessage(parsedData) {
        userChoiceTimeout = setTimeout(() => {
            const reminderMessage = {
                handler: 'room_message',
                id: 'TclBVHgBzPGTMRTNpgWV',
                type: 'text',
                room: parsedData.room,
                url: '',
                length: '',
                body: `🚨 لم تختر الطريق بعد! اختر طريقك الآن:
            1. الغابة المظلمة 🌲  
            2. الجبال الصخرية ⛰️  
            3. النهر الهائج 🌊`
            };

            socket.send(JSON.stringify(reminderMessage));
        }, 10000); // كل 10 ثوانٍ
    }

    function resetGameData() {
        gameData = {
            lastUserWhoSentTreasure: null,   // يمكنك مسح هذا إذا أردت
            lastPuzzle: null,
            currentPlayer: null,
            isGameActive: false,
            selectedPath: null,  // تصفير الطريق المختار
            playerProgress: {
                correctAnswersCount: 0,  // تصفير عدد الإجابات الصحيحة
                totalPoints: 0           // تصفير النقاط
            },
            correctAnswersCount: 0  // تصفير الإجابات الصحيحة
        };

        saveGameData(gameData);  // حفظ البيانات المحدثة
    }

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
        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

        // بدء المؤقت العام لإرسال نفس الإيموجي لجميع الغرف
        emojiTimer = setInterval(() => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            currentEmoji = randomEmoji.emoji;
            emojiPoints = randomEmoji.points;

            console.log(`Sending emoji: ${currentEmoji} to all rooms`);

            // إرسال الإيموجي لكل الغرف
            for (let ur of rooms) {
                const emojiMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: ur, // إرسال إلى الغرفة الحالية
                    url: '',
                    length: '',
                    body: `بوت: أرسل هذا الإيموجي بسرعة للحصول على النقاط: ${currentEmoji}`,
                };

                socket.send(JSON.stringify(emojiMessage));
            }
        }, 300000);
        const emojisPIK = ['⚡', '🐭', '✨', '🔥', '🌟']; // قائمة بالإيموجي
        emojiTimer = setInterval(() => {
            const randomEmoji = emojisPIK[Math.floor(Math.random() * emojisPIK.length)]; // اختيار إيموجي عشوائي
            pikachuAlive = true;
            // إرسال الرسالة لكل الغرف
            for (let ur of rooms) {
                const message = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: ur, // إرسال إلى الغرفة الحالية
                    url: '',
                    length: '',
                    body: ` Pikachu is back ${randomEmoji} send fire or فاير`,
                };

                socket.send(JSON.stringify(message));
            }
        }, 720000); // يكرر الإرسال كل 5 دقائق (300000 مللي ثانية)
       

        textTimer = setInterval(() => {
            // index.js



            // بدء عملية جلب النص العشوائي كل نصف ساعة
            let text = getRandomInstruction();

            // يمكنك إضافة المزيد من الكود هنا حسب حاجتك، مثل إضافة خادم HTTP أو وظائف أخرى
            // إرسال الرسالة لكل الغرف
            for (let ur of rooms) {
                const message = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: ur, // إرسال إلى الغرفة الحالية
                    url: '',
                    length: '',
                    body: `  ${text}`,
                };

                socket.send(JSON.stringify(message));
            }
        }, 1800000); // يكرر الإرسال كل 5 دقائق (300000 مللي ثانية)


        rooms.forEach(room => {
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
            }, 60000); // 60000 ملي ثانية = دقيقة واحدة
            const joinRoomMessage = {
                handler: 'room_join',
                id: 'QvyHpdnSQpEqJtVbHbFY',
                name: room
            };
            socket.send(JSON.stringify(joinRoomMessage));
            const cricketGameData = readCricketGameData();

            if (cricketGameData[room] === undefined) {
                console.log(room,"cricketGameData[room]");
                
                cricketGameData[room] = {
                    betAmount: null,
                    players: [{
                        username: '',
                        role: 'attacker',
                        status: 'waiting'
                    }],
                    startedBy: '',
                    active: false,
                    gameRoom: '',
                    rounds: 0  // تتبع عدد الجولات
                };
            } else {
                if (!cricketGameData[room].active) {
                    cricketGameData[room].active = false;
                    cricketGameData[room].players = [{
                        username: '',
                        role: 'attacker',
                        status: 'waiting'
                    }];
                    cricketGameData[room].rounds = 0;  // إعادة تعيين الجولات
                } else {
                    return;
                }
            }
            writeCricketGameData(cricketGameData);

            console.log(`Joined room: ${room}`);
        })


    };
    function handleUnverifiedUser2(socket, users, usery, room) {
        console.log(usery)
        const respondingUser = users.find(user => user.username === usery);
        console.log(respondingUser)
        if (!respondingUser) {
            const gameActiveMessage = {
                handler: 'room_message',
                id: 'TclBVHgBzPGTMRTNpgWV',
                type: 'text',
                room: room,
                url: '',
                length: '',
                body: `❌ Alert: You can send only to verified users".`
            };

            socket.send(JSON.stringify(gameActiveMessage));
            return true; // Return true to indicate the user is unverified
        }

        return false; // Return false to indicate the user is verified
    }
    function handleUnverifiedUser(socket, users, parsedData) {
        const respondingUser = users.find(user => user.username === parsedData.from);

        if (!respondingUser) {
            const gameActiveMessage = {
                handler: 'room_message',
                id: 'TclBVHgBzPGTMRTNpgWV',
                type: 'text',
                room: parsedData.room,
                url: '',
                length: '',
                body: `❌ Alert: There is a new request from an unverified user in room ${parsedData.room}. Please verify by msg to "♥♪".`
            };

            socket.send(JSON.stringify(gameActiveMessage));
            return true; // Return true to indicate the user is unverified
        }

        return false; // Return false to indicate the user is verified
    }
    function endBettingGame(room) {
        const bettingData = readBettingData();
        const roomData = bettingData[room];
        const players = roomData.players;

        // Select a winner randomly
        const winnerIndex = Math.floor(Math.random() * players.length);
        const winner = players[winnerIndex];

        // Update points
        const totalPot = players.reduce((sum, player) => sum + player.betAmount, 0);
        let winnerUser = users.find(u => u.username === winner.username);
        winnerUser.points += totalPot;

        // Save winner's points and finalize the game
        sendMainMessage(
            room,
            `🎉 User ${winner.username} won the bet and now has ${formatPoints(winnerUser.points)} points!`
        );

        // Clear betting data for the room
        delete bettingData[room];
        writeBettingData(bettingData);
    }
    socket.onmessage = async (event) => {
        const parsedData = JSON.parse(event.data);
        const usersblockes = readBlockedUsers();
        if (parsedData.room === `egypt`) {

        }

        // إرسال لغز عشوائي بعد اختيار الطريق
        function sendRandomPuzzle(parsedData, pathNumber) {
            const puzzles = loadPuzzles();  // تحميل الألغاز من الملف

            const pathPuzzles = puzzles[pathNumber];  // اختيار الألغاز الخاصة بالطريق
            const randomIndex = Math.floor(Math.random() * pathPuzzles.length);  // اختيار لغز عشوائي
            const puzzle = pathPuzzles[randomIndex];  // اللغز العشوائي

            // إرسال السؤال إلى اللاعب
            const puzzleMessage = {
                handler: 'room_message',
                id: 'TclBVHgBzPGTMRTNpgWV',
                type: 'text',
                room: parsedData.room,
                url: '',
                length: '',
                body: `🔍 اللغز: ${puzzle.question} \nأجب عليه!`
            };

            socket.send(JSON.stringify(puzzleMessage));

            return puzzle;  // العودة باللغز لإجراء التحقق من الإجابة لاحقًا
        }

        if (parsedData.handler === 'room_event') {
            if (parsedData.from) {
                const senderUsername = parsedData.from.trim();
                let gameData = readGameData();

                // إذا كانت الرسالة هي "كنز"
                if (parsedData.body === 'كنز') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    if (isGameActive) {
                        const gameActiveMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `❌ هناك لعبة جارية بالفعل! لا يمكن بدء لعبة جديدة.`
                        };

                        socket.send(JSON.stringify(gameActiveMessage));
                    } else {
                        gameData.lastUserWhoSentTreasure = senderUsername;
                        saveGameData(gameData);

                        const welcomeMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `🏝️ مرحباً بك في لعبة البحث عن الكنز! هل أنت مستعد للبحث عن الكنز؟ أرسل "ابدأ" لبدء اللعبة!`
                        };

                        socket.send(JSON.stringify(welcomeMessage));
                        isGameActive = true;
                        canChoosePath = false;
                    }
                }
                if (parsedData.body === '.s') {

                    let user = users.find(user => user.username === parsedData.from);
               



                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    const emoji = getRandomEmoji()
                    const youget = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: emoji
                    };

                    socket.send(JSON.stringify(youget));

                }

           

                if (parsedData.body === 'حكمه') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    const hikma = getRandomHikma()
                    const youget = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: hikma
                    };

                    socket.send(JSON.stringify(youget));

                }




                if (parsedData.body === 'عروستي' || parsedData.body === `عروستى` || parsedData.body === "My Bride") {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // تنفيذ إجراءات إضافية إذا كان المستخدم غير موثّق
                        return;
                    }

                    const userId = parsedData.from; // معرّف المستخدم المرسل

                    // التحقق مما إذا كان هناك مؤقت نشط لهذا المستخدم
                    if (activeUsers.has(userId)) {
                        // إذا كان لدى المستخدم مؤقت نشط، إبلاغه أنه يجب الانتظار
                        socket.send(
                            JSON.stringify({
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: parsedData.body === "My Bride"
                                    ? "You can request 'My Bride' again after the timer ends."
                                    : "يمكنك طلب 'عروستي' مرة أخرى بعد انتهاء المؤقت."
                            })
                        );
                        return;
                    }

                    // فورًا عند طلب "عروستي"، إرسال الرد مع العروس العشوائي
                    const randomItem = getRandomItem();
                    console.log(`العنصر العشوائي للمستخدم ${userId}:`, randomItem);
                    sendMainImageMessage(parsedData.room, randomItem.image)
                    const youget = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room, // الغرفة التي سيتم إرسال الرسالة إليها
                        url: '',
                        length: '',
                        body: parsedData.body === "My Bride"
                            ? `Your bride, ${userId}, is ${randomItem.username}`
                            : `عروستك يا ${userId} هي ${randomItem.username}`
                    };

                    // إرسال الرسالة فوريًا إلى الغرفة
                    socket.send(JSON.stringify(youget));


                    // تخزين المؤقت في Map بحيث لا يمكن للمستخدم طلب "عروستي" مرة أخرى إلا بعد دقيقتين
                    const intervalId = setInterval(() => {
                        activeUsers.delete(userId); // حذف المستخدم من Map بعد مرور دقيقتين
                        clearInterval(intervalId);
                    }, 60 * 1000); // تأخير المؤقت لمدة دقيقتين

                    // تخزين المؤقت في Map
                    activeUsers.set(userId, intervalId);
                }

                if (parsedData.body === 'عريسي' || parsedData.body === `عريسى` || parsedData.body === "My Groom") {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // تنفيذ إجراءات إضافية إذا كان المستخدم غير موثّق
                        return;
                    }

                    const userId = parsedData.from; // معرّف المستخدم المرسل

                    // التحقق مما إذا كان هناك مؤقت نشط لهذا المستخدم
                    if (activeUsers.has(userId)) {
                        // إذا كان لدى المستخدم مؤقت نشط، إبلاغه أنه يجب الانتظار
                        socket.send(
                            JSON.stringify({
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: parsedData.body === "My Groom"
                                    ? "You can request 'My Groom' again after the timer ends. 😊"
                                    : "يمكنك طلب 'عريسك' مرة أخرى بعد انتهاء المؤقت. 😊"
                            })
                        );
                        return;
                    }

                    // فورًا عند طلب "عروستي"، إرسال الرد مع العروس العشوائي
                    const randomItem = getRandomItemBoy();
                    console.log(`العنصر العشوائي للمستخدم ${userId}:`, randomItem);
                    sendMainImageMessage(parsedData.room, randomItem.image)
                    const youget = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room, // الغرفة التي سيتم إرسال الرسالة إليها
                        url: '',
                        length: '',
                        body: parsedData.body === "My Groom"
                            ? `Your groom, ${userId}, is ${randomItem.username}`
                            : `عريسك يا ${userId} هو ${randomItem.username}`
                    };

                    // إرسال الرسالة فوريًا إلى الغرفة
                    socket.send(JSON.stringify(youget));


                    // تخزين المؤقت في Map بحيث لا يمكن للمستخدم طلب "عروستي" مرة أخرى إلا بعد دقيقتين
                    const intervalId = setInterval(() => {
                        activeUsers.delete(userId); // حذف المستخدم من Map بعد مرور دقيقتين
                        clearInterval(intervalId);
                    }, 60 * 1000); // تأخير المؤقت لمدة دقيقتين

                    // تخزين المؤقت في Map
                    activeUsers.set(userId, intervalId);
                }

                if (parsedData.body === 'دريس' || parsedData.body === 'dress') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // إجراءات إضافية إذا كان المستخدم غير موثّق
                        return;
                    }

                    const userId = parsedData.from;

                    // التحقق مما إذا كان قد مر وقت كافٍ منذ آخر طلب
                    if (activeUsersdress.has(userId)) {
                        const lastRequestTime = activeUsersdress.get(userId);
                        const currentTime = Date.now();

                        // إذا لم تمر دقيقتين (120000 مللي ثانية)، إبلاغ المستخدم أنه يجب الانتظار
                        if (currentTime - lastRequestTime < 2 * 60 * 1000) {
                            socket.send(
                                JSON.stringify({
                                    handler: 'room_message',
                                    id: 'TclBVHgBzPGTMRTNpgWV',
                                    type: 'text',
                                    room: parsedData.room,
                                    url: '',
                                    length: '',
                                    body: 'يمكنك طلب فستان آخر بعد دقيقتين من آخر طلب. 😊'
                                })
                            );
                            return;
                        }
                    }

                    const randomDress = getRandomItemDress(); // الحصول على فستان عشوائي
                    let respondingUser = users.find(user => user.username === userId);

                    if (respondingUser) {
                        respondingUser.points += randomDress.points; // إضافة النقاط للمستخدم
                        sendDressImageMessage(parsedData.room, randomDress.image); // إرسال صورة الفستان العشوائي

                        const yougetDress = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `من تصميم ${randomDress.name} وقد حصلت على ${randomDress.points} نقاط`
                        };

                        // إرسال الرسالة إلى الغرفة
                        socket.send(JSON.stringify(yougetDress));

                        // تخزين وقت آخر طلب للمستخدم في الـMap
                        activeUsersdress.set(userId, Date.now());
                        writeUsersToFile(users); // كتابة المستخدمين إلى الملف
                    }
                }


                if (parsedData.body && parsedData.body.startsWith('tw@')) {
                    // استخراج المعرف من الرسالة بعد "tw@"
                    const tweetId = parsedData.body.substring(parsedData.body.indexOf('@') + 1).trim();

                    // تحميل التغريدات الحالية
                    const tweets = loadTweets();

                    // البحث عن التغريدة التي تطابق المعرف
                    const tweet = tweets.find(t => t.id === tweetId);

                    // التحقق إذا كانت التغريدة موجودة
                    if (tweet) {
                        // إذا تم العثور على التغريدة، إرسال تفاصيلها
                        const tweetDetails = `
 ________________________
*Tweet from ${tweet.user}* 
id : "${tweet.id}"
💬 "${tweet.text}"
❤️ *Likes:* ${tweet.likedBy}
👎 *Dislikes:* ${tweet.dislikedBy}
 ________________________
                        `;
                        const roomJoinSuccessMessage = {
                            handler: 'chat_message',
                            id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                            to: parsedData.from,
                            body: tweetDetails,
                            type: 'text'
                        };
                        socket.send(JSON.stringify(roomJoinSuccessMessage));
                        socket.send(
                            JSON.stringify({
                                handler: 'room_message',
                                id: 'ErrorMessage',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `details send PVT.`
                            })
                        );

                    } else {
                        // إذا لم يتم العثور على التغريدة، إرسال رسالة خطأ
                        socket.send(
                            JSON.stringify({
                                handler: 'room_message',
                                id: 'ErrorMessage',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `Tweet with ID ${tweetId} not found. Please check the ID and try again.`
                            })
                        );
                    }
                }
                if (parsedData.body && parsedData.body.startsWith('deltw@')) {
                    // استخراج المعرف من الرسالة بعد "deltw@"
                    const tweetId = parsedData.body.substring(parsedData.body.indexOf('@') + 1).trim();

                    // محاولة حذف التغريدة
                    const tweets = loadTweets();
                    const tweetExists = tweets.some(t => t.id === tweetId);

                    if (tweetExists) {
                        deleteTweetById(tweetId);

                        // إرسال رسالة تأكيد الحذف
                        socket.send(
                            JSON.stringify({
                                handler: 'room_message',
                                id: 'DeleteMessage',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `Tweet with ID ${tweetId} has been successfully deleted.`
                            })
                        );
                    } else {
                        // إذا لم يتم العثور على التغريدة، إرسال رسالة خطأ
                        socket.send(
                            JSON.stringify({
                                handler: 'room_message',
                                id: 'ErrorMessage',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `Tweet with ID ${tweetId} not found. Please check the ID and try again.`
                            })
                        );
                    }
                }

            


                // إذا كانت الرسالة هي "ابدأ"
                if (parsedData.body === 'ابدأ') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    if (gameData.lastUserWhoSentTreasure === null) {
                        const errorMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `❌ يجب أن ترسل كلمة "كنز" أولاً! لا يمكنك بدء اللعبة.`
                        };

                        socket.send(JSON.stringify(errorMessage));
                    } else if (senderUsername === gameData.lastUserWhoSentTreasure) {
                        const pathChoiceMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `🔹 اختر طريقك:
                            1. الغابة المظلمة 🌲  
                            2. الجبال الصخرية ⛰️  
                            3. النهر الهائج 🌊`
                        };

                        socket.send(JSON.stringify(pathChoiceMessage));

                        // بدء مؤقت رسائل التحفيز
                        sendReminderMessage(parsedData);

                        // بدء المؤقت لاختيار الطريق (30 ثانية)
                        stopGameAfterChoiceTimeout(parsedData);

                        // السماح للاعب باختيار الطريق
                        canChoosePath = true;
                    } else {
                        const errorMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `❌ لا يمكنك بدء اللعبة لأنك لم ترسل كلمة "كنز" أولاً.`
                        };

                        socket.send(JSON.stringify(errorMessage));
                    }
                }

                const waitForAnswer = (parsedData, currentQuestionNumber) => {
                    puzzleTimeout = setTimeout(() => {

                        if (isGameActive) {
                            // إذا لم يتم الإجابة على السؤال الحالي
                            console.log("Timeout reached!");
                            if (
                                gameData.playerProgress &&
                                gameData.playerProgress.correctAnswersCount < currentQuestionNumber
                            ) {
                                const timeoutMessage = {
                                    handler: "room_message",
                                    id: "TclBVHgBzPGTMRTNpgWV",
                                    type: "text",
                                    room: parsedData.room,
                                    url: "",
                                    length: "",
                                    body: `⏰ انتهت المهلة! لم يتم الإجابة على السؤال ${currentQuestionNumber} في الوقت المحدد. اللعبة توقفت.`,
                                };

                                socket.send(JSON.stringify(timeoutMessage));

                                // إيقاف اللعبة
                                isGameActive = false;
                                canChoosePath = false;
                                gameData.lastPuzzle = null;
                                saveGameData(gameData);

                                // إيقاف جميع المؤقتات الأخرى
                                clearTimeout(choiceTimeout);
                                clearTimeout(userChoiceTimeout);
                                clearTimeout(puzzleTimeout);
                                resetGameData();
                            }
                        }
                    }, 20000); // 10 ثوانٍ
                };

                // استدعاء دالة إرسال لغز جديد
                const sendNextPuzzle = (parsedData) => {
                    const currentQuestionNumber =
                        gameData.playerProgress.correctAnswersCount + 1;

                    if (currentQuestionNumber <= 5) {
                        // إرسال لغز جديد
                        const puzzle = sendRandomPuzzle(parsedData, gameData.selectedPath);
                        gameData.lastPuzzle = puzzle;
                        saveGameData(gameData);

                        // بدء مؤقت الانتظار للإجابة على السؤال الجديد
                        waitForAnswer(parsedData, currentQuestionNumber);
                    } else {
                        // إذا أجاب اللاعب على 5 أسئلة صحيحة
                        const winMessage = {
                            handler: "room_message",
                            id: "TclBVHgBzPGTMRTNpgWV",
                            type: "text",
                            room: parsedData.room,
                            url: "",
                            length: "",
                            body: `🎉 تهانينا! لقد أجبت على جميع الأسئلة بشكل صحيح! حصلت على مليون نقطة إضافية!`,
                        };
                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            respondingUser.points += 1000000; // إضافة النقاط الخاصة بالإيموجي
                            writeUsersToFile(users);

                            socket.send(JSON.stringify(winMessage));
                        }
                        resetGameData();
                    }
                };

                // استدعاء دالة انتظار الإجابة بعد إرسال اللغز
                if (canChoosePath && ['1', '2', '3'].includes(parsedData.body)) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    clearTimeout(userChoiceTimeout);  // إيقاف تذكير الاختيار إذا تم الاختيار في الوقت المحدد
                    const selectedPath = parsedData.body;  // تخزين الطريق الذي اختاره اللاعب

                    // تحديث gameData لحفظ الطريق الذي اختاره اللاعب
                    gameData.selectedPath = selectedPath;  // إضافة الطريق إلى بيانات اللعبة
                    saveGameData(gameData);  // حفظ التحديثات إلى ملف اللعبة
                    const successMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: `🏁 تم اختيارك للطريق ${parsedData.body}! اللعبة مستمرة...`
                    };

                    socket.send(JSON.stringify(successMessage));

                    // إرسال اللغز بعد اختيار الطريق
                    const puzzle = sendRandomPuzzle(parsedData, parsedData.body);

                    gameData.lastPuzzle = puzzle;
                    saveGameData(gameData);

                    // بدء وقت الانتظار للإجابة بعد الاختيار
                    waitForAnswer(parsedData, 1);
                }



                // تحقق من إجابة اللاعب
                if (parsedData.body && parsedData.body.trim() !== "" && parsedData.from === gameData.lastUserWhoSentTreasure) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    if (gameData.lastPuzzle) {
                        const puzzle = gameData.lastPuzzle;

                        const playerAnswer = parsedData.body.trim().toLowerCase();
                        const correctAnswer = puzzle.answer.trim().toLowerCase();

                        if (playerAnswer === correctAnswer) {
                            const correctAnswerMessage = {
                                handler: "room_message",
                                id: "TclBVHgBzPGTMRTNpgWV",
                                type: "text",
                                room: parsedData.room,
                                url: "",
                                length: "",
                                body: `✅ الإجابة صحيحة! حصلت على 100 نقاط.`,
                            };
                            let respondingUser = users.find(user => user.username === parsedData.from);
                            if (respondingUser) {
                                respondingUser.points += 100; // إضافة النقاط الخاصة بالإيموجي
                                writeUsersToFile(users);

                                socket.send(JSON.stringify(correctAnswerMessage));
                            }

                            // تحديث عدد الإجابات الصحيحة
                            if (!gameData.playerProgress) {
                                gameData.playerProgress = { correctAnswersCount: 0, totalPoints: 0 };
                            }

                            gameData.playerProgress.correctAnswersCount += 1;
                            gameData.playerProgress.totalPoints += 100;
                            saveGameData(gameData);
                            const motivationalMessages = [
                                "👏 أحسنت! لقد أجبت على أول سؤال! انطلق نحو الكنز!",
                                "🎉 رائع! إجابتك الثانية تزيدك قربًا من الكنز!",
                                "💪 مذهل! لقد أنجزت ثلاثة أسئلة! الكنز يقترب أكثر!",
                                "🔥 عبقري! إجابتك الرابعة تُظهر تفوقك! استمر!",
                                "🌟 تهانينا! أكملت الخمسة أسئلة! الكنز ملكك الآن!"
                            ];

                            const currentCorrectAnswers = gameData.playerProgress.correctAnswersCount;
                            const motivationalMessage = {
                                handler: "room_message",
                                id: "TclBVHgBzPGTMRTNpgWV",
                                type: "text",
                                room: parsedData.room,
                                url: "",
                                length: "",
                                body: motivationalMessages[Math.min(currentCorrectAnswers - 1, motivationalMessages.length - 1)],
                            };
                            socket.send(JSON.stringify(motivationalMessage));
                            // إلغاء مؤقت المهلة إذا كانت الإجابة صحيحة
                            if (puzzleTimeout) {
                                clearTimeout(puzzleTimeout);
                                console.log("تم إيقاف المؤقت بنجاح");
                            }

                            // إرسال لغز جديد إذا لم نصل للسؤال الخامس
                            sendNextPuzzle(parsedData);
                        }
                    }
                }
                if (parsedData.handler === 'room_event' && parsedData.body === currentEmoji) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {
                        respondingUser.points += emojiPoints; // إضافة النقاط الخاصة بالإيموجي
                        const autoMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `تهانينا ${respondingUser.username}! لقد حصلت على ${emojiPoints} نقطة بسبب اجابته الصحيحة!`,
                        };
                        socket.send(JSON.stringify(autoMessage));
                        writeUsersToFile(users);
                        const data = fs.readFileSync('rooms.json', 'utf8');
                        const roomsData = JSON.parse(data);
                        const rooms = roomsData.map(room => room.name);
                        for (let ur of rooms) {
                            const autoMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: ur,
                                url: '',
                                length: '',
                                body: `تهانينا ${respondingUser.username}! لقد حصل على ${emojiPoints}  نقطة بسبب اجابته الصحيحه في غرفه ${parsedData.room}!`,
                            };
                            socket.send(JSON.stringify(autoMessage));
                        }

                    }

                    // إيقاف إرسال الإيموجي بعد أن يرسل المستخدم الإجابة
                    currentEmoji = null; // إعادة تعيين الإيموجي
                }

            }

            if (parsedData.handler === 'room_event' && parsedData.body === '*store') {
                // Define 10 different emojis with their corresponding prices in points
                const emojiStore = [
                    // Planets
                    { emoji: "🌍", name: "Earth", price: "50 points" },
                    { emoji: "🪐", name: "Saturn", price: "100 points" },
                    { emoji: "🌑", name: "Pluto", price: "110 points" },

                    // Moons
                    { emoji: "🌙", name: "Crescent Moon", price: "35 points" },
                    { emoji: "🌒", name: "Waning Crescent", price: "40 points" },

                    // Stars and Celestial Objects
                    { emoji: "⭐", name: "Star", price: "20 points" },
                    { emoji: "🌟", name: "Shining Star", price: "70 points" },
                    { emoji: "💫", name: "Shooting Star", price: "25 points" },

                    // Phenomena
                    { emoji: "☄️", name: "Comet", price: "60 points" },
                    { emoji: "🌌", name: "Galaxy", price: "200 points" }
                ];

                // Create the store message
                let storeMessage = "Here are the available items in the store:\n";

                // Loop through the emojiStore and create a list
                emojiStore.forEach(item => {
                    storeMessage += `${item.emoji} - ${item.name}: ${item.price}\n`;
                });

                // Send the store message
                sendMainMessage(parsedData.room, storeMessage);
            }




            if ((parsedData.body === 'fire' || parsedData.body === 'فاير') && pikachuAlive === true) {
                let respondingUser = users.find(user => user.username === parsedData.from);
                if (respondingUser) {
                    const currentTime = Date.now(); // الوقت الحالي بالمللي ثانية
                    const tenMinutesInMillis = 10 * 60 * 1000; // 10 دقائق بالمللي ثانية

                    // إذا لم يمر 10 دقائق منذ آخر Shot أو إذا لم يتم إرسال Shot من قبل
                    if (!respondingUser.lastShotTime || currentTime - respondingUser.lastShotTime >= tenMinutesInMillis) {
                        const data = fs.readFileSync('rooms.json', 'utf8');
                        const roomsData = JSON.parse(data);
                        const rooms = roomsData.map(room => room.name);
                                                if (pikachuAlive) {
                            for (let ur of rooms) {
                                const message = {
                                    handler: 'room_message',
                                    id: 'TclBVHgBzPGTMRTNpgWV',
                                    type: 'text',
                                    room: ur,
                                    url: '',
                                    length: '',
                                    body: `${parsedData.from} killed Pikachu! ⚡ 🐹 at ${parsedData.room}`,
                                };
                                socket.send(JSON.stringify(message));
                                sendMainImageMessage(ur, 'https://i.pinimg.com/736x/da/f6/bd/daf6bd86a28d3d02bced993b64062a85.jpg');

                            }
                            const roomJoinSuccessMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: parsedData.from,
                                body: `1000000000 points have been added to your account!`,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(roomJoinSuccessMessage));

                            // تحديث حالة بيكاتشو
                            pikachuAlive = false;
                        } else {
                            console.log('Pikachu is already dead!');
                            sendMainMessage(parsedData.room, 'بوت: Pikachu مات بالفعل، لا يمكنك قتله مجددًا!');
                        }
                        respondingUser.points += 1000000000; // إضافة 100 نقطة
                        respondingUser.lastShotTime = currentTime; // تحديث وقت آخر Shot
                        writeUsersToFile(users);
                    } else {
                        const remainingTime = tenMinutesInMillis - (currentTime - respondingUser.lastShotTime);
                        const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
                        sendMainMessage(parsedData.room, ` ${parsedData.from}, you must wait ${remainingMinutes} minute(s) before you can send a fire again.`);
                    }
                }
            } else if (parsedData.body === 'fire' || parsedData.body === 'فاير') {
                const randomImage = getRandomImageShot();
                let respondingUser = users.find(user => user.username === parsedData.from);
                if (respondingUser) {
                    const currentTime = Date.now(); // الوقت الحالي بالمللي ثانية
                    const tenMinutesInMillis = 10 * 60 * 1000; // 10 دقائق بالمللي ثانية

                    if (!respondingUser.lastShotTime || currentTime - respondingUser.lastShotTime >= tenMinutesInMillis) {
                        if (randomImage) {
                            sendMainImageMessage(parsedData.room, randomImage.url);
                            respondingUser.points += randomImage.points; // إضافة النقاط
                            respondingUser.lastShotTime = currentTime; // تحديث وقت آخر Shot
                            writeUsersToFile(users);

                            sendMainMessage(parsedData.room, `You killed ${randomImage.name} and earned ${randomImage.points} points!`);
                            writeImageToFile(randomImage);
                            const roomJoinSuccessMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: parsedData.from,
                                body: `${randomImage.points} points have been added to your account!`,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(roomJoinSuccessMessage));
                        }
                    } else {
                        const remainingTime = tenMinutesInMillis - (currentTime - respondingUser.lastShotTime);
                        const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
                        sendMainMessage(parsedData.room, ` ${parsedData.from}, you must wait ${remainingMinutes} minute(s) before you can send a fire again.`);
                    }
                }
            }











            if (parsedData.handler === 'room_event' && parsedData.type === 'user_joined') {
                const data = fs.readFileSync('rooms.json', 'utf8');
                const roomsData = JSON.parse(data);
            
                // البحث عن الغرفة التي تحتوي على الترحيب مفعل
                const room = roomsData.find(room => room.name === parsedData.name && room.welcome);
            
                // إذا تم العثور على الغرفة
                if (room) {
                    let vipUsers = readVipFile();  // قراءة بيانات الـ VIP
            
                    // قراءة بيانات المستخدمين وترتيب النقاط
                    const usersData = fs.readFileSync('verifyusers.json', 'utf8'); 
                    const users = JSON.parse(usersData);
            
                    // ترتيب المستخدمين حسب النقاط
                    const leaderboard = [...users].sort((a, b) => b.points - a.points);
            
                    // تحديد أول 10 مستخدمين
                    const topUsers = leaderboard.slice(0, 10);
            
                    // قائمة الألقاب لأول 10 مستخدمين
                    const titles = [
                        "The King 👑",         // الأول
                        "The Legend 🏆",       // الثاني
                        "The Champion ⚔️",     // الثالث
                        "The Commander 🛡️",    // الرابع
                        "The Genius 💡",       // الخامس
                        "The Elite 🌟",        // السادس
                        "The Pro 🎯",          // السابع
                        "The Rocket 🚀",       // الثامن
                        "The Scholar 📚",      // التاسع
                        "The Creator ✨"        // العاشر
                    ];
            
                    // التحقق إذا كان المستخدم VIP
                    const isVip = vipUsers.some(user => user.username === parsedData.username);
            
                    // التحقق إذا كان المستخدم من أول 10
                    const userRank = topUsers.findIndex(user => user.username === parsedData.username);
            
                    if (userRank !== -1 && isVip) {
                        // المستخدم VIP ومن أول 10
                        const title = titles[userRank];  // اللقب المناسب للترتيب
                        const rank = userRank + 1;       // ترتيب المستخدم
                        const points = leaderboard[userRank].points; // نقاط المستخدم
            
                        // إرسال رسالة ترحيب مميزة
                        sendMainMessage(
                            parsedData.name,
                            `✨ Welcome to the Kingdom, 🇻‌🇮‌🇵‌ ${parsedData.username}! ${title} ✨`
                        );
                    } else if (isVip) {
                        // المستخدم VIP ولكن ليس من أول 10
                        sendMainMessage(
                            parsedData.name,
                            `👑 Welcome, 🇻‌🇮‌🇵 ${parsedData.username}! ✨`
                        );
                    } else if (userRank !== -1) {
                        // المستخدم من أول 10 ولكن ليس VIP
                        const title = titles[userRank];  // اللقب المناسب للترتيب
                        const rank = userRank + 1;       // ترتيب المستخدم
                        const points = leaderboard[userRank].points; // نقاط المستخدم
            
                        // إرسال رسالة ترحيب خاصة للمستخدمين الأوائل
                        sendMainMessage(
                            parsedData.name,
                            `✨ Welcome to the Kingdom, ${title}! ✨`
                        );
                    } else {
                        // المستخدم ليس VIP ولا من أول 10
                        sendMainMessage(
                            parsedData.name,
                            `♔ Welcome to the Kingdom ♔\n${parsedData.username}`
                        );
                    }
                }
            }
            
            
            
            if (parsedData.handler === 'room_event' && parsedData.type === 'user_left' && parsedData.username === 'tebot') {

                const joinRoomMessage = {
                    handler: 'room_join',
                    id: 'QvyHpdnSQpEqJtVbHbFY',
                    name: parsedData.name
                };
                socket.send(JSON.stringify(joinRoomMessage));
            }

            const basePrices = {
                GOLD: 400000000000,     // سعر ابتدائي للذهب
                OIL: 250000000,   // سعر ابتدائي للنفط
                TECH: 300000000000,     // سعر ابتدائي للتكنولوجيا
                SILVER: 5000000000,     // سعر ابتدائي للفضة
                PLATINUM: 150000000000, // سعر ابتدائي للبلاتين
                DIAMOND: 900000000000000,  // سعر ابتدائي للألماس
                COPPER: 20000000000,    // سعر ابتدائي للنحاس
                GAS: 40000000000,   // سعر ابتدائي للغاز
                BITCOIN: 6000000,  // سعر ابتدائي للبيتكوين
                LITHIUM: 800000000000   // سعر ابتدائي للليثيوم
            };

            // دالة لتحديث الأسعار
            // دالة لتحديث الأسعار مع احتمالية زيادة أو نقصان
            const updatePrices = () => {
                const updatedPrices = { ...basePrices };

                // تحديث الأسعار بناءً على احتمالية الزيادة أو النقصان
                for (const key in updatedPrices) {
                    // اختيار عشوائي بين الزيادة أو النقصان
                    const changeDirection = Math.random() > 0.5 ? 1 : -1; // 50% زيادة أو نقصان
                    const changePercentage = Math.random() * 0.05; // تغيير بنسبة تصل إلى ±5%

                    updatedPrices[key] = updatedPrices[key] * (1 + changeDirection * changePercentage);

                    // التأكد من أن السعر لا يصبح سالبًا
                    if (updatedPrices[key] < 0) {
                        updatedPrices[key] = 0;
                    }
                }

                return updatedPrices;
            };


            // مثال على الاستخدام


            // تهيئة الأسعار باستخدام دالة updatePrices
            let prices = updatePrices();

            // تحديث الأسعار بشكل دوري
            setInterval(() => {
                prices = updatePrices(); // تحديث الأسعار كل 10 ثوانٍ
            }, 300000); // التحديث كل 10 ثوانٍ (10000 ميلي ثانية)
           
            

            if (parsedData.body === '.po') {
                const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                if (isUnverified) {
                    return;
                }
                const senderUsername = parsedData.from;
                const user = users.find(user => user.username === senderUsername);

                if (!user) {
                    const noUserMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: `🚫 We couldn't find your account! Start the game with the word ".st".`
                    };
                    socket.send(JSON.stringify(noUserMessage));
                    return;
                }

                // Ensure assets are initialized
                if (!user.assets) {
                    user.assets = { GOLD: 0, OIL: 0, TECH: 0, SILVER: 0, PLATINUM: 0, DIAMOND: 0, COPPER: 0, GAS: 0, BITCOIN: 0, LITHIUM: 0 }; // إضافة BITCOIN
                }

                // Create the assets list, filtering only those with a count > 0
                const userAssets = Object.entries(user.assets)
                    .filter(([_, count]) => count > 0) // Include only assets with count > 0
                    .map(([asset, count]) => {
                        const formattedCountPoints = formatPoints(count);

                        const emojis = {
                            GOLD: '🟡', OIL: '🛢️', TECH: '💻', SILVER: '⚪', PLATINUM: '⚫',
                            DIAMOND: '💎', COPPER: '🟠', GAS: '🔥', BITCOIN: '₿', LITHIUM: '🔋'
                        };
                        const emoji = emojis[asset] || ''; // Default to empty if no emoji found
                        return `${emoji} ${asset}: ${formattedCountPoints}`;
                    })
                    .join('\n');


                const formattedPoints = formatPoints(user?.points);

                const propertiesMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `
💰 Your remaining points: ${formattedPoints}  
🏠 Your assets:  
${userAssets || 'No assets yet.'}`
                };

                socket.send(JSON.stringify(propertiesMessage));
            }
            if (parsedData?.body?.startsWith('li@')) {
                // Check if the user is unverified
                const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                if (isUnverified) {
                    return;
                }
            
                // Extract the username after li@
                const requestedUsername = parsedData.body.split('@')[1]?.trim();
            
                if (!requestedUsername) {
                    const invalidCommandMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: '🚫 Please provide a username after "li@".'
                    };
                    socket.send(JSON.stringify(invalidCommandMessage));
                    return;
                }
            
                // Find the requested user
                const user = users.find(user => user.username === requestedUsername);
            
                if (!user) {
                    const noUserMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: `🚫 We couldn't find an account with the username '${requestedUsername}'.`
                    };
                    socket.send(JSON.stringify(noUserMessage));
                    return;
                }
            
                // Sort users by points in descending order
                const leaderboard = [...users].sort((a, b) => b.points - a.points);
            
                // Find the rank of the requested user
                const rank = leaderboard.findIndex(u => u.username === requestedUsername) + 1;
            
                // Format points for display
                const formattedPoints = formatPoints(user.points);
            
                // Create a response message
                const rankMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `🏅 Username: ${requestedUsername}\n💰 Points: ${formattedPoints}\n📊 Rank: ${rank} / ${users.length}`
                };
            
                socket.send(JSON.stringify(rankMessage));
            }
            

            if (parsedData.body === '.st') {
                const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                if (isUnverified) {
                    return;
                }
                const senderUsername = parsedData.from;
                let user = users.find(user => user.username === senderUsername);

                if (!user) {
                    user = {
                        username: senderUsername,
                        points: 1000, // Starting points
                        assets: { GOLD: 0, OIL: 0, TECH: 0, SILVER: 0, PLATINUM: 0, DIAMOND: 0, COPPER: 0, GAS: 0, BITCOIN: 0, LITHIUM: 0 } // All assets
                    };
                    users.push(user);
                }

                const formattedPoints = formatPoints(user?.points);

                // Format prices dynamically
                const assetPrices = Object.entries(prices).map(([asset, price]) => {
                    const emojis = {
                        GOLD: '🟡', OIL: '🛢️', TECH: '💻', SILVER: '⚪', PLATINUM: '⚫',
                        DIAMOND: '💎', COPPER: '🟠', GAS: '🔥', BITCOIN: '₿', LITHIUM: '🔋'
                    };
                    const formattedPrice = formatPoints(price);
                    return `${emojis[asset]} ${asset}: ${formattedPrice}`;
                }).join(' \n ');

                // Send a concise welcome message
                const borsaMessage = {
                    handler: 'room_message',
                    id: 'TclBVHgBzPGTMRTNpgWV',
                    type: 'text',
                    room: parsedData.room,
                    url: '',
                    length: '',
                    body: `
🎲 Welcome to the Stock Market!  
You have **${formattedPoints} points**.  
Current Prices:  
${assetPrices}  
Actions: "buy [ASSET]", "sell [ASSET]", or "wait".
            `
                };
                socket.send(JSON.stringify(borsaMessage));
                console.log('User initialized:', user);
                return;
            }


          
           
            if (parsedData.body && (parsedData.body.startsWith('buy') || parsedData.body.startsWith('sell'))) {
                const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                if (isUnverified) {
                    return;
                }

                const [action, asset, quantityInput] = parsedData.body.split(' ');
                const quantity = parseInt(quantityInput, 10); // Convert quantity directly here

                if (isNaN(quantity) || quantity <= 0) {
                    const invalidQuantityMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: `❌ The entered quantity is invalid. Please enter a number greater than 0.`
                    };
                    socket.send(JSON.stringify(invalidQuantityMessage));
                    return;
                }

                const senderUsername = parsedData.from;
                const user = users.find(user => user.username === senderUsername);

                if (!user) {
                    const noUserMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: `🚫 Your account could not be found! Start the game with the command ".st".`
                    };
                    socket.send(JSON.stringify(noUserMessage));
                    return;
                }

                if (!prices[asset]) {
                    const invalidAssetMessage = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: parsedData.room,
                        url: '',
                        length: '',
                        body: `❌ The asset "${asset}" does not exist. Choose from GOLD, OIL, or TECH.`
                    };
                    socket.send(JSON.stringify(invalidAssetMessage));
                    return;
                }

                if (action === 'buy') {
                    try {
                        const totalPrice = prices[asset] * quantity;  // Calculate the total price
                        if (user.points >= totalPrice) {
                            user.points -= totalPrice;
                            
                            user.assets[asset] = (user.assets[asset] || 0) + quantity; // Add the correct quantity
    
                            // Save data to file
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
    
                            const formattedPointsUSER = formatPoints(user.points);
    
                            const successMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `✅ Successfully bought ${quantity} of ${asset}! Your points now: ${formattedPointsUSER}.`
                            };
                            socket.send(JSON.stringify(successMessage));
                        } else {
                            const insufficientFundsMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `❌ You don't have enough points to buy ${quantity} of ${asset}.`
                            };
                            socket.send(JSON.stringify(insufficientFundsMessage));
                        }
                      }
                      catch(err) {
                        
                      }

                } else if (action === 'sell') {
                    if (user.assets[asset] >= quantity) {
                        const totalSellPrice = prices[asset] * quantity;
                        user.points += totalSellPrice;
                        user.assets[asset] -= quantity;

                        // Save data to file
                        fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                        const formattedPointsUSER = formatPoints(user.points);

                        const successMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `✅ Sold ${quantity} of ${asset}! Your points now: ${formattedPointsUSER}.`
                        };
                        socket.send(JSON.stringify(successMessage));
                    } else {
                        const noAssetsMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `❌ You don't have enough ${asset} to sell.`
                        };
                        socket.send(JSON.stringify(noAssetsMessage));
                    }
                }
            }







            if (parsedData.handler === 'room_event' && parsedData.body === 'فزوره') {
                const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                if (isUnverified) {
                    // Additional actions if needed when user is unverified
                    return;
                }
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

                    // تحقق مما إذا كان المستخدم موجودًا في ملف masterbot
                    if (!isUserInMasterBot(parsedData.from)) {
                        console.log(`User ${parsedData.from} not found in masterbot, verification skipped.`);
                        return;
                    }

                    let user = users.find(user => user.username === usernameToVerify);
                    if (!user) {
                        user = {
                            username: usernameToVerify, verified: true, lasttimegift: null, points: null, name: null,
                            nickname: null
                        };
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

                    // تحقق مما إذا كان المستخدم موجودًا في ملف masterbot
                    if (!isUserInMasterBot(parsedData.from)) {
                        console.log(`User ${parsedData.from} not found in masterbot, verification skipped.`);
                        return;
                    }
                    const userIndex = users.findIndex(user => user.username === usernameToDelete);
                    if (userIndex !== -1) {
                        users.splice(userIndex, 1);
                        console.log(`User removed: ${usernameToDelete}`);
                        sendVerificationMessage(parsedData.room, `User removed: ${usernameToDelete}`);
                        writeUsersToFile(users);
                    } else {
                        console.log(`User not found: ${usernameToDelete}`);
                    }
                }
                else if (body === '.resetpoint' && parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا") {

                    // تحقق مما إذا كان المستخدم موجودًا في ملف masterbot
                    if (!isUserInMasterBot(parsedData.from)) {
                        console.log(`User ${parsedData.from} not found in masterbot, verification skipped.`);
                        return;
                    }
                    resetPointsAndAssets();


                }
                else if (body === '.list' && parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا") {

                    // تحقق مما إذا كان المستخدم موجودًا في ملف masterbot
                    if (!isUserInMasterBot(parsedData.from)) {
                        console.log(`User ${parsedData.from} not found in masterbot, verification skipped.`);
                        return;
                    }

                    let userlenghth = getArrayLength(users);
                    sendVerificationMessage(parsedData.room, `Users: ${userlenghth}`);


                } else if (body.startsWith('ms@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐠𝐚𝐫˼𔘓")) {

                    const usernameToAdd = body.split('@')[1].trim();
                    addUserToMasterBot(usernameToAdd);
                    sendVerificationMessage(parsedData.room, `User Added Master: ${usernameToAdd}`);


                    // تحقق من الرسائل التي تبدأ بـ delms@ لحذف المستخدم من masterbot
                } else if (body.startsWith('delms@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐠𝐚𝐫˼𔘓")) {
                    const usernameToRemove = body.split('@')[1].trim();
                    removeUserFromMasterBot(usernameToRemove);
                    sendVerificationMessage(parsedData.room, `User removed Master: ${usernameToRemove}`);

                } // خريطة لتتبع آخر وقت لكل مستخدم أرسل spec@


                else if (body.startsWith('spec@')) {
                    const currentTime = Date.now(); // الوقت الحالي بالمللي ثانية
                    const lastTime = lastSpecTime.get(parsedData.from) || 0;

                    // التحقق من مرور دقيقتين (120000 مللي ثانية)
                    if (currentTime - lastTime < 120000) {
                        sendMainMessage(parsedData.room, `❌ You can only use spec@ once every 2 minutes.`);
                        return;
                    }

                    // تحديث وقت الإرسال
                    lastSpecTime.set(parsedData.from, currentTime);

                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        return; // Betting is not allowed for unverified users
                    }

                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {
                        const betAmount = parseInt(body.split('@')[1], 10); // Extract the bet amount
                        if (isNaN(betAmount) || betAmount <= 0) {
                            sendMainMessage(parsedData.room, `❌ Invalid bet amount! Please enter a positive number.`);
                            return;
                        }

                        if (respondingUser.points < betAmount) {
                            sendMainMessage(parsedData.room, `❌ User ${parsedData.from} does not have enough points to bet ${betAmount}.`);
                            return;
                        }

                        // Determine the bet result
                        const win = Math.random() < 0.5; // 50% chance to win
                        const changeAmount = Math.floor(betAmount * (Math.random() * 0.5 + 0.5)); // Random change between 50% and 100%

                        if (win) {
                            respondingUser.points += changeAmount;
                            sendMainMessage(
                                parsedData.room,
                                `🎉 User ${parsedData.from} won ${changeAmount} points! New balance: ${formatPoints(respondingUser.points)}.`
                            );
                        } else {
                            respondingUser.points -= changeAmount;
                            sendMainMessage(
                                parsedData.room,
                                `😢 User ${parsedData.from} lost ${changeAmount} points. New balance: ${formatPoints(respondingUser.points)}.`
                            );
                        }
                    }
                }


                else if (body.startsWith('bet@')) {
                    const betAmount = parseInt(body.split('@')[1]); // استخراج المبلغ المراهن عليه
                    const bettingData = readBettingData();
                    const player = users.find(user => user.username === parsedData.from);
                    
                    // التحقق من وجود اللاعب ونقاطه
                    if (!player || player.points < betAmount) {
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to start a bet. You currently have ${player ? player.points : 0} points.`);
                        return;
                    }
                
                    // التحقق من آخر وقت للمراهنة
                    const now = Date.now();
                    if (!player.lastBetTime) player.lastBetTime = 0; // تهيئة الوقت إذا لم يكن موجودًا
                    if (now - player.lastBetTime < 600000) { // 300,000 ms = 5 دقائق
                        sendMainMessage(parsedData.room, `❌ You can only start or join a bet once every 10 minutes.`);
                        return;
                    }
                
                    // التحقق من وجود بيانات الغرفة
                    if (!bettingData[parsedData.room]) {
                        bettingData[parsedData.room] = {
                            betAmount: null,
                            players: [],
                            startedBy: null,
                            active: false
                        };
                    }
                
                    const roomData = bettingData[parsedData.room];
                
                    // تحقق إذا كانت هناك لعبة جارية في الغرفة
                    if (roomData.active) {
                        sendMainMessage(parsedData.room, `❌ A game is already in progress. Please wait until it finishes.`);
                        return;
                    }
                
                    // إعداد بيانات اللعبة الجديدة
                    roomData.betAmount = betAmount;
                    roomData.players = [{
                        username: parsedData.from,
                        betAmount: betAmount
                    }];
                    roomData.startedBy = parsedData.from;
                    roomData.active = true;
                
                    // تحديث وقت آخر مراهنة للمستخدم
                    player.lastBetTime = now;
                
                    // حفظ بيانات المراهنة
                    writeBettingData(bettingData);
                
                    // إرسال الرسالة الموحدة لجميع الغرف
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);
                                        for (let room of roomsData) {
                                            if (!room.bet) {
                                                continue; // تخطي هذه الغرفة
                                            }
                        sendMainMessage(
                            room.name,
                            `🎲✨ A new bet has been started by 🧑‍💼 ${parsedData.from} in room "${parsedData.room}" with 💰 ${betAmount} points! 💸\n🔥🎮 Join the bet by typing 'bet' and show your skills! 🚀🏆`
                        );
                    }
                
                    // إرسال رسالة قبل انتهاء اللعبة ب60 ثانية (1 دقيقة)
                    setTimeout(() => {
                        const updatedBettingData = readBettingData();
                        const updatedRoomData = updatedBettingData[parsedData.room];
                        if (!updatedRoomData.betAmount) {
                            return; // إذا كانت betAmount تساوي null أو false، لا ترسل الرسالة
                        }
                        if (updatedRoomData && updatedRoomData.active && updatedRoomData.startedBy === parsedData.from) {
                            
                            sendMainMessage(parsedData.room, `⏰ The game will automatically end in 1 minute. Hurry up and make your move!`);
                        }
                    }, 30000); // إرسال الرسالة بعد 30 ثانية
                
                    // تعيين مؤقت لإغلاق اللعبة بعد دقيقة إذا لم يُرسل .start
                    setTimeout(() => {
                        const updatedBettingData = readBettingData();
                        const updatedRoomData = updatedBettingData[parsedData.room];
                        if (!updatedRoomData.betAmount) {
                            return; // إذا كانت betAmount تساوي null أو false، لا ترسل الرسالة
                        }
                        if (updatedRoomData && updatedRoomData.active && updatedRoomData.startedBy === parsedData.from) {
                            sendMainMessage(parsedData.room, `⏰ The game has been automatically ended due to no action from ${parsedData.from}.`);
                            // إعادة تعيين بيانات المراهنة بعد مرور دقيقة
                            updatedRoomData.active = false;
                            updatedRoomData.betAmount = null;
                            updatedRoomData.startedBy = null;
                            updatedRoomData.players = [];
                            writeBettingData(updatedBettingData);
                        }
                    }, 60000); // 60,000 ms = 1 دقيقة
                }
              
                

                // تخزين المهلات لكل غرفة
                
            
                if (parsedData.body === 'shot' || parsedData.body === '.s') {
                    const senderUsername = parsedData.from;
                    const userblocked = usersblockes.find(user => user === senderUsername);

                    if (userblocked) {
                       
                        return;
                    }
                    let user = users.find(user => user.username === senderUsername);
                if (!user) {
                    user = {
                        username: usernameToVerify, verified: true, lasttimegift: null, points: null, name: null,
                        nickname: null
                    };
                    users.push(user);
                    console.log(`New user added: ${usernameToVerify}`);
                } else {
                    user.verified = true;
                }

                writeUsersToFile(users);
            
             
            
                  
                } 
              
                
                
                    if (parsedData.body === '.cr') {
                        const senderUsername = parsedData.from;
                        let user = users.find(user => user.username === senderUsername);
                    if (!user) {
                        user = {
                            username: usernameToVerify, verified: true, lasttimegift: null, points: null, name: null,
                            nickname: null
                        };
                        users.push(user);
                    } else {
                        user.verified = true;
                    }

                    writeUsersToFile(users);
                
                        // إذا لم يكن المستخدم موثقًا
                        if (!user || !user.verified) {
                            const notVerifiedMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: parsedData.room,
                                body: `User ${senderUsername} is not verified! Please verify first. Contact: i_gamd_i`
                            };
                            socket.send(JSON.stringify(notVerifiedMessage));
                            return;
                        }
                
                        const cricketGameData = readCricketGameData();
                        const data = fs.readFileSync('rooms.json', 'utf8');
                        const roomsData = JSON.parse(data);
                        const activeGame = Object.values(cricketGameData).some(game => game.active);
                
                        if (activeGame) {
                            sendMainMessage(parsedData.room, `🚫 A game is already in progress in one of the rooms. Wait until the current match ends.`);
                            return;
                        }
                
                        const roomName = parsedData.room;
                        const room = roomsData.find(r => r.name === roomName);
                
                        if (room) {
                            if (cricketGameData[roomName] && cricketGameData[roomName].active && cricketGameData[roomName].players.length > 0) {
                                sendMainMessage(parsedData.room, `🚫 A game is already in progress in this room. Wait until the current match ends.`);
                                return;
                            }
                
                            if (!cricketGameData[roomName]) {
                                cricketGameData[roomName] = {
                                    betAmount: null,
                                    players: [{
                                        username: parsedData.from,
                                        role: 'attacker',
                                        status: 'waiting'
                                    }],
                                    startedBy: parsedData.from,
                                    active: true,
                                    gameRoom: parsedData.room,
                                    rounds: 0
                                };
                
                                // تعيين مهلة إيقاف اللعبة بعد دقيقة
                                cricketGameTimeouts.set(roomName, setTimeout(() => {
                                    if (cricketGameData[roomName] && cricketGameData[roomName].players.length === 1) {
                                        sendMainMessage(parsedData.room, `🚫 Game cancelled. No one joined within 1 minute.`);
                                        cricketGameData[roomName].active = false;  // تعطيل اللعبة
                                        writeCricketGameData(cricketGameData);
                                    }
                                    cricketGameTimeouts.delete(roomName);  // إزالة المهلة من الذاكرة
                                }, 90000));  // دقيقة واحدة
                
                                console.log(`Room ${roomName} added to cricket game data with ${parsedData.from} as attacker.`);
                            } else {
                                if (!cricketGameData[roomName].active) {
                                    cricketGameData[roomName].gameRoom = parsedData.room;
                                    cricketGameData[roomName].active = true;
                                    cricketGameData[roomName].players = [{
                                        username: parsedData.from,
                                        role: 'attacker',
                                        status: 'waiting'
                                    }];
                                    cricketGameData[roomName].rounds = 0;
                                     // تعيين مهلة إيقاف اللعبة بعد دقيقة
                                cricketGameTimeouts.set(roomName, setTimeout(() => {
                                    if (cricketGameData[roomName] && cricketGameData[roomName].players.length === 1) {
                                        sendMainMessage(parsedData.room, `🚫 Game cancelled. No one joined within 1 minute.`);
                                        cricketGameData[roomName].active = false;  // تعطيل اللعبة
                                        writeCricketGameData(cricketGameData);
                                    }
                                    cricketGameTimeouts.delete(roomName);  // إزالة المهلة من الذاكرة
                                }, 90000));  // دقيقة واحدة
                                    console.log(`Room ${roomName} reactivated for a new game with ${parsedData.from} as attacker.`);
                                } else {
                                    sendMainMessage(parsedData.room, `🚫 A game is already in progress in this room. Wait until the current match ends.`);
                                    return;
                                }
                            }
                
                            // إرسال رسالة لجميع الغرف لإعلامهم ببدء اللعبة
                            for (let room of roomsData) {
                                sendMainMessage(room.name, `🏏 The cricket match has been activated by ${parsedData.from} in room "${parsedData.room}". Type '.enter' to join!`);
                            }
                
                            writeCricketGameData(cricketGameData);
                        } else {
                            console.log(`Room ${roomName} not found in rooms data.`);
                        }
                    } 
                
                               
                
                // else if (body === '.cr') {
                //     const senderUsername =parsedData.from

                //     let user = users.find(user => user.username === senderUsername);

                //     // إذا لم يكن المستخدم موثقًا
                //     if (!user || !user.verified) {
                //         const notVerifiedMessage = {
                //             handler: 'room_message',
                //             id: 'TclBVHgBzPGTMRTNpgWV',
                //             type: 'text',
                //             room: parsedData.room,
                //             url: '',
                //             length: '',
                //             body: `User ${senderUsername} is not verified! Please verify first. Contact: i_gamd_i`
                //         };
                //         socket.send(JSON.stringify(notVerifiedMessage));
                //         return; // إيقاف الكود إذا كان المستخدم غير موثق
                //     }
                //     const cricketGameData = readCricketGameData();
                //     const data = fs.readFileSync('rooms.json', 'utf8');
                //     const roomsData = JSON.parse(data);
                //     const activeGame = Object.values(cricketGameData).some(game => game.active);

                //     if (activeGame) {
                //         sendMainMessage(parsedData.room, `🚫 A game is already in progress in one of the rooms. Wait until the current match ends.`);
                //         return;
                //     }
                //     const roomName = parsedData.room;
                //     const room = roomsData.find(r => r.name === roomName);
                
                //     if (room) {
                //         if (cricketGameData[roomName] && cricketGameData[roomName].active && cricketGameData[roomName].players.length > 0) {
                //             sendMainMessage(parsedData.room, `🚫 A game is already in progress in this room. Wait until the current match ends.`);
                //             return;
                //         }
                
                //         if (!cricketGameData[roomName]) {
                //             cricketGameData[roomName] = {
                //                 betAmount: null,
                //                 players: [{
                //                     username: parsedData.from,
                //                     role: 'attacker',
                //                     status: 'waiting'
                //                 }],
                //                 startedBy: parsedData.from,
                //                 active: true,
                //                 gameRoom: parsedData.room,
                //                 rounds: 0  // تتبع عدد الجولات
                //             };
                            
                //             console.log(`Room ${roomName} added to cricket game data with ${parsedData.from} as attacker.`);
                //         } else {
                //             if (!cricketGameData[roomName].active) {
                //                 cricketGameData[roomName].gameRoom = parsedData.room;

                //                 cricketGameData[roomName].active = true;
                //                 cricketGameData[roomName].players = [{
                //                     username: parsedData.from,
                //                     role: 'attacker',
                //                     status: 'waiting'
                //                 }];
                //                 cricketGameData[roomName].rounds = 0;  // إعادة تعيين الجولات

                                
                //                 console.log(`Room ${roomName} reactivated for a new game with ${parsedData.from} as attacker.`);
                //             } else {
                //                 sendMainMessage(parsedData.room, `🚫 A game is already in progress in this room. Wait until the current match ends.`);
                //                 return;
                //             }
                //         }
                
                //         for (let room of roomsData) {
                //             sendMainMessage(room.name, `🏏 The cricket match has been activated by ${parsedData.from} in room "${parsedData.room}". Type '.enter' to join!`);
                //         }
                        

                //         writeCricketGameData(cricketGameData);
                //     } else {
                //         console.log(`Room ${roomName} not found in rooms data.`);
                //     }
                // }
                
                else if (body === '.enter') {
                    const senderUsername =parsedData.from

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
                            body: `User ${senderUsername} is not verified! Please verify first. Contact: i_gamd_i`
                        };
                        socket.send(JSON.stringify(notVerifiedMessage));
                        return; // إيقاف الكود إذا كان المستخدم غير موثق
                    }
                    const cricketGameData = readCricketGameData();
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);
                    const roomName = parsedData.room;
                
                    let activeRoomData = null;
                
                    for (const roomName in cricketGameData) {
                        if (cricketGameData[roomName].active) {
                            activeRoomData = cricketGameData[roomName];
                            break;
                        }
                    }
                    const attacker = activeRoomData?.players?.find(player => player.role === 'attacker');

        if (attacker && attacker.username === senderUsername) {
            sendMainMessage(parsedData.room, `🚫 You cannot join as a defender. The attacker must be in a different room.`);
            return;
        }
                    if (activeRoomData) {
                        if (activeRoomData.players.length === 1) {
                            activeRoomData.players.push({
                                username: parsedData.from,
                                role: 'defender',
                                status: 'waiting',
                                joinedFromRoom: roomName
                            });
                            sendMainMessage(activeRoomData.gameRoom, `🏏 ${parsedData.from} has joined the game as defender! The game is now starting.`);
                            sendMainMessage(parsedData.room, `🏏 ${parsedData.from} has joined the game as defender! The game is now starting.`);

                            sendMainMessage(activeRoomData.gameRoom, `🏏 The game has started in room "${activeRoomData.gameRoom}". ${activeRoomData.players[0].username} is the attacker, and ${parsedData.from} is the defender.`);
                            sendMainMessage(activeRoomData.gameRoom, `🎯 Please ${activeRoomData.players[0].username} send a number between 1 and 6 to start your turn.`);
                
                            activeRoomData.awaitingNumber = true;
                            activeRoomData.awaitingDefenderGuess = false;

                            writeCricketGameData(cricketGameData);
                            sendMainMessage(activeRoomData.players[0].joinedFromRoom, `🏏 ${parsedData.from} has joined the game as defender. The game has started!`);
                            sendMainMessage(activeRoomData.gameRoom, `🏏 ${parsedData.from} has joined the game as defender. The game has started!`);

                        } else {
                            sendMainMessage(parsedData.room, `🚫 The game is either already full or not yet started. Please wait until the game is ready.`);
                        }
                    } else {
                        sendMainMessage(parsedData.room, `🚫 No active game found.`);
                    }
                }

                else if (/^[1-6]$/.test(body)) {
                    const cricketGameData = readCricketGameData();
                    const firstGame = Object.values(cricketGameData)[0];
                    // const roomName = parsedData.room;
                    // const roomName = firstGame.gameRoom;
                    const activeGame = Object.values(cricketGameData).find(game => game.active);
                    const roomName = activeGame?.gameRoom;

                    const activeRoomData = cricketGameData[roomName];

                    if (!activeRoomData) {
                        return; // إذا لم تكن الرسالة من إحدى الغرفتين المتوقعتين، قم بإرجاع ولا تفعل شيء
                    }
                
                    // دالة لإنهاء اللعبة إذا لم يرسل اللاعب رقمه في الوقت المحدد
                    function endGameDueToTimeout() {
                        sendMainMessage(activeRoomData.gameRoom, `🏁 The game ended because of inactivity!`);
                        sendMainMessage(activeRoomData.players[0].joinedFromRoom, `🏁 The game ended because of inactivity`);
                
                        // خصم مليار نقطة من اللاعب الذي تأخر
                        const usernameToDeductPoints = parsedData.from;
                        const amountToDeduct = 1000000000;
                
                        const targetPlayer = users.find(user => user.username === usernameToDeductPoints);
                
                        if (!targetPlayer) {
                            sendMainMessage(parsedData.room, `❌ User ${usernameToDeductPoints} not found.`);
                            return;
                        }
                
                        // خصم النقاط
                
                        // حفظ البيانات بعد خصم النقاط
                        fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                        // إنهاء اللعبة بعد فترة
                        activeRoomData.active = false;
                        deleteCricketGameData(); // حذف البيانات بعد نهاية اللعبة
                        writeCricketGameData(cricketGameData);
                    }
                
                    if (activeRoomData && activeRoomData.active && activeRoomData.awaitingNumber) {
                        if (parsedData.from === activeRoomData.players[0].username) {
                            activeRoomData.awaitingNumber = false;
                            activeRoomData.lastNumber = body;
                            sendMainMessage(parsedData.room, `🎲 ${parsedData.from} rolled a ${body} in the game!`);
                            sendMainMessage(activeRoomData.players[1].joinedFromRoom, `🤔 The attacker has rolled. Please ${activeRoomData.players[1].username} guess a number between 1 and 6.`);
                            activeRoomData.awaitingDefenderGuess = true;
                            writeCricketGameData(cricketGameData);
                
                            // إذا تم إرسال الرقم من المهاجم، نبدأ العد التنازلي من جديد
                            clearTimeout(roundTimeout); // إلغاء المؤقت السابق
                            roundTimeout = setTimeout(endGameDueToTimeout, 30000); // إعادة البدء بعد 30 ثانية
                        } else {
                            sendMainMessage(parsedData.room, `🚫 You are not the attacker. Wait for your turn.`);
                        }
                    } else if (activeRoomData && activeRoomData.active && activeRoomData.awaitingDefenderGuess) {
                        if (parsedData.from === activeRoomData?.players[1]?.username) {
                            activeRoomData.rounds++;
                            const defenderGuess = body;
                            const attackerNumber = activeRoomData.lastNumber;

                            // التحقق من الإجابة
                            if (defenderGuess === attackerNumber) {
                                sendMainMessage(parsedData.room, `🎯 ${parsedData.from} guessed correctly! The attacker rolled a ${defenderGuess}.`);
                                sendMainMessage(activeRoomData.players[0].joinedFromRoom, `🎯 ${parsedData.from} guessed correctly! The attacker rolled a ${attackerNumber}.`);
                                sendMainMessage(activeRoomData.gameRoom, `🎯 ${parsedData.from} guessed correctly! The attacker rolled a ${attackerNumber}.`);
                                activeRoomData.players[1].correctGuesses = (activeRoomData.players[1].correctGuesses || 0) + 1;
                            } else {
                                sendMainMessage(parsedData.room, `❌ ${parsedData.from} guessed wrong. The attacker rolled a ${attackerNumber}.`);
                                sendMainMessage(activeRoomData.players[0].joinedFromRoom, `❌ ${parsedData.from} guessed wrong. The attacker rolled a ${attackerNumber}.`);
                                sendMainMessage(activeRoomData.gameRoom, `❌ ${parsedData.from} guessed wrong. The attacker rolled a ${attackerNumber}.`);
                            }
                
                            // إذا كانت إجابة المدافع صحيحة 3 مرات
                            if (activeRoomData.players[1].correctGuesses === 3) {
                                sendMainMessage(parsedData.room, `🎉 ${parsedData.from} won the game by guessing 3 times correctly!`);
                                sendMainMessage(activeRoomData.gameRoom, `🎉 ${parsedData.from} won the game by guessing 3 times correctly!`);
                                sendMainMessage(activeRoomData.players[0].joinedFromRoom, `🎉 ${parsedData.from} won the game by guessing 3 times correctly!`);
                
                                // منح مليار نقطة للمدافع
                                const usernameToAddPoints = activeRoomData.players[1].username;
                                const amountToAdd = 1000000000;
                
                                const targetPlayer = users.find(user => user.username === usernameToAddPoints);
                
                                if (!targetPlayer) {
                                    sendMainMessage(parsedData.room, `❌ User ${usernameToAddPoints} not found.`);
                                    return;
                                }
                
                                // إضافة النقاط
                                targetPlayer.points += amountToAdd;
                
                                // حفظ البيانات بعد إضافة النقاط
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                                activeRoomData.active = false;
                                deleteCricketGameData();
                                writeCricketGameData(cricketGameData);
                            }
                
                            // إذا لم يحقق المدافع 3 إجابات صحيحة
                            else if (activeRoomData.rounds >= 6) {
                                sendMainMessage(parsedData.room, `🏁 The game has ended after 6 rounds. ${activeRoomData.players[0].username} won with 1B points!`);
                                sendMainMessage(activeRoomData.gameRoom, `🏁 The game has ended after 6 rounds. ${activeRoomData.players[0].username} won with 1B points!`);
                                sendMainMessage(activeRoomData.players[0].joinedFromRoom, `🏁 The game has ended after 6 rounds. ${activeRoomData.players[0].username} won with 1B points!`);
                
                                // منح مليار نقطة للمهاجم
                                const usernameToAddPoints = activeRoomData.players[0].username;
                                const amountToAdd = 1000000000;
                
                                const targetPlayer = users.find(user => user.username === usernameToAddPoints);
                
                                if (!targetPlayer) {
                                    sendMainMessage(parsedData.room, `❌ User ${usernameToAddPoints} not found.`);
                                    return;
                                }
                
                                // إضافة النقاط
                                targetPlayer.points += amountToAdd;
                
                                // حفظ البيانات بعد إضافة النقاط
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                                activeRoomData.active = false;
                                deleteCricketGameData();
                                writeCricketGameData(cricketGameData);
                            }
                
                            activeRoomData.awaitingDefenderGuess = false;
                            activeRoomData.awaitingNumber = true; // إعادة السماح للمهاجم برمي الرقم من جديد
                            writeCricketGameData(cricketGameData);
                
                            if (activeRoomData.rounds < 6) {
                                sendMainMessage(activeRoomData.gameRoom, `🎯 Now it is ${activeRoomData.players[0].username}'s turn to roll again!`);
                            }
                
                            // إعادة تعيين المؤقت
                            clearTimeout(roundTimeout);
                            roundTimeout = setTimeout(endGameDueToTimeout, 30000); // إعادة البدء بعد 30 ثانية
                
                        } else {
                            sendMainMessage(parsedData.room, `🚫 You are not the defender. Wait for your turn.`);
                        }
                    }
                }
                
                
                
                
                
                
                
                
                
                
                
                
                else if (body.startsWith('+cp@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐠𝐚𝐫˼𔘓")) {
                    // Extract the username and amount to be added
                    const parts = body.split('@');
                    const usernameToAddPoints = parts[1];
                    const amountToAdd = parseInt(parts[2]);
                    
                    // Check if the amount is a valid number
                    if (isNaN(amountToAdd) || amountToAdd <= 0) {
                        sendMainMessage(parsedData.room, `❌ Invalid amount provided. Please enter a valid number greater than 0.`);
                        return;
                    }
                
                    // Find the player who sent the command (admin or authorized user)
                    const admin = users.find(user => user.username === parsedData.from);
                
                    // Ensure the admin exists
                    if (!admin) {
                        sendMainMessage(parsedData.room, `❌ Admin ${parsedData.from} not found.`);
                        return;
                    }
                
                    // Find the target player by username
                    const targetPlayer = users.find(user => user.username === usernameToAddPoints);
                
                    // Ensure the target player exists
                    if (!targetPlayer) {
                        sendMainMessage(parsedData.room, `❌ User ${usernameToAddPoints} not found.`);
                        return;
                    }
                
                    // Add the amount to the target player's points
                    targetPlayer.points += amountToAdd;
                
                    // Save the updated users data to the file
                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                    // Notify the room that the points have been added
                    sendMainMessage(parsedData.room, `✅ ${amountToAdd} points have been added to ${usernameToAddPoints}'s account by ${parsedData.from}. ${usernameToAddPoints} now has ${targetPlayer.points} points.`);
                }
                
                

                else if (body === 'bet') {
                    const bettingData = readBettingData();
                    const roomData = Object.values(bettingData).find(room => room.active); // إيجاد الغرفة النشطة
                
                    // تحقق إذا كانت هناك مراهنة جارية
                    if (!roomData) {
                        sendMainMessage(parsedData.room, `❌ No betting has started yet. Use "bet@<amount>" to start the bet.`);
                        return;
                    }
                
                    let player = users.find(user => user.username === parsedData.from);
                    if (!player) {
                        sendMainMessage(parsedData.room, `❌ Player not found. Please make sure you are logged in.`);
                        return;
                    }
                
                    if (player.points < roomData.betAmount) {
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to join the bet. Your current points are ${player.points}.`);
                        return;
                    }
                
                    // تحقق إذا كان اللاعب لديه نقاط كافية
                    if (player && player.points >= roomData.betAmount) {
                        // تحقق إذا كان اللاعب قد انضم بالفعل
                        if (!roomData.players.find(player => player.username === parsedData.from)) {
                            player.points -= roomData.betAmount; // خصم المبلغ من نقاط اللاعب
                            roomData.players.push({
                                username: parsedData.from,
                                betAmount: roomData.betAmount
                            });
                
                            writeBettingData(bettingData); // تحديث بيانات المراهنة
                
     // إرسال الرسالة الموحدة لجميع الغرف
     const data = fs.readFileSync('rooms.json', 'utf8');
     const roomsData = JSON.parse(data);
const rooms = roomsData.map(room => room.name);
                         for (let room of roomsData) {
                             if (!room.bet) {
                                 continue; // تخطي هذه الغرفة
                             }
        sendMainMessage(
            room.name, 
            `🎉 ${parsedData.from} has joined the bet with 💰 ${roomData.betAmount} points! 🚀\nThe game was started  .\nTo start the game please ${roomData.startedBy}, type .start!`
        );
        
     }                    
                
                            // إعلام الغرفة الحالية (حيث أرسل المستخدم الأمر)
                         
                        } else {
                            sendMainMessage(parsedData.room, `❌ You have already joined the bet.`);
                        }
                    } else {
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to join the bet. Your current points are ${player ? player.points : 0}.`);
                    }
                }
                
                
                
                


                else if (body === '.start') {
                    const bettingData = readBettingData();
                    const roomData = bettingData[parsedData.room];
                
                    // تحقق من الصلاحيات
                    if (!roomData || roomData.startedBy !== parsedData.from) {
                        sendMainMessage(parsedData.room, `❌ Only the player who started the bet can start the game.`);
                        return;
                    }
                
                    if (roomData.players.length < 2) {
                        sendMainMessage(parsedData.room, `❌ There must be at least two players to start the game.`);
                        return;
                    }
                
                    // تحديد الفائز عشوائيًا
                    const winnerIndex = Math.floor(Math.random() * roomData.players.length);
                    const winner = roomData.players[winnerIndex];
                    const totalPoints = roomData.betAmount * roomData.players.length;
                
                    // تحديث النقاط: الفائز يحصل على المبلغ الإجمالي
                    let winnerPlayer = users.find(user => user.username === winner.username);
                    if (winnerPlayer) {
                        winnerPlayer.points += totalPoints;
                    }
                
                    // خصم المبلغ من اللاعبين الخاسرين
                    roomData.players.forEach(player => {
                        if (player.username !== winner.username) {
                            let losingPlayer = users.find(user => user.username === player.username);
                            if (losingPlayer) {
                                losingPlayer.points -= player.betAmount;
                            }
                        }
                    });
                
                    // إعادة تعيين حالة المراهنة
                    roomData.players = [];
                    roomData.active = false;
                    roomData.betAmount = null;
                    roomData.startedBy = null;
                
                    // حفظ البيانات بعد انتهاء اللعبة
                    writeBettingData(bettingData);
                
                    // إرسال رسالة الفوز إلى جميع الغرف
                    Object.keys(bettingData).forEach((roomName) => {
                       
                    
                        sendMainMessage(
                            roomName,
                            `🎉 The winner of the bet is ${winner.username}, who wins ${totalPoints} points! 🎉`
                        );
                    });
                    
                }
                
                else if (body.startsWith('steal@')) {
                    // استخراج اسم المستخدم والمبلغ من الرسالة
                    const parts = body.split('@');
                    if (parts.length < 3) {
                        sendMainMessage(parsedData.room, `❌ Invalid format! Please use the format 'steal@username@amount'.`);
                        return;
                    }
                    const targetUsername = parts[1].trim();
                    const amount = parseInt(parts[2].trim());  // تحويل المبلغ إلى عدد صحيح
                    
                    // العثور على السارق والهدف في القائمة
                    const thief = users.find(user => user.username === parsedData.from);
                    const target = users.find(user => user.username === targetUsername);
                    if (isNaN(amount) || amount <= 0) {
                        sendMainMessage(parsedData.room, `❌ Invalid amount! Please enter a valid number greater than zero.`);
                        return;
                    }
                    // تحقق من وجود المستخدم والهدف
                    if (!thief) {
                        sendMainMessage(parsedData.room, `❌ You are not a registered user.`);
                        return;
                    }
                    if (!target) {
                        sendMainMessage(parsedData.room, `❌ The target user does not exist.`);
                        return;
                    }
                    if (thief.username === target.username) {
                        sendMainMessage(parsedData.room, `❌ You cannot steal from yourself.`);
                        return;
                    }
                
                    // التحقق من الحماية
                    const now = Date.now();
                    if (target.protectionUntil && target.protectionUntil > now) {
                        sendMainMessage(parsedData.room, `🛡️ ${target.username} is protected from theft! Try again later.`);
                        return;
                    }
                
                    // التحقق من وقت المحاولة السابقة
                    if (thief.lastTheftAttempt && thief.lastTheftAttempt + 2 * 60 * 1000 > now) {
                        const remainingTime = Math.ceil((thief.lastTheftAttempt + 2 * 60 * 1000 - now) / 1000);
                        sendMainMessage(parsedData.room, `⏳ You can steal again in ${remainingTime} seconds.`);
                        return;
                    }
                
                    // تحديث وقت المحاولة الأخيرة
                    thief.lastTheftAttempt = now;
                
                    // التحقق من أن السارق لديه نقاط كافية
                    if (thief.points < amount) {
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to steal ${amount} points.`);
                        return;
                    }
                
                    // التحقق من أن الهدف لديه المبلغ المطلوب
                    if (target.points < amount) {
                        sendMainMessage(parsedData.room, `❌ ${target.username} doesn't have ${amount} points to steal.`);
                        return;
                    }
                
                    // إرسال رسالة المحاولة
                    sendMainMessage(parsedData.room, `🔍 ${thief.username} is attempting to steal ${amount} points from ${target.username}...`);
                
                    // تأخير النتيجة لمدة 5 ثوانٍ
                    setTimeout(() => {
                        const successChance = Math.random() < 0.4; // فرصة النجاح 50%
                
                        if (successChance) {
                            // نجاح السرقة
                            target.points -= amount; // خصم المبلغ من الهدف
                            thief.points += amount; // إضافة المبلغ للسارق
                
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                            sendMainMessage(
                                parsedData.room,
                                `🎉 ${thief.username} successfully stole 💰 ${amount} points from ${target.username}!`
                            );
                
                            // إرسال رسالة خاصة للسارق (thief) عند النجاح
                            const successMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: thief.username,  // إرسال الرسالة للسارق
                                body: `🎉 You successfully stole 💰 ${amount} points from ${target.username}! \n You can steal more points using the command: 'steal@username@amount'.`,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(successMessage));
                            const targetMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: target.username,  // إرسال الرسالة للهدف
                                body: `😢💸 Oh no! You have been stolen ${amount} points by ${thief.username}! 😔 \n😓 You can try stealing more points using the command: 'steal@username@amount'.`,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(targetMessage));
                            
                
                        } else {
                            // فشل السرقة
                            target.points += amount; // إضافة المبلغ المسروق إلى الهدف
                            thief.points -= amount; // خصم المبلغ من السارق
                
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                            sendMainMessage(
                                parsedData.room,
                                `❌ ${thief.username} failed to steal! As a penalty, 💸 ${amount} points were given to ${target.username}.`
                            );
                
                            // إرسال رسالة خاصة للسارق (thief) عند الفشل
                            const failureMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: thief.username,  // إرسال الرسالة للسارق
                                body: `❌ You failed to steal! As a penalty, 💸 ${amount} points were given to ${target.username}.\n You can steal more points using the command: 'steal@username@amount'.`,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(failureMessage));
                
                            // إرسال رسالة خاصة للمستهدف (target) عند فشل السرقة
                            const targetMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: target.username,  // إرسال الرسالة للهدف
                                body: `🎉 You received 💸 ${amount} points as a penalty due to ${thief.username}'s failed attempt to steal! \n You can steal more points using the command: 'steal@username@amount'. `,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(targetMessage));
                        }
                    }, 5000); // تأخير 5 ثوانٍ
                }
                
                
                
                
                
                

                
                else if (body === '.protect') {
                    const user = users.find(user => user.username === parsedData.from);
                
                    // تحقق من وجود المستخدم ونقاطه
                    if (!user || user.points < 1000000000) { // التحقق من وجود بليون نقطة
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to activate theft protection. You need 1 billion points.`);
                        return;
                    }
                
                    const now = Date.now();
                    if (user.protectionUntil && user.protectionUntil > now) {
                        const remainingTime = Math.ceil((user.protectionUntil - now) / 60000); // الوقت المتبقي بالدقائق
                        sendMainMessage(parsedData.room, `🛡️ You already have theft protection active for another ${remainingTime} minutes.`);
                        return;
                    }
                
                    // خصم النقاط وتفعيل الحماية
                    user.points -= 1000000000; // خصم بليون نقطة
                    user.protectionUntil = now + 3600000; // ساعة واحدة (60 دقيقة × 60 ثانية × 1000)
                
                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                    sendMainMessage(
                        parsedData.room,
                        `✅ Theft protection activated for 1 hour! 🛡️ No one can steal from you until it expires.`
                    );
                }
                
                else if (body === '.stopwelcome') {
                    const user = users.find(user => user.username === parsedData.from);
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);
                    const rooms = roomsData.map(room => room.name);

                    // تحقق من وجود المستخدم ونقاطه
                    if (!user || user.points < 10000) { // التحقق من وجود 10000 نقطة
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to disable the welcome message. You need 10,000 points.`);
                        return;
                    }
                console.log(parsedData.room,`78787546534654`);
                
                    // البحث عن الغرفة داخل roomsData
                    const room = roomsData.find(room => room.name === parsedData.room);
                    
                    // تحقق من وجود الغرفة
                    if (!room) {
                        sendMainMessage(parsedData.room, `❌ The room ${parsedData.room} does not exist.`);
                        return;
                    }
                    
                    // خصم النقاط
                    user.points -= 10000;
                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                    
                    // إيقاف الترحيب
                    room.welcome = false;
                    
                    // كتابة التغييرات إلى الملف
                    fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                    
                    sendMainMessage(parsedData.room, `❌ Welcome messages have been disabled for the room: ${parsedData.room}.`);
                    
                    // إعادة تفعيل الترحيب بعد ساعة
                    setTimeout(() => {
                        room.welcome = true; // إعادة تفعيل الترحيب
                        fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                        sendMainMessage(parsedData.room, `✅ Welcome messages have been re-enabled for the room: ${parsedData.room}.`);
                    }, 3600000); // 3600000 ميللي ثانية (ساعة واحدة)
                }
                
                
                else if (body === '.stopbet') {
                    const user = users.find(user => user.username === parsedData.from);
                    const data = fs.readFileSync('rooms.json', 'utf8');

                    const roomsData = JSON.parse(data);
                    const rooms = roomsData.map(room => room.name);
                    // تحقق من وجود المستخدم ونقاطه
                    if (!user || user.points < 10000) { // التحقق من وجود 10000 نقطة
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to disable the bet feature. You need 10,000 points.`);
                        return;
                    }
                
                    const room = roomsData.find(room => room.name === parsedData.room);
                    
                    // تحقق من وجود الغرفة
                    if (!room) {
                        sendMainMessage(parsedData.room, `❌ The room ${parsedData.room} does not exist.`);
                        return;
                    }
                
                    // خصم النقاط
                    user.points -= 10000;
                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                    // إيقاف المراهنة
                    room.bet = false;
                
                    // كتابة التغييرات إلى الملف
                    fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                
                    sendMainMessage(parsedData.room, `❌ Bet feature has been disabled for the room: ${parsedData.room}.`);
                
                    // إعادة تفعيل المراهنة بعد ساعة
                    setTimeout(() => {
                        room.bet = true;
                        // كتابة التغييرات إلى الملف بعد إعادة التفعيل
                        fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                        
                        sendMainMessage(parsedData.room, `✅ Bet feature has been re-enabled for the room: ${parsedData.room}.`);
                    }, 3600000); // 3600000 ميللي ثانية (ساعة واحدة)
                }
                
                else if (body === '.stopgift') {
                    const user = users.find(user => user.username === parsedData.from);
                    const data = fs.readFileSync('rooms.json', 'utf8');

                    const roomsData = JSON.parse(data);
                    const rooms = roomsData.map(room => room.name);
                    // تحقق من وجود المستخدم ونقاطه
                    if (!user || user.points < 10000) { // التحقق من وجود 10000 نقطة
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to disable the gift feature. You need 10,000 points.`);
                        return;
                    }
                
                    const room = roomsData.find(room => room.name === parsedData.room);
                    
                    // تحقق من وجود الغرفة
                    if (!room) {
                        sendMainMessage(parsedData.room, `❌ The room ${parsedData.room} does not exist.`);
                        return;
                    }
                
                    // خصم النقاط
                    user.points -= 10000;
                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                    // إيقاف الهدية
                    room.gift = false;
                
                    // كتابة التغييرات إلى الملف
                    fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                
                    sendMainMessage(parsedData.room, `❌ Gift feature has been disabled for the room: ${parsedData.room}.`);
                
                    // إعادة تفعيل الهدية بعد ساعة
                    setTimeout(() => {
                        room.gift = true;
                        // كتابة التغييرات إلى الملف بعد إعادة التفعيل
                        fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                        
                        sendMainMessage(parsedData.room, `✅ Gift feature has been re-enabled for the room: ${parsedData.room}.`);
                    }, 3600000); // 3600000 ميللي ثانية (ساعة واحدة)
                }
                
                else if (body === '.shop') {
                    sendMainMessage(
                        parsedData.room,
                        `🛒 Welcome to the shop! Here are your options:
 1️⃣ Activate Theft Protection for 1 hour (Cost: 1 billion points) - Type: .protect
 2️⃣ Stop Welcome Message - Type: .stopwelcome
3️⃣ Stop Bet - Type: .stopbet
4️⃣ Stop Gift - Type: .stopgift
5️⃣ More items coming soon! 🎉`
                    );
                }
                
                else if (body.startsWith('vip@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐠𝐚𝐫˼𔘓")) {
                    const usernameToAdd = body.split('@')[1].trim();

                    let vipUsers = readVipFile();

                    // تحقق إذا كان المستخدم موجودًا بالفعل
                    if (vipUsers.some(user => user.username === usernameToAdd)) {
                        console.log(`User ${usernameToAdd} is already in VIP list.`);
                        sendVerificationMessage(parsedData.room, `User ${usernameToAdd} is already in VIP list.`);
                    } else {
                        vipUsers.push({ username: usernameToAdd });
                        console.log(`User added to VIP: ${usernameToAdd}`);
                        sendVerificationMessage(parsedData.room, `User added to VIP: ${usernameToAdd}`);
                        const roomJoinSuccessMessage = {
                            handler: 'chat_message',
                            id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                            to: usernameToAdd,
                            body: `YOU Now SUPER VIP TO SEND ANY PHOTO AS GIFT BY : \n  SEND svip@username and send any photo in room in 30seco and then .send to send image as gift . `,
                            type: 'text'
                        };
                        socket.send(JSON.stringify(roomJoinSuccessMessage));
                        writeVipFile(vipUsers);
                    }
                } else if (body.startsWith('uvip@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐠𝐚𝐫˼𔘓")) {
                    const usernameToRemove = body.split('@')[1].trim();

                    let vipUsers = readVipFile();

                    // ابحث عن المستخدم في القائمة
                    const userIndex = vipUsers.findIndex(user => user.username === usernameToRemove);

                    if (userIndex !== -1) {
                        vipUsers.splice(userIndex, 1);
                        console.log(`User removed from VIP: ${usernameToRemove}`);
                        sendVerificationMessage(parsedData.room, `User removed from VIP: ${usernameToRemove}`);
                        writeVipFile(vipUsers);
                    } else {
                        console.log(`User not found in VIP list: ${usernameToRemove}`);
                        sendVerificationMessage(parsedData.room, `User not found in VIP list: ${usernameToRemove}`);
                    }
                }

                else if (body === '.lp') {
                    // ترتيب اللاعبين بناءً على النقاط من الأكبر إلى الأصغر
                    const topPlayers = users
                        .sort((a, b) => b.points - a.points) // ترتيب تنازلي للنقاط
                        .slice(0, 10); // اختيار أكبر 10 لاعبين

                    if (topPlayers.length === 0) {
                        sendMainMessage(parsedData.room, `❌ No players available.`);
                        return;
                    }

                    // قائمة الإيموجي حسب الترتيب
                    const rankEmojis = ['🥇', '🥈', '🥉', '🎖️', '🏅', '🏆', '⭐', '✨', '🌟', '🔥'];

                    // بناء الرسالة التي تحتوي على قائمة اللاعبين مع إجبار الاتجاه من اليسار لليمين
                    let leaderboardMessage = `\u202B🏆 Top 10 Players with Most Points: 🏆\n "🎉 The winner will be announced on January 1, 2015, with one month of theft protection. \n 🎉`;

                    topPlayers.forEach((player, index) => {
                        const emoji = rankEmojis[index] || '🔹'; // اختيار الإيموجي بناءً على الترتيب
                        const formattedPoints = formatPoints(player.points); // تنسيق النقاط
                        leaderboardMessage += `${emoji} ${index + 1}. ${player.username}: ${formattedPoints} points\n`;
                    });

                    leaderboardMessage += `\u202C`; // إنهاء تنسيق اتجاه النص

                    // إرسال الرسالة إلى الغرفة
                    sendMainMessage(parsedData.room, leaderboardMessage);
                }


                else if (body.startsWith('svip@')) {
                    const sender = parsedData.from; // المرسل الحقيقي للطلب
                    const vipUsers = readVipFile(); // افترض أن هذه الدالة تقرأ قائمة VIP من ملف vip.json
                    VIPGIFTFROMUSER = sender

                    // تحقق إذا كان المستخدم في قائمة VIP
                    const isVip = vipUsers.some(user => user.username === sender);

                    if (!isVip) {
                        // إذا كان المستخدم ليس في قائمة VIP، أرسل رسالة له
                        sendMainMessage(parsedData.room, `You are not subscribed to the SuperVIP service.`);
                        return;
                    }
                    const currentTime = Date.now();

                    // التحقق من إذا قام المستخدم بإرسال طلب خلال آخر 5 دقائق
                    if (lastSvipRequestTime.has(sender)) {
                        const lastRequestTime = lastSvipRequestTime.get(sender);
                        const timeSinceLastRequest = currentTime - lastRequestTime;

                        if (timeSinceLastRequest < FIVE_MINUTES) {
                            const remainingTime = Math.ceil((FIVE_MINUTES - timeSinceLastRequest) / 1000);
                            sendMainMessage(parsedData.room, `You can only send svip@ requests every 10 minutes. Please wait ${remainingTime} seconds.`);
                            return;
                        }
                    }

                    const username = body.split('@')[1].trim();
                    VIPGIFTTOUSER = username
                    if (pendingSvipRequests.has(sender)) {
                        console.log(`Request already pending for sender: ${sender}`);
                        sendMainMessage(parsedData.room, `Request already pending for you.`);
                        return;
                    }

                    sendMainMessage(parsedData.room, `Please send the image within 30 seconds for user: ${username}`);

                    const timeoutId = setTimeout(() => {
                        if (pendingSvipRequests.has(sender)) {
                            sendMainMessage(parsedData.room, `Timeout! No image received for your request please type {.send} to send images aas gift.`);
                            pendingSvipRequests.delete(sender); // حذف الطلب بعد 30 ثانية

                        }
                    }, THIRTY_SECONDS);

                    pendingSvipRequests.set(sender, { timeoutId });
                    lastSvipRequestTime.set(sender, currentTime); // تحديث توقيت الطلب الأخير
                }

                else if (parsedData.type === 'image' && parsedData.url && parsedData.url !== '' && parsedData.from === VIPGIFTFROMUSER) {
                    const sender = Array.from(pendingSvipRequests.keys()).find(key => pendingSvipRequests.has(key));

                    if (sender) {
                        const imageUrl = parsedData.url;
                        sendMainMessage(parsedData.room, `Image received and processed for your request.`);

                        storedImages.set(sender, imageUrl);


                        const { timeoutId } = pendingSvipRequests.get(sender);
                        clearTimeout(timeoutId); // إيقاف المؤقت بعد إرسال الصورة
                        pendingSvipRequests.delete(sender); // حذف الطلب بعد إرسال الصورة
                    } else {
                    }
                }


                else if (body === '.send') {
                    const sender = parsedData.from; // المرسل الحقيقي للطلب
                    const vipUsers = readVipFile(); // افترض أن هذه الدالة تقرأ قائمة VIP من ملف vip.json

                    // تحقق إذا كان المستخدم في قائمة VIP
                    const isVip = vipUsers.some(user => user.username === sender);

                    if (!isVip) {
                        console.log(`User ${sender} is not a VIP.`);
                        sendMainMessage(parsedData.room, `You are not subscribed to the SuperVIP service.`);
                        return;
                    }

                    // تحقق من أن المرسل هو نفسه الذي أرسل طلب svip@
                    if (VIPGIFTFROMUSER !== sender) {
                        console.log(`User ${sender} is not the one who made the svip@ request.`);
                        sendMainMessage(parsedData.room, `You are not allowed to send this image. Please ensure you are the one who made the svip@ request.`);
                        return;
                    }

                    // التحقق من وقت الإرسال الأخير
                    const currentTime = Date.now();
                    if (lastSendTime.has(sender)) {
                        const lastTime = lastSendTime.get(sender);
                        const timeSinceLastSend = currentTime - lastTime;

                        if (timeSinceLastSend < SEND_COOLDOWN) {
                            const remainingTime = Math.ceil((SEND_COOLDOWN - timeSinceLastSend) / 1000);
                            sendMainMessage(parsedData.room, `You can only send this image once every 10 minutes. Please wait ${remainingTime} seconds.`);
                            return;
                        }
                    }

                    if (storedImages.has(sender)) {
                        const imageUrl = storedImages.get(sender);
                        const data = fs.readFileSync('rooms.json', 'utf8');
                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                        if (imageUrl) {
                            const roomJoinSuccessMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: VIPGIFTTOUSER,
                                body: `YOU HAVE SUPER VIP GIFT \n FROM : ${VIPGIFTFROMUSER}`,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(roomJoinSuccessMessage));

                            for (let ur of rooms) {
                                sendMainImageMessage(ur, imageUrl);
                                sendMainMessage(ur, `⚠️ ✨🇸‌🇺‌🇵‌🇪‌🇷‌🏅 🇻‌🇮‌🇵‌🏅✨ ⚠️\n 𝔽ℝ𝕆𝕄 : [${sender}] 𝕋𝕆 : [${VIPGIFTTOUSER}]`);
                            }
                        }

                        // تحديث توقيت الإرسال الأخير
                        lastSendTime.set(sender, currentTime);

                    } else {
                        sendMainMessage(parsedData.room, `No stored image found for you.`);
                    }
                }





                else if (body === '🍎' || body === '🍊' || body === '🍌' || body === '🍉' || body === '🍓' || body === '🍇' || body === '🍍' || body === '🥭' || body === '🍑' || body === '🍈') {
                    // قائمة الإيموجيات الفاكهة المسموحة
                    const fruitEmojis = ['🍎', '🍊', '🍌', '🍉', '🍓', '🍇', '🍍', '🥭', '🍑', '🍈'];

                    // تحديد اللاعب بناءً على الاسم
                    const player = users.find(u => u.username === parsedData.from);

                    // التأكد من أن اللاعب موجود في النظام
                    if (player) {
                        // التحقق من الوقت الذي أرسل فيه اللاعب آخر إيموجي
                        const currentTime = Date.now();  // الحصول على الوقت الحالي بالـ milliseconds
                        const lastTime = player.lastEmojiTime || 0;  // إذا لم يكن موجوداً تعيين القيمة إلى 0

                        const timeDifference = currentTime - lastTime;  // الفرق بين الوقت الحالي وآخر وقت أرسل فيه اللاعب الإيموجي

                        // إذا مر أكثر من دقيقة (60,000 ملي ثانية)
                        if (timeDifference >= 60000) {
                            // تحديد "الحظ" العشوائي
                            const luck = Math.random();  // يعطي قيمة عشوائية بين 0 و 1

                            // إذا كان الحظ جيدًا (مثلاً 50% حظ جيد)
                            if (luck <= 0.5) {
                                // زيادة النقاط للاعب إذا كان الحظ جيدًا
                                player.points += 10000;  // إضافة 10,000 نقطة

                                // تحديث وقت آخر إيموجي أرسله اللاعب
                                player.lastEmojiTime = currentTime;

                                // حفظ التحديثات في الملف
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                // إرسال نفس الإيموجي الذي أرسله المستخدم لأن الحظ جيد
                                sendMainMessage(parsedData.room, `🎉 ${parsedData.from} is lucky! They win 10,000 points! ${body}`);
                            } else {
                                // إرسال إيموجي مختلف إذا لم يكن الحظ جيدًا
                                const unluckyEmoji = '❌'; // الإيموجي الذي سيرد به البوت إذا لم يكن الحظ جيدًا
                                sendMainMessage(parsedData.room, `${parsedData.from} is not lucky this time. Try again! ${unluckyEmoji}`);
                            }
                        } else {
                            // إرسال رسالة للمستخدم بأنه يجب أن ينتظر حتى يمر دقيقة كاملة
                            const remainingTime = Math.ceil((60000 - timeDifference) / 1000);  // حساب الوقت المتبقي بالثواني
                            sendMainMessage(parsedData.room, `${parsedData.from}, please wait ${remainingTime} seconds before sending another emoji!`);
                        }
                    }
                }

else if (body === 'حظ') {
    const respondingUser = users.find(user => user.username === parsedData.from);

    if (!respondingUser || respondingUser.points <= 0) {
        sendMainMessage(parsedData.room, `❌ ليس لديك نقاط كافية للدوران على عجلة الحظ. نقاطك الحالية هي ${respondingUser ? respondingUser.points : 0}.`);
        return;
    }

    if (respondingUser.points < 5) {
        sendMainMessage(parsedData.room, `❌ ليس لديك نقاط كافية للدوران. تحتاج على الأقل 5 نقاط.`);
        return;
    }

    // الحصول على الوقت الحالي
    const currentTime = Date.now(); 
    const lastCommandTime = userLastLuckyTimeMap.get(respondingUser.username) || 0; // الوقت الأخير الذي استخدم فيه اللاعب اللعبة
    const interval = 2 * 60 * 1000; // 2 دقائق بالمللي ثانية

    // فحص ما إذا كان قد مر وقت أقل من دقيقتين
    if (currentTime - lastCommandTime < interval) {
        sendMainMessage(
            parsedData.room,
            `⏳ تحتاج إلى الانتظار ${Math.ceil((interval - (currentTime - lastCommandTime)) / 60000)} دقيقة(دقائق) قبل المحاولة مرة أخرى.`
        );
        return;
    }

    // تحديث الوقت الأخير للعب
    userLastLuckyTimeMap.set(respondingUser.username, currentTime);

    respondingUser.points -= 5; // خصم 5 نقاط من رصيد اللاعب
    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

    // تحديد الخيارات لعجلة الحظ مع الاحتمالات المعدلة
    const wheelOfFortune = [
        { prize: '50 نقاط', probability: 0.10 },
        { prize: '100 نقاط', probability: 0.10 },
        { prize: '200 نقاط', probability: 0.10 },
        { prize: 'خصم 10%', probability: 0.10 },
        { prize: 'خسارة 10 نقاط', probability: 0.10 },
        { prize: 'دوران مرة أخرى', probability: 0.10 },
        { prize: 'مضاعفة النقاط', probability: 0.05 },
        { prize: 'مليار نقاط (حظ هائل)', probability: 0.01 },  // الرقم الهائل (1 مليار نقاط)
        { prize: 'حظ عظيم! 1000000000 نقاط', probability: 0.01 }, // حظ عظيم
        { prize: 'حظ غريب: فزت بجزء من الكون!', probability: 0.02 },
        { prize: 'مفاجأة! فزت بسجادة طائرة!', probability: 0.02 },
        { prize: 'فزت بكأس الأبطال في لعبة الحظ!', probability: 0.02 },
        { prize: 'أنت فزت ببطاقة سفر إلى المريخ!', probability: 0.02 },
        { prize: 'فزت بحيوان أليف غير مرئي!', probability: 0.02 },
        { prize: 'مليون نقطة! فزت بنصف خزينة اللعبة!', probability: 0.01 }, // مليون نقطة
        { prize: '10 مليون نقطة! حظك اليوم قوي جداً!', probability: 0.01 }, // 10 مليون نقطة
        { prize: '50 مليون نقطة! لقد فزت بمكافأة استثنائية!', probability: 0.01 },  // 50 مليون نقطة
        { prize: '100 مليون نقطة! 🤑', probability: 0.01 },  // 100 مليون نقطة
        { prize: 'لقد فزت بـ 5 ملايين نقطة! 🎉', probability: 0.01 },  // 5 مليون نقطة
        { prize: 'فزت بـ 5% إضافية! رصيدك يزيد بنسبة 5%.', probability: 0.05 }, // 5% مكافأة إضافية
        { prize: 'فزت بـ 7% إضافية! رصيدك يزيد بنسبة 7%.', probability: 0.07 }, // 7% مكافأة إضافية
        { prize: 'فزت بـ 9% إضافية! رصيدك يزيد بنسبة 9%.', probability: 0.09 } // 9% مكافأة إضافية
    ];

    const random = Math.random(); // قيمة عشوائية بين 0 و 1
    let cumulativeProbability = 0;
    let prize = 'حظ سيء، حاول مرة أخرى!';

    // تحديد الجائزة بناءً على الاحتمالات
    for (let segment of wheelOfFortune) {
        cumulativeProbability += segment.probability;
        if (random < cumulativeProbability) {
            prize = segment.prize;
            break;
        }
    }

    let resultMessage = '';

    // التعامل مع النتائج
    if (prize === 'دوران مرة أخرى') {
        resultMessage = `🎉 حظك سعيد! يمكنك الدوران مرة أخرى.`;
    } else if (prize === 'مضاعفة النقاط') {
        respondingUser.points *= 2;
        resultMessage = `🎉 مبروك! تم مضاعفة نقاطك! رصيدك الجديد هو ${respondingUser.points} نقاط.`;
    } else if (prize === 'خصم 10%') {
        resultMessage = `🎉 لقد حصلت على خصم 10% في المرة القادمة!`;
    } else if (prize === 'خسارة 10 نقاط') {
        respondingUser.points -= 10;
        resultMessage = `💔 لقد خسرت 10 نقاط. رصيدك الجديد هو ${respondingUser.points}.`;
    } else if (prize === 'مليار نقاط (حظ هائل)') {
        respondingUser.points += 1000000000; // إضافة مليار نقطة
        resultMessage = `🎉 حظ هائل! فزت بمليار نقطة! رصيدك الجديد هو ${respondingUser.points}.`;
    } else if (prize === 'حظ عظيم! 1000000000 نقاط') {
        respondingUser.points += 1000000000; // إضافة مليار نقطة
        resultMessage = `🎉 حظ عظيم! فزت بمليون نقطة! رصيدك الجديد هو ${respondingUser.points}.`;
    } else if (prize === 'حظ غريب: فزت بجزء من الكون!') {
        resultMessage = `🌌 حظ غريب! فزت بجزء من الكون! مبارك لك!`;
    } else if (prize === 'مفاجأة! فزت بسجادة طائرة!') {
        resultMessage = `🪄 مفاجأة! فزت بسجادة طائرة! الطيران متاح الآن!`;
    } else if (prize === 'فزت بكأس الأبطال في لعبة الحظ!') {
        resultMessage = `🏆 فزت بكأس الأبطال في لعبة الحظ! تهانينا!`;
    } else if (prize === 'أنت فزت ببطاقة سفر إلى المريخ!') {
        resultMessage = `🚀 أنت فزت ببطاقة سفر إلى المريخ! استمتع برحلتك الفضائية!`;
    } else if (prize === 'فزت بحيوان أليف غير مرئي!') {
        resultMessage = `🐾 فزت بحيوان أليف غير مرئي! حافظ عليه جيدًا!`;
    } else if (prize === 'مليون نقطة! فزت بنصف خزينة اللعبة!') {
        respondingUser.points += 1000000; // إضافة مليون نقطة
        resultMessage = `🎉 فزت بمليون نقطة! رصيدك الجديد هو ${respondingUser.points}.`;
    } else if (prize === '10 مليون نقطة! حظك اليوم قوي جداً!') {
        respondingUser.points += 10000000; // إضافة 10 مليون نقطة
        resultMessage = `🎉 فزت بعشرة مليون نقطة! رصيدك الجديد هو ${respondingUser.points}.`;
    } else if (prize === '50 مليون نقطة! لقد فزت بمكافأة استثنائية!') {
        respondingUser.points += 50000000; // إضافة 50 مليون نقطة
        resultMessage = `🎉 فزت بخمسين مليون نقطة! رصيدك الجديد هو ${respondingUser.points}.`;
    } else if (prize === '100 مليون نقطة! 🤑') {
        respondingUser.points += 100000000; // إضافة 100 مليون نقطة
        resultMessage = `🎉 فزت بمئة مليون نقطة! رصيدك الجديد هو ${respondingUser.points}.`;
    } else if (prize === 'لقد فزت بـ 5 ملايين نقطة! 🎉') {
        respondingUser.points += 5000000; // إضافة 5 مليون نقطة
        resultMessage = `🎉 فزت بخمسة مليون نقطة! رصيدك الجديد هو ${respondingUser.points}.`;
    } else {
        resultMessage = `🎉 لقد فزت بجائزة ${prize}!`;
    }

    // تحديث البيانات في الملف
    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

    // إرسال النتيجة
    sendMainMessage(parsedData.room, resultMessage);
}


// Check if body matches any of the forbidden words
else if (forbiddenWords.includes(body)) {
    addMessage(parsedData.to, body, parsedData.from, parsedData.room);
}


                else if (body === 'lucky') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        return; // Game is not allowed for unverified users
                    }
                
                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {
                        const currentTime = Date.now();
                        const lastCommandTime = respondingUser.lastLuckyTime || 0;
                        const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
                
                        if (currentTime - lastCommandTime < interval) {
                            sendMainMessage(
                                parsedData.room,
                                `⏳ You need to wait ${Math.ceil((interval - (currentTime - lastCommandTime)) / 60000)} more minute(s) before trying again.`
                            );
                            return;
                        }
                
                        // Update the last command time
                        respondingUser.lastLuckyTime = currentTime;
                
                        // Check if the user is the "always lucky" user
                        const alwaysLuckyUser = "𝓜𝓪𝓻𝓼𝓱𝓶𝓪𝓵𝓵𝓸𝔀♡🦋"; // اسم المستخدم المحظوظ دائمًا
                        if (respondingUser.username === alwaysLuckyUser) {
                            const gainedPoints = respondingUser.points * 1;
                            respondingUser.points += gainedPoints;
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                            sendMainMessage(
                                parsedData.room,
                                `🎉 Lucky you! You won ${formatPoints(gainedPoints)} points! Your new balance: ${formatPoints(respondingUser.points)}.`
                            );
                            return;
                        }
                
                        // Determine the luck outcome for regular users
                        const goodLuck = Math.random() < 0.6; // 40% chance of good luck
                        if (goodLuck) {
                            const gainedPoints = respondingUser.points * 1;
                            respondingUser.points += gainedPoints;
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                            sendMainMessage(
                                parsedData.room,
                                `🎉 Lucky you! You won ${formatPoints(gainedPoints)} points! Your new balance: ${formatPoints(respondingUser.points)}.`
                            );
                        } else {
                            const lostPoints = Math.floor(respondingUser.points * 0.5);
                            respondingUser.points -= lostPoints;
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                            sendMainMessage(
                                parsedData.room,
                                `😢 Unlucky! You lost ${formatPoints(lostPoints)} points. Your new balance: ${formatPoints(respondingUser.points)}.`
                            );
                        }
                    }
                }
                

                else if (body === 'anvest' || body === 'استثمار') {
                    const player = users.find(user => user.username === parsedData.from);
                
                    // تحديد اللغة بناءً على المدخل
                    const isEnglish = body === 'anvest';
                
                    // التحقق من وجود اللاعب ونقاطه
                    if (!player || player.points <= 0) {
                        const message = isEnglish
                            ? `❌ You don't have enough points to invest. Your current points are ${player ? player.points : 0}.`
                            : `❌ ليس لديك نقاط كافية للاستثمار. نقاطك الحالية هي ${player ? player.points : 0}.`;
                        sendMainMessage(parsedData.room, message);
                        return;
                    }
                
                    // التحقق من وقت التبريد (cooldown)
                    const now = Date.now();
                    const lastInvestmentTime = investmentCooldownMap.get(parsedData.from) || 0;
                    const cooldownPeriod = 10 * 60 * 1000; // 10 دقائق بالمللي ثانية
                    if (now - lastInvestmentTime < cooldownPeriod) {
                        const remainingTime = Math.ceil((cooldownPeriod - (now - lastInvestmentTime)) / 1000); // الوقت المتبقي بالثواني
                        const message = isEnglish
                            ? `❌ You can only invest once every 10 minutes. Please wait ${remainingTime} seconds.`
                            : `❌ يمكنك الاستثمار مرة واحدة كل 10 دقائق. الرجاء الانتظار ${remainingTime} ثانية.`;
                        sendMainMessage(parsedData.room, message);
                        return;
                    }
                
                    // تحديث وقت الاستثمار في الخريطة
                    investmentCooldownMap.set(parsedData.from, now);
                
                    // دائمًا ربح - زيادة النقاط بنسبة مئوية (من 0% إلى 10%)
                    const gainPercentage = Math.random() * 10; // ربح بنسبة بين 0% و 10%
                    const pointsGained = Math.ceil(player.points * (gainPercentage / 100));
                    player.points += pointsGained;
                
                    const resultMessage = isEnglish
                        ? `🎉 You gained ${pointsGained} points (a ${gainPercentage.toFixed(2)}% gain). Your new balance is ${player.points}.`
                        : `🎉 ربحت ${pointsGained} نقطة (زيادة بنسبة ${gainPercentage.toFixed(2)}%). رصيدك الجديد هو ${player.points}.`;
                
                    // تحديث النقاط في الملف
                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                
                    // إرسال الرسالة للمستخدم
                    sendMainMessage(parsedData.room, resultMessage);
                }
                



                else if (body.startsWith('قول ')) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when the user is unverified
                        return;
                    }

                    // مصفوفة إيموجيات الفاكهة
                    const fruitEmojis = ['🍎', '🍌', '🍊', '🍉', '🍓', '🍍', '🍇', '🍑', '🍒', '🍍'];

                    // اختيار إيموجي فاكهة عشوائي
                    const randomFruitEmoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];

                    // استخراج النص بالكامل بعد "say"
                    const textAfterSay = body.slice(4).trim(); // بعد "say " يتم استخدام slice لاستخراج النص بالكامل

                    if (textAfterSay) {
                        // إرسال النص مع إيموجي الفاكهة العشوائي
                        sendMainMessage(parsedData.room, `${textAfterSay} ${randomFruitEmoji}`);
                    } else {
                        sendMainMessage(parsedData.room, "No text provided after 'say'");
                    }
                }
                else if (body.startsWith('say ')) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when the user is unverified
                        return;
                    }

                    // مصفوفة إيموجيات الفاكهة
                    const fruitEmojis = ['🍎', '🍌', '🍊', '🍉', '🍓', '🍍', '🍇', '🍑', '🍒', '🍍'];

                    // اختيار إيموجي فاكهة عشوائي
                    const randomFruitEmoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];

                    // استخراج النص بالكامل بعد "say"
                    const textAfterSay = body.slice(4).trim(); // بعد "say " يتم استخدام slice لاستخراج النص بالكامل

                    if (textAfterSay) {
                        // إرسال النص مع إيموجي الفاكهة العشوائي
                        sendMainMessage(parsedData.room, `${textAfterSay} ${randomFruitEmoji}`);
                    } else {
                        sendMainMessage(parsedData.room, "No text provided after 'say'");
                    }
                } else if (body.startsWith('name@')) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }

                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {
                        // استخراج الكلمة بعد name@
                        const newName = body.split('name@')[1]?.trim(); // الحصول على النص بعد name@
                        if (newName) {
                            if (newName.length > 50) {
                                // إذا تجاوز الاسم 50 حرفًا، أرسل رسالة تحذيرية
                                sendMainMessage(parsedData.room, "Error: The name must not exceed 50 characters.");
                                return;
                            }
                            respondingUser.name = newName; // تحديث قيمة "name"
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                            sendMainMessage(parsedData.room, `User ${respondingUser.username} now has name: ${respondingUser.name}`);
                        }
                    }
                }
                else if (body.startsWith('nickname@')) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }

                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {
                        // استخراج الكلمة بعد name@
                        const newName = body.split('nickname@')[1]?.trim(); // الحصول على النص بعد name@
                        if (newName) {
                            if (newName.length > 50) {
                                // إذا تجاوز الاسم 50 حرفًا، أرسل رسالة تحذيرية
                                sendMainMessage(parsedData.room, "Error: The name must not exceed 50 characters.");
                                return;
                            }
                            respondingUser.nickname = newName; // تحديث قيمة "name"
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                            sendMainMessage(parsedData.room, `User ${respondingUser.username} now has nickname: ${respondingUser.nickname}`);
                        }
                    }
                }
                else if (body.startsWith('+tp@')) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }

                    const parts = body.split('@');
                    if (parts.length !== 3) {
                        sendMainMessage(parsedData.room, "Error: Invalid format. Use +tp@username@points.");
                        return;
                    }

                    const targetUsername = parts[1]?.trim();
                    const pointsToTransfer = parseInt(parts[2]?.trim(), 10);

                    if (!targetUsername || isNaN(pointsToTransfer) || pointsToTransfer <= 0) {
                        sendMainMessage(parsedData.room, "Error: Invalid username or points. Points must be a positive number.");
                        return;
                    }

                    let sender = users.find(user => user.username === parsedData.from);
                    let receiver = users.find(user => user.username === targetUsername);

                    if (!sender) {
                        sendMainMessage(parsedData.room, "Error: Sender not found.");
                        return;
                    }

                    if (!receiver) {
                        sendMainMessage(parsedData.room, `Error: User "${targetUsername}" not found.`);
                        return;
                    }

                    if (sender.points === null || sender.points < pointsToTransfer) {
                        sendMainMessage(parsedData.room, "Error: Insufficient points.");
                        return;
                    }

                    // Perform the transaction
                    sender.points -= pointsToTransfer;
                    receiver.points = (receiver.points || 0) + pointsToTransfer;

                    // Save the updated data
                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                    // Notify both users
                    sendMainMessage(parsedData.room, `Transaction successful! ${sender.username} transferred ${pointsToTransfer} points to ${receiver.username}.`);
                }

                else if (body && body !== ".lg" && !body.startsWith('agi@') && body !== "help" && body !== ".lg@" && body !== ".lg@4" && body !== ".lg@2" && body !== ".lg@3" && body !== ".resetpoint" && body !== ".list" && body !== ".lg@1" && body !== "فزوره" && !body.startsWith('help@1') && body !== "+tp@") {
                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {



                        if (users && Array.isArray(users)) {
                            for (let i = 0; i < users.length; i++) {
                                if (body === users[i].name) {
                                    // إرسال اسم الشهرة الخاص بالمستخدم
                                    sendMainMessage(parsedData.room, ` ${users[i].nickname}`);
                                    return; // إنهاء العملية بمجرد العثور على المستخدم
                                }
                            }
                        }
                    }
                }







                else if (body === '.lg') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }

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
to next .lg@1

`);


                }
                else if (body === '.lg@1') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }



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
to next .lg@2

`);



                }
                else if (body === '.lg@2') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }


                    sendMainMessage(parsedData.room, ` 
㉑ 🐰 𝑩𝒖𝒈𝒔 𝑩𝒖𝒏𝒏𝒚
㉒ 🍍 𝑺𝒑𝑜𝒏𝒈𝑩𝒐𝒃
㉓ 🌟 𝑫𝒐𝒓𝒂 𝒕𝒉𝒆 𝑬𝒙𝒑𝒍𝒐𝒓𝒆𝒓
㉔ 🦸‍♂️ 𝑺𝒖𝒑𝒆𝒓𝒎𝒂𝒏
㉕ ❄️ 𝑭𝒓𝒐𝒛𝒆𝒏
㉖ 🌊 𝑴𝒐𝒂𝒏𝒂
㉗ 🚗 𝑪𝒂𝒓
28 🐈 Tom
29 🐈 Mike
30 🐈 Boo
31 🐈 Shalby

Ex : agi@NumberGift@username@message
to next .lg@3
`);
                }
                else if (body === '.lg@3') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }



                    sendMainMessage(parsedData.room, `
    32 butterflies
    33 Strawberry
    34 Snafer
    35 ariel
    36 repunzel
    37 joker
    38 killing u if found u
    39 girl shoting
    40 army man
    Ex : agi@NumberGift@username@message
    to next .lg@4
    `);

                }
                else if (body === '.lg@4') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }



                    sendMainMessage(parsedData.room, `
    41 venom
    42 Ninja
    43 she look like
    44 he look like
    45 neon cute
    46 Mems Arabic 
  
    Ex : agi@NumberGift@username@message
    
    `);

                }
                else if (body.startsWith('agi@')) {
        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                if (isUnverified) {
                    // Additional actions if needed when user is unverified
                    return;
                }
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
                    const atCount = (body.match(/@/g) || []).length; // عد عدد الرموز @ في النص

                    // التحقق إذا كان يوجد أكثر من 2 @
                    if (atCount === 2) {
                        const username = body.split('@')[2].trim();
                        const isUnverified = handleUnverifiedUser2(socket, users, username,parsedData.room);
                        if (isUnverified) {
                            return; // Game is not allowed for unverified users
                        }
                        const id = Number(body.split('@')[1].trim());
                        if (Number.isInteger(id)) {

                        } else {
                            const gameActiveMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `❌ Alert: bad gift vaule".`
                            };

                            socket.send(JSON.stringify(gameActiveMessage));
                            return;

                        }


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
                            console.log(imageType3);

                            if (imageType3 === 'shawarma') {
                                const imageUrl = getRandomImage(imageType3);
                                if (imageUrl) {

                                    sendMainImageMessage(parsedData.room, imageUrl);
                                    sendMainMessage(parsedData.room, `🎉 𝗙𝗥𝗢𝗠 : [${parsedData.from}] 💬\n➡️ 𝗧𝗢 : [${username}] 📩\n🌟  ᵂᴱ ᴴᴼᴾᴱ ʸᴼᵁ ᴴᴬⱽᴱ ᴬ ᴳᴿᴱᴬᵀ ᴱˣᴾᴱᴿᴵᴱᴺᶜᴱ55 🎉`);
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
                            const isUnverified = handleUnverifiedUser2(socket, users, username,parsedData.room);
                            if (isUnverified) {
                                return; // Game is not allowed for unverified users
                            }

                if (isUnverified) {
                    // Additional actions if needed when user is unverified
                    return;
                }
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

                            const msg = body.split('@')[3].trim();
                            const id = Number(body.split('@')[1].trim());
                            if (Number.isInteger(id)) {

                            } else {
                                const gameActiveMessage = {
                                    handler: 'room_message',
                                    id: 'TclBVHgBzPGTMRTNpgWV',
                                    type: 'text',
                                    room: parsedData.room,
                                    url: '',
                                    length: '',
                                    body: `❌ Alert: bad gift vaule".`
                                };

                                socket.send(JSON.stringify(gameActiveMessage));
                                return;

                            }
                            if (msg.length > 50) {
                                sendMainMessage(parsedData.room, ` Message max length 50 characters`);

                                return;
                            }
                            if (username.length > 100) {
                                sendMainMessage(parsedData.room, ` username max length 100 characters`);

                                return;
                            }
                            if (id > 200) {
                                sendMainMessage(parsedData.room, ` Gift Id max 200`);

                                return;
                            }
                            if (body && parsedData.room && id === 1 && msg) {
                                imageType = 'eggs';
                                if (imageType === 'eggs' && msg) {
                                    const imageUrl = getRandomImage(imageType);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);
                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);
                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    } else {
                                        console.error('No images found for the specified type.');
                                    }
                                }


                            } else if (id === 4) {
                                imageType4 = 'pizza';

                                if (imageType4 === 'pizza') {
                                    const imageUrl = getRandomImage(imageType4);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);


                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
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
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 228) {
                                imageType5 = 'Fuck';
                                if (imageType5 === 'Fuck') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 28) {
                                imageType5 = 'Tom';
                                if (imageType5 === 'Tom') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 29) {
                                imageType5 = 'Mike';
                                if (imageType5 === 'Mike') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 30) {
                                imageType5 = 'Boo';
                                if (imageType5 === 'Boo') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 31) {
                                imageType5 = 'Shalby';
                                if (imageType5 === 'Shalby') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 32) {
                                imageType5 = 'butterflies';
                                if (imageType5 === 'butterflies') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 33) {
                                imageType5 = 'Strawberry';
                                if (imageType5 === 'Strawberry') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 34) {
                                imageType5 = 'Snafer';
                                if (imageType5 === 'Snafer') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 35) {
                                imageType5 = 'ariel';
                                if (imageType5 === 'ariel') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 36) {
                                imageType5 = 'repunzel';
                                if (imageType5 === 'repunzel') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 37) {
                                imageType5 = 'Joker';
                                if (imageType5 === 'Joker') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 38) {
                                imageType5 = 'kill';
                                if (imageType5 === 'kill') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 39) {
                                imageType5 = 'girl shoting';
                                if (imageType5 === 'girl shoting') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        console.log('Rooms loaded:', rooms); // تحقق من أن جميع الغرف تم تحميلها

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 40) {
                                imageType5 = 'man shoting';
                                if (imageType5 === 'man shoting') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            }
                            else if (id === 41) {
                                imageType5 = 'venom';
                                if (imageType5 === 'venom') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            }
                            else if (id === 42) {
                                imageType5 = 'Ninja';
                                if (imageType5 === 'Ninja') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            }
                            else if (id === 43) {
                                imageType5 = 'she look like';
                                if (imageType5 === 'she look like') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            }
                            else if (id === 44) {
                                imageType5 = 'he look like';
                                if (imageType5 === 'he look like') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            } else if (id === 45) {
                                imageType5 = 'neon cute';
                                if (imageType5 === 'neon cute') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            }
                            else if (id === 46) {
                                imageType5 = 'MEMS';
                                if (imageType5 === 'MEMS') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                                        for (let ur of rooms) {
                                            const message = canSendGift(parsedData.from);
                                            if (message === true) {
                                                const currentTime = new Date();
                                                const localTime = moment(currentTime).local().format('YYYY-MM-DD HH:mm:ss');
                                                sendMainImageMessage(ur, imageUrl);
                                                sendMainMessage(ur, `🎉 ＧＩＦＴ 🎉\nᶠʳᵒᵐ : [${parsedData.from}]\nᵗᵒ : [${username}]\nᵐᵉˢˢᵃᵍᵉ : ${msg} 🎉`);

                                                setTimeout(() => {
                                                    updateLastTimeGift(parsedData.from, localTime);

                                                }, 1000);
                                            } else {
                                                sendMainMessage(ur, message);
                                            }
                                        }
                                    }
                                    else {
                                        console.error('No images found for the specified type.');
                                    }
                                }

                            }

                        }

                    }

                } else if (body === 'help') {

                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {

                        sendMainMessage(parsedData.room, `1. List of Gifts:
  Command: .lg
   Action: Display the list of gifts.
2. Play Puzzle (Arabic):
  Command: فزوره
  Action: Play the puzzle game.
3. Play Treasure Hunt (Arabic):
   Command: كنز
   Action: Play the treasure hunt game.
4. For Your Points:
  Command: .po
  Action: Display your points.
5. For say:
  Ex: say i love u
  Action: repeat your words.
  6. For قول:
  Ex: قول i love u
  Action: repeat your words.
   For next help@1
`);

                    }


                }
                else if (body === 'help@1') {

                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {

                        sendMainMessage(parsedData.room, `1.playing bet:
  Command: bet@amount
   Action: Display to play bet.
2. Play Speculation:
  Command: spec
  Action: Play the Speculation game.
3. name replay:
   Command: name@username
   Action: set name action.
4. nickname replay:
  Command: nickname@superman
  Action: Display your nickname.
  5. transfaer  points:
  Command: +tp@username@amoun
  Action: transfaer  your point to friends.

`);

                    }


                }
            }
            if (parsedData.handler === 'room_event') {
                const body = parsedData.body || '';

                // Check if the user is in the master bot file
                if (!isUserInMasterBot(parsedData.from)) {
                    return; // Exit if the user is not in the master bot file
                }

                if (body.startsWith('msg@')) {
                    const parts = body.split('@');

                    // Verify the message contains the required part
                    if (parts.length > 1) {
                        const message = parts[1].trim(); // Extract the message content

                        if (message.length > 3000) {
                            console.log('Error: Message exceeds 100 characters.');

                            // Send error message to the user
                            const errorMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: 'egypt',
                                url: '',
                                length: '',
                                body: '⚠️ The message you sent exceeds 100 characters. Please shorten it and try again.',
                            };
                            socket.send(JSON.stringify(errorMessage));
                        } else {
                            // console.log('Received message:', message);

                            const data = fs.readFileSync('rooms.json', 'utf8');
                            const roomsData = JSON.parse(data);
        const rooms = roomsData.map(room => room.name);

                            for (let ur of rooms) {

                                // Send the message to each room
                                sendMainMessage(ur, message);
                            }
                        }
                    } else {

                        // Send an error message for invalid format
                        const invalidMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            to: parsedData?.room,
                            url: '',
                            length: '',
                            body: '⚠️ Invalid message format. Please use the correct format: msg@your_message.',
                        };
                        socket.send(JSON.stringify(invalidMessage));
                    }
                }
            }


        };



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
    };

    const sendUserProfileRequest = ( username) => {
        const profileRequestMessage = {
            handler: 'profile_other',
            id: 'ztPMLHZkxwfqDJdJeCvX', // يمكنك إنشاء ID مميز هنا
            type: username, // اسم المستخدم كنوع
           
        };
        socket.send(JSON.stringify(profileRequestMessage));
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
    };




};

module.exports = ws_Rooms