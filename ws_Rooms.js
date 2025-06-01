const fs = require('fs');
const path = require('path');
const { getRandomInstruction } = require('./getRandomText');
const getRandomItemDress = require('./dress'); // استيراد دالة اختيار الفستان العشوائي
const createCanvasWithBackground = require('./createImage');
const { addMessage } = require('./report.js');
const { readCricketGameData, writeCricketGameData, deleteCricketGameData, writeCricketGameDataTime } = require('./cricket_game.js');
const giftPrices = require('./gifts.js');
const { handlePlayCommand, handleSongFeedback ,promoteUserToTop} = require('./handlePlayCommand');
const BigNumber = require('bignumber.js');


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
    addUser,
    deleteUserFromFile,
    startSendingSpecMessage,
    deleteRoomName,
    saveRoom,
    getRandomImageShot,
    readLoginDatatebot,
    getRandomEmoji,
    isUserInMasterBot,
    writeImageToFile,
    readLoginDataRooms,
    deleteComicImageById,
    removeUserFromMasterBot,
    addBlockedUser,
    getPuzzles,
    addComicImage,
    loadPuzzles,
    writeBlockedUsers,
    readGameData,
    canSendGift,
    addUserToMasterBot,
    writeUsersToFile,
    removeLastTimeGift,
    formatPoints,
    generateUnits,
    loadImagesData,
    readVipFile,
    writeVipFile,
    readBlockedUsers,
    deleteBlockedUser,
    saveGameData,
    users,
    getRandomQuestion,
    getRandomNumber,
    getRandomComicImage,
    getRandomHikma,
    getRandomImage,
    readVipSearchFile,
} = require('./functions');
const reconnectInterval = 5000; // 5 seconds
const maxReconnectAttempts = 5; // Maximum attempts to reconnect

let reconnectAttempts = 0;


const ws_Rooms = async ({ username, password, roomName }) => {
    const createSocketConnection = () => {

        const socket = new WebSocket('wss://chatp.net:5333/server');


        const cricketGameTimeouts = new Map();
        const shotMap = new Map();  // الخريطة لتخزين الوقت الذي أرسل فيه المستخدم الأمر

        let players = new Map();  // تخزين اللاعبين
        let playerNumbers = new Map();  // تخزين الأرقام التي يرسلها اللاعبون
        let playerSequences = new Map(); // حفظ تسلسل الأرقام لكل لاعب
        let turn = 1;  // تحديد الدور (1 للاعب الأول، 2 للاعب الثاني)
        const validNumbers = Array.from({ length: 16 }, (_, i) => i + 1);  // الأرقام من 1 إلى 16
        let timeout;  // متغير لتخزين timeout
        const timeoutDuration = 30000; // 30 ثانية
        let selectedNumbers = [];  // لتخزين الأرقام المرسلة
        const transferCooldown = new Map(); // تتبع وقت التحويل لكل مستخدم
        const MAX_TRANSFER_LIMIT = 1_000_000_000; // الحد الأقصى للتحويل
        const COOLDOWN_TIME = 5 * 60 * 1000; // 5 دقائق بالمللي ثانية
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
        const activeUsersComic = new Map();
        const bombSessions = {}; // لتخزين جلسات القنابل النشطة

        const storedImages = new Map(); // لتخزين الصور المرسلة لكل مستخدم
        const lastSvipRequestTime = new Map(); // لتتبع توقيت آخر طلب لكل مستخدم
        const THIRTY_SECONDS = 30 * 1000; // 30 ثانية بالمللي ثانية
        const lastSendTime = new Map(); // لتتبع توقيت الإرسال الأخير لكل مستخدم
        const SEND_COOLDOWN = 10 * 60 * 1000; // فترة التهدئة: 10 دقائق
        let pikachuAlive = true; // حالة بيكاتشو (حي عند البداية)
        const betResults = new Map(); // تتبع نتائج الأرقام (صعود أو هبوط)
        const COOLDOWN_TIME_bet = 5 * 60 * 1000; // فترة تبريد 5 دقائق
        const betCooldown = new Map(); // تتبع وقت آخر رهان لكل مستخدم
        let currentRequester = null;
        let currentRoomName = null;
        let currentUsersList = [];
        let currentIndex = 0;
        const imageRequestUsers = new Set();
        let legendaryMonsterAlive = false;
        let currentLegendaryMonster = null;
        let timeoutHandle = null;
        let VIPGIFTTOUSER = null
        let VIPGIFTFROMUSER = null
        const FIVE_MINUTES = 10 * 60 * 1000; // بالمللي ثانية
        let emojiTimer;
        let currentEmoji = null;
        const explosionCost = 1000000; // تكلفة التفجير مليون نقطة
        const vipUsers = ['admin1', 'supermod', 'boss123']; // قائمة VIP
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

        const challengeData = [
            { "emojis": "🎩🐰✨", "answer": "الساحر أوز" },
            { "emojis": "🦁👑", "answer": "الأسد الملك" },
            { "emojis": "🚢🧊❤️", "answer": "تايتانيك" },
            { "emojis": "📸👻", "answer": "سناب شات" },
            { "emojis": "🍕🐢", "answer": "نينجا تيرتلز" }
        ];

        const activeChallenges = {}; // لتخزين التحديات الحالية
        let gameTimer; // المؤقت
        let choiceTimeout; // متغير للوقت المحدد لإنهاء اللعبة
        let isGameActive = false; // حالة اللعبة لتحديد ما إذا كانت هناك لعبة جارية أم لا
        let userChoiceTimeout; // مؤقت لرسالة تحفيزية
        let canChoosePath = false; // لمنع اللاعب من اختيار الطريق قبل كلمة "ابدأ"
        let puzzleTimeout;
        let tweetIndex = 0; // لتتبع التغريدة الحالية
        let lastTweetId = null; // معرف التغريدة الأخيرة المرسلة
        const tweets = loadTweets(); // تحميل التغريدات من ملف JSON
        const protectedUsers = ['𝓜𝓪𝓻𝓼𝓱𝓶𝓪𝓵𝓵𝓸𝔀♡🦋', 'vipUser1', 'vipUser2'];  // أضف أسماء المستخدمين المحميين هنا
        let roundTimeout;
        const explosionRequests = {}; // طلبات انتظار الأسماء
        const explosionCooldowns = {}; // حفظ توقيت آخر تفجير لكل مستخدم
        const explosionLanguages = {}; // تحديد لغة التفجير لكل مستخدم
        function showLastUsers(socket, roomName, startIndex, count, parsedData) {
            const data = fs.readFileSync('rooms.json', 'utf8');
            const roomsData = JSON.parse(data);
            const room = roomsData.find(room => room.name === roomName);

            if (room && room.recentUsers) {
                // ترتيب المستخدمين بالأحدث أولاً بناءً على تاريخ الانضمام
                const sortedUsers = room.recentUsers.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

                // التأكد من وجود مستخدمين لعرضهم
                const usersToShow = sortedUsers.slice(startIndex, startIndex + count);

                if (usersToShow.length === 0) {
                    sendMainMessage(parsedData.room, '❌ No more users to display.');
                    return;
                }

                let message = "👥 Last users who joined (Times are in London Time):\n";
                usersToShow.forEach((user, index) => {
                    // تنسيق التاريخ والوقت
                    const formattedDate = formatDate(user.joinedAt);
                    message += `${startIndex + index + 1}. ${user.username} (Joined at ${formattedDate})\n\n`; // Added a blank line between users
                });

                sendMainMessage(parsedData.room, message);

                // حفظ الصفحة الحالية
                currentPage[roomName] = startIndex + count;
            } else {
                sendMainMessage(parsedData.room, '❌ No user data available for this room.');
            }
        }







        // دالة لتنسيق التاريخ والوقت بشكل أفضل باللغة العربية
        function formatDate(dateString) {
            const date = new Date(dateString);

            // Check if the date is valid
            if (isNaN(date)) {
                console.error('Invalid date:', dateString);
                return 'Invalid date'; // You can customize the message if needed
            }

            const options = {
                weekday: 'long', // Day of the week
                year: 'numeric', // Year
                month: 'long', // Month
                day: 'numeric', // Day
                hour: '2-digit', // Hour
                minute: '2-digit', // Minute
                second: '2-digit', // Second
                hour12: true // 12-hour time format
            };

            // Use local time format (defaults to the user's locale, which should be English in most cases)
            const formatter = new Intl.DateTimeFormat('en-US', options); // Formatting in English (US)
            return formatter.format(date);
        }



        let currentPage = {};  // حفظ الصفحة الحالية لكل غرفة

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
            }, 1800000);
            const emojisPIK = ['⚡', '🐭', '✨', '🔥', '🌟']; // قائمة بالإيموجي

            const legendaryMonsters = [
                { name: "Dragon", emoji: "🐉", points: 10000000000000000000000000 },
                { name: "Phoenix", emoji: "🔥", points: 10000000000000000000000000 },
                { name: "Griffin", emoji: "🦅", points: 10000000000000000000000000 },
                { name: "Unicorn", emoji: "🦄", points: 10000000000000000000000000 },
                { name: "Hydra", emoji: "🐍", points: 10000000000000000000000000 }
            ];



            // إرسال رسالة كل دقيقة عن الوحش الأسطوري
            const legendaryMonsterTimer = setInterval(() => {
                // اختيار وحش أسطوري عشوائي
                currentLegendaryMonster = legendaryMonsters[Math.floor(Math.random() * legendaryMonsters.length)];
                legendaryMonsterAlive = true;

                // إرسال الرسالة لكل الغرف
                for (let ur of rooms) {
                    const message = {
                        handler: 'room_message',
                        id: 'TclBVHgBzPGTMRTNpgWV',
                        type: 'text',
                        room: ur, // إرسال إلى الغرفة الحالية
                        url: '',
                        length: '',
                        body: `${currentLegendaryMonster.name} is back ${currentLegendaryMonster.emoji}! Send "catch" or "كاتش" to earn ${currentLegendaryMonster.points} points!`,
                    };

                    socket.send(JSON.stringify(message));
                }
            }, 1800000); // يكرر الإرسال كل نصف ساعة (1800000 مللي ثانية)

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
            }, 720000); 


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
                    console.log(room, "cricketGameData[room]");

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
                    body: `❌ Alert: There is a new request from an unverified user in room ${parsedData.room}. Please verify by msg to "i_gamd_i".`
                };

                socket.send(JSON.stringify(gameActiveMessage));
                return true; // Return true to indicate the user is unverified
            }

            return false; // Return false to indicate the user is verified
        }

        socket.onmessage = async (event) => {
            const parsedEvent = event;

            const parsedData = JSON.parse(event.data);

            const usersblockes = readBlockedUsers();
            // if (parsedData.from === `hos`) {
            //     // console.log(parsedData);
            //     return;

            // }
            if (parsedData.type === "you_joined") {
                const usersList = parsedData.users || [];
                const roomName = parsedData.name;
            
            
                try {
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);
            
                    const roomIndex = roomsData.findIndex(room => room.name === roomName);
                    if (roomIndex !== -1) {
                        const room = roomsData[roomIndex];
            
                        // حذف كامل لقائمة المستخدمين القديمة
                        room.users = [];
            
                        // تصفية المستخدمين الصالحين فقط
                        const validUsers = usersList.filter(user => {
                            if (!user || typeof user !== 'object' || !user.username) {
                                console.warn('⚠️ تم تجاهل مستخدم ببيانات غير صالحة:', user);
                                return false;
                            }
                            return true;
                        });
            
                        // إضافة المستخدمين الجدد بعد التصفية
                        room.users = validUsers.map(user => ({
                            username: user.username,
                            role: user.role || 'member',
                            joinedAt: new Date().toISOString(),
                            totalTime: 0
                        }));
            
                        // حفظ التحديث
                        roomsData[roomIndex] = room;
                        fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
            
                    } else {
                        console.error(`❌ الغرفة ${roomName} غير موجودة في rooms.json`);
                    }
                } catch (err) {
                    console.error(`❌ خطأ أثناء التحديث:`, err);
                }
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
                    if (parsedData.body === 'كوميكس' || parsedData.body === 'comic') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        const userId = parsedData.from;

                        if (activeUsersComic.has(userId)) {
                            const lastRequestTime = activeUsersComic.get(userId);
                            const currentTime = Date.now();

                            if (currentTime - lastRequestTime < 30 * 1000) {
                                socket.send(JSON.stringify({
                                    handler: 'room_message',
                                    id: 'ComicTimeControl',
                                    type: 'text',
                                    room: parsedData.room,
                                    url: '',
                                    length: '',
                                    body: '⏳ يمكنك طلب كوميكس آخر بعد 30 ثانية من آخر طلب.'
                                }));
                                return;
                            }
                        }

                        const randomComic = getRandomComicImage(); // now returns { id, url, addedBy }

                        if (randomComic) {
                            // إرسال صورة الكوميكس
                            socket.send(JSON.stringify({
                                handler: 'room_message',
                                id: 'ComicDelivery',
                                type: 'image',
                                room: parsedData.room,
                                url: randomComic.url,
                                length: '',
                                body: ''
                            }));

                            // إرسال ID الصورة واسم الشخص الذي أضافها
                            socket.send(JSON.stringify({
                                handler: 'room_message',
                                id: 'ComicIdMessage',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: `📎 Comic ID: ${randomComic.id}\n👤 Added by: ${randomComic.addedBy}`
                            }));

                            activeUsersComic.set(userId, Date.now());
                        } else {
                            socket.send(JSON.stringify({
                                handler: 'room_message',
                                id: 'ComicError',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: 'حدث خطأ أثناء جلب صورة الكوميكس. حاول مرة أخرى لاحقًا.'
                            }));
                        }
                    }



                    if (parsedData?.body && parsedData.body.startsWith('addcomic@')) {
                        const imageUrl = parsedData.body.split('@')[1]?.trim(); // الحصول على رابط الصورة
                        const username = parsedData.from; // اسم الشخص الذي أرسل الأمر

                        // دالة للتحقق من صحة الرابط
                        function isValidUrl(url) {
                            try {
                                const parsed = new URL(url);
                                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
                            } catch (err) {
                                return false;
                            }
                        }

                        // التحقق من صحة الرابط
                        if (imageUrl && isValidUrl(imageUrl)) {
                            const result = addComicImage(imageUrl, username); // إضافة الصورة مع اسم الشخص

                            const reply = result
                                ? `✅ Comic image added with ID: ${result.id} by ${result.addedBy}`
                                : '❌ Error adding the comic image.';

                            socket.send(JSON.stringify({
                                handler: 'room_message',
                                id: 'ComicAdd',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: reply
                            }));
                        } else {
                            socket.send(JSON.stringify({
                                handler: 'room_message',
                                id: 'ComicAddError',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: '⚠️ Invalid link. Please use the correct format like: addcomic@https://example.com/image.jpg'
                            }));
                        }

                        return;
                    }



                    if (parsedData?.body &&parsedData.body.startsWith('deletecomic@')) {
                        const idString = parsedData.body.split('@')[1]?.trim();
                        const idToDelete = parseInt(idString);

                        if (!isNaN(idToDelete)) {
                            const result = deleteComicImageById(idToDelete);

                            const reply = result
                                ? `🗑️ Comic image with ID ${idToDelete} has been deleted.`
                                : `⚠️ No comic image found with ID ${idToDelete}.`;

                            socket.send(JSON.stringify({
                                handler: 'room_message',
                                id: 'ComicDelete',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: reply
                            }));
                        } else {
                            socket.send(JSON.stringify({
                                handler: 'ComicDeleteError',
                                id: 'ComicDelete',
                                type: 'text',
                                room: parsedData.room,
                                url: '',
                                length: '',
                                body: '⚠️ Invalid format. Use: deletecomic@<id>'
                            }));
                        }

                        return;
                    }

                    if (parsedData.body === 'روم' || parsedData.body === 'room') {
                        const roomNameMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `${parsedData.room}`
                        };

                        socket.send(JSON.stringify(roomNameMessage));
                        return;
                    }
                    if (parsedData?.body &&parsedData.body.startsWith('اسال')) {
                        // استخراج الاسم بعد كلمة "اسأل"
                        const parts = parsedData.body.split(' ');
                        if (parts.length < 2) return; // تأكد من وجود اسم

                        const targetName = parts[1]; // الاسم بعد كلمة "اسأل"
                        const question = getRandomQuestion();

                        const askMessage = {
                            handler: 'room_message',
                            id: 'TclBVHgBzPGTMRTNpgWV',
                            type: 'text',
                            room: parsedData.room,
                            url: '',
                            length: '',
                            body: `${targetName}، سؤال لك: ${question}`
                        };

                        socket.send(JSON.stringify(askMessage));
                        return;
                    }


                    if (parsedData.body && parsedData?.body?.startsWith('tw@')) {
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
             

                // التعامل مع كلمة "catch"
                if ((parsedData.body === 'catch' || parsedData.body === 'كاتش') && legendaryMonsterAlive === true) {
                    let respondingUser = users.find(user => user.username === parsedData.from);
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);
                    const rooms = roomsData.map(room => room.name);
                    if (respondingUser) {
                        const currentTime = Date.now(); // الوقت الحالي بالمللي ثانية
                        const tenMinutesInMillis = 10 * 60 * 1000; // 10 دقائق بالمللي ثانية

                        // إذا لم يمر 10 دقائق منذ آخر Shot أو إذا لم يتم إرسال Shot من قبل
                        if (!respondingUser.lastShotTime || currentTime - respondingUser.lastShotTime >= tenMinutesInMillis) {
                            if (legendaryMonsterAlive) {
                                respondingUser.points += currentLegendaryMonster.points; // إضافة النقاط
                                respondingUser.lastShotTime = currentTime; // تحديث وقت آخر Shot
                                legendaryMonsterAlive = false; // تحديث حالة الوحش ليصبح ميتًا بعد اصطياده

                                // إرسال رسالة لكل الغرف
                                for (let ur of rooms) {
                                    const message = {
                                        handler: 'room_message',
                                        id: 'TclBVHgBzPGTMRTNpgWV',
                                        type: 'text',
                                        room: ur,
                                        url: '',
                                        length: '',
                                        body: `${parsedData.from} caught the legendary ${currentLegendaryMonster.name}! ${currentLegendaryMonster.emoji} and earned ${currentLegendaryMonster.points} points!`,
                                    };
                                    socket.send(JSON.stringify(message));
                                }

                                // إرسال رسالة لللاعب أنه تم إضافة النقاط
                                const roomJoinSuccessMessage = {
                                    handler: 'chat_message',
                                    id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                    to: parsedData.from,
                                    body: `${currentLegendaryMonster.points} points have been added to your account!`,
                                    type: 'text'
                                };
                                socket.send(JSON.stringify(roomJoinSuccessMessage));

                                writeUsersToFile(users); // تحديث بيانات المستخدمين
                            }
                        } else {
                            const remainingTime = tenMinutesInMillis - (currentTime - respondingUser.lastShotTime);
                            const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
                            sendMainMessage(parsedData.room, `${parsedData.from}, you must wait ${remainingMinutes} minute(s) before you can send a "catch" again.`);
                        }
                    }
                } else if (parsedData.body === 'catch' || parsedData.body === 'كاتش') {
                    sendMainMessage(parsedData.room, "No legendary monster is available to catch right now.");
                }




                if (parsedData.body && parsedData.body.startsWith('in@')) {
                    function getUsersInRoom(roomName) {
                        const data = fs.readFileSync('rooms.json', 'utf8');
                        const roomsData = JSON.parse(data);

                        // البحث عن الغرفة المطلوبة
                        const room = roomsData.find(room => room.name.toLowerCase() === roomName.toLowerCase());

                        if (room && Array.isArray(room.users) && room.users.length > 0) {
                            return room.users.map(user => user.username);
                        } else {
                            return [];
                        }
                    }
                    function sendNextUsersChunk(room) {
                        if (currentIndex >= currentUsersList.length) {
                            sendMainMessage(room, '✅ End of the list. No more users to display.');
                            resetPagination();
                            return;
                        }

                        const userListChunk = currentUsersList.slice(currentIndex, currentIndex + 10).join('\n- ');
                        sendMainMessage(room, `👥 Users in room ${currentRoomName} (part ${Math.ceil(currentIndex / 10) + 1}):
                    - ${userListChunk}
                    
                    ➡️ Send .nx within 15 seconds to get the next 10 users.`);
                        currentIndex += 10;

                        // إعداد مؤقت زمني لمدة 15 ثانية
                        clearTimeout(timeoutHandle);
                        timeoutHandle = setTimeout(() => {
                            sendMainMessage(room, '⏰ Time out! You did not request the next part of the list in time. Please send in@room_name again to start over.');
                            resetPagination();
                        }, 15000); // 15 ثانية
                    }

                    // إعادة تعيين المتغيرات الخاصة بالتقسيم
                    function resetPagination() {
                        currentRequester = null;
                        currentRoomName = null;
                        currentUsersList = [];
                        currentIndex = 0;
                        clearTimeout(timeoutHandle);
                    }

                    const sender = parsedData.from; // المرسل الحقيقي للطلب
                    const roomName = parsedData.body.slice(3).trim(); // استخراج اسم الغرفة بعد "in@"

                    if (!roomName) {
                        sendMainMessage(parsedData.room, '⚠️ Please provide the room name. Example: in@room_name');
                        return;
                    }

                    // جلب المستخدمين في الغرفة المطلوبة

                    // إرسال الرسالة إلى نفس الغرفة التي تم إرسال الطلب منها

                    const users = getUsersInRoom(roomName);

                    if (Array.isArray(users) && users.length > 0) {
                        currentRequester = sender;
                        currentRoomName = roomName;
                        currentUsersList = users;
                        currentIndex = 0;
                        sendNextUsersChunk(parsedData.room);
                    } else {
                        sendMainMessage(parsedData.room, `⚠️ No users found in room ${roomName}.`);
                    }
                }

                if (parsedData.body && parsedData.body === '.nx') {
                    function resetPagination() {
                        currentRequester = null;
                        currentRoomName = null;
                        currentUsersList = [];
                        currentIndex = 0;
                        clearTimeout(timeoutHandle);
                    }

                    function sendNextUsersChunk(room) {
                        if (currentIndex >= currentUsersList.length) {
                            sendMainMessage(room, '✅ End of the list. No more users to display.');
                            resetPagination();
                            return;
                        }

                        const userListChunk = currentUsersList.slice(currentIndex, currentIndex + 10).join('\n- ');
                        sendMainMessage(room, `👥 Users in room ${currentRoomName} (part ${Math.ceil(currentIndex / 10) + 1}):
                    - ${userListChunk}
                    
                    ➡️ Send .nx within 15 seconds to get the next 10 users.`);
                        currentIndex += 10;

                        // إعداد مؤقت زمني لمدة 15 ثانية
                        clearTimeout(timeoutHandle);
                        timeoutHandle = setTimeout(() => {
                            sendMainMessage(room, '⏰ Time out! You did not request the next part of the list in time. Please send in@room_name again to start over.');
                            resetPagination();
                        }, 15000); // 15 ثانية
                    }

                    const sender = parsedData.from; // المرسل الحقيقي للطلب

                    if (sender !== currentRequester) {
                        sendMainMessage(parsedData.room, '⚠️ You are not the one who started this list request. Please send in@room_name to start your own request.');
                        return;
                    }

                    sendNextUsersChunk(parsedData.room);
                }

                if (parsedData.body && parsedData.body.startsWith('is@')) {
                    const sender = parsedData.from; // المرسل الحقيقي للطلب
                    const usernameToCheck = parsedData.body.slice(3).trim(); // استخراج اسم المستخدم بعد is@
                    const reciver = parsedData.body.slice(3).trim(); // استخراج اسم المستخدم بعد is@


                    const vipUsers = readVipSearchFile(); // افترض أن هذه الدالة تقرأ قائمة VIP من ملف vip.json

                    // تحقق إذا كان المستخدم في قائمة VIP
                    const isVip = vipUsers.some(user => user.username === sender);
                    const isVipreciver = vipUsers.some(user => user.username === reciver);
                    // if (!isVip) {
                    //     // إذا لم يكن المرسل في قائمة VIP، نرسل رسالة له

                    //     // إخراج المرسل من العملية بعد إرسال الرسالة
                    //     sendMainMessage(parsedData.room, `You are not subscribed to the SuperVIP service.`);
                    //     return;
                    // }
                    // if (!isVip) {
                    //     console.log(`User ${sender} is not a VIP.`);
                    //     sendMainMessage(parsedData.room, `You are not subscribed to the SuperVIP service.`);
                    //     return;
                    // }



                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);

                    // البحث عن الغرف التي تحتوي على المستخدم
                    const roomsWithDurations = roomsData
                        .filter(room => room.users && room.users.some(user => user.username === usernameToCheck))
                        .map(room => {
                            const user = room.users.find(user => user.username === usernameToCheck);
                            const joinedAt = new Date(user.joinedAt); // وقت دخول المستخدم
                            const now = new Date(); // الوقت الحالي
                            const durationInMinutes = Math.floor((now - joinedAt) / (1000 * 60)); // المدة بالدقائق

                            return `${room.name} (since ${durationInMinutes} minutes)`;
                        });


                    if (roomsWithDurations.length > 0) {
                        // إرسال قائمة الغرف التي يتواجد بها المستخدم والمدة
                        sendMainMessage(
                            parsedData.room,
                            `🛡️ ${usernameToCheck} is in the following rooms:\n- ${roomsWithDurations.join('\n- ')}`
                        );
                    } else {
                        // إذا لم يتم العثور على المستخدم في أي غرفة
                        sendMainMessage(
                            parsedData.room,
                            `⚠️ ${usernameToCheck} is not in any room.`
                        );
                    }
                    if (!isVipreciver) {
                        const nonVipMessage = `Someone searched for you to know more about you. To contact ${"ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا"}, please reach out to them for details.`;
                        const roomJoinSuccessMessage = {
                            handler: 'chat_message',
                            id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                            to: usernameToCheck,  // المرسل الذي ليس في قائمة VIP
                            body: nonVipMessage,
                            type: 'text'
                        };
                        socket.send(JSON.stringify(roomJoinSuccessMessage));

                        return;
                    } else {
                        const msgDetailes = `⚠️ ${parsedData.from} searched for you in the  room:\n- ${parsedData.room}`;

                        const roomSerachMessage = {
                            handler: 'chat_message',
                            id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                            to: usernameToCheck,
                            body: msgDetailes,
                            type: 'text'
                        };
                        socket.send(JSON.stringify(roomSerachMessage));
                    }
                }









                if (parsedData.handler === 'room_event' && parsedData.type === 'user_joined') {
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);

                    const room = roomsData.find(room => room.name === parsedData.name && room.welcome);
                    const roomIndex = roomsData.findIndex(room => room.name === parsedData.name);

                    if (roomIndex !== -1) {
                        let room = roomsData[roomIndex];
                    
                        // إضافة مصفوفة recentUsers إذا لم تكن موجودة
                        if (!room.users) room.users = [];
                        if (!room.totalTimeRecords) room.totalTimeRecords = {};
                        if (!room.recentUsers) room.recentUsers = [];
                    
                        const existingUserIndex = room.users.findIndex(user => user.username === parsedData.username);
                        const existingRecentUserIndex = room.recentUsers.findIndex(user => user.username === parsedData.username);
                    
                        const role = parsedData.role || 'member'; // تحديد الدور
                    
                        if (existingUserIndex === -1) {
                            // إذا كان المستخدم غير موجود في users، أضفه
                            const previousTotalTime = room.totalTimeRecords[parsedData.username] || 0;
                            room.users.push({
                                username: parsedData.username,
                                role: role,
                                joinedAt: new Date().toISOString(),
                                totalTime: previousTotalTime
                            });
                    
                            // إضافة المستخدم إلى recentUsers فقط إذا لم يكن موجودًا
                            if (existingRecentUserIndex === -1) {
                                room.recentUsers.unshift({
                                    username: parsedData.username,
                                    role: role,
                                    joinedAt: new Date().toISOString()
                                });
                    
                                // إذا كانت المصفوفة تحتوي على أكثر من 100 مستخدم، نزيل الأقدم
                                if (room.recentUsers.length > 100) {
                                    room.recentUsers.pop();
                                }
                            } else {
                                // إذا كان المستخدم موجودًا في recentUsers، قم بتحديث بياناته
                                room.recentUsers[existingRecentUserIndex].joinedAt = new Date().toISOString();
                                room.recentUsers[existingRecentUserIndex].role = role;
                            }
                        } else {
                            // إذا كان المستخدم موجودًا في users، فقط حدث بياناته
                            room.users[existingUserIndex].joinedAt = new Date().toISOString();
                            room.users[existingUserIndex].role = role;
                        }
                    
                        roomsData[roomIndex] = room;
                        fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                    }
                     else {
                        console.error(`Room ${parsedData.name} not found.`);
                        return;
                    }

                    // باقي الكود لاستقبال رسالة الترحيب بناءً على البيانات
                    if (room) {
                        const vipUsers = readVipFile();
                        const usersData = fs.readFileSync('verifyusers.json', 'utf8');
                        const users = JSON.parse(usersData);

                        const leaderboard = [...users].sort((a, b) => b.points - a.points);
                        const topUsers = leaderboard.slice(0, 10);

                        const titles = [
                            "The King 👑", "The Legend 🏆", "The Champion ⚔️",
                            "The Commander 🛡️", "The Genius 💡", "The Elite 🌟",
                            "The Pro 🎯", "The Rocket 🚀", "The Scholar 📚", "The Creator ✨"
                        ];

                        const isVip = vipUsers.some(user => user.username === parsedData.username);
                        const userRank = topUsers.findIndex(user => user.username === parsedData.username);

                        const userData = users.find(user => user.username === parsedData.username);
                        const welcomeType = userData?.welcomeType || 'nickname_only';
                        const imageWC = userData?.ImageWC || null;

                        let nickname = parsedData.username;
                        if (userData?.nickname && userData.nickname !== null && userData.nickname.trim() !== "") {
                            nickname = userData.nickname;
                        }

                        let messageToSend = "";

                        if (userRank !== -1 && isVip) {
                            const title = titles[userRank];
                            if (welcomeType === 'image_and_nickname') {
                                messageToSend = `✨ Welcome 🇻‌🇮‌🇵‌ ${nickname} - ${title} ✨`;
                            } else if (welcomeType === 'nickname_only') {
                                messageToSend = `👑 Welcome ${nickname} - VIP ✨`;
                            }
                        } else if (isVip) {
                            if (welcomeType === 'image_and_nickname') {
                                messageToSend = `👑 VIP ${nickname} has joined!`;
                            } else if (welcomeType === 'nickname_only') {
                                messageToSend = `👑 Welcome ${nickname}!`;
                            }
                        } else if (userRank !== -1) {
                            const title = titles[userRank];
                            if (welcomeType === 'image_and_nickname') {
                                messageToSend = `✨ Welcome ${nickname} - ${title} ✨`;
                            } else if (welcomeType === 'nickname_only') {
                                messageToSend = `✨ Welcome ${nickname} - ${title}!`;
                            }
                        } else {
                            if (welcomeType === 'image_and_nickname') {
                                messageToSend = `♔ Welcome ${nickname} ♔`;
                            } else if (welcomeType === 'nickname_only') {
                                messageToSend = `♔ Welcome ${nickname} ♔`;
                            }
                        }

                        // إرسال الرسائل حسب نوع الترحيب
                        if (welcomeType === 'image_and_nickname') {
                            // if (imageWC) {
                            //     sendMainImageMessage(parsedData.name, imageWC);
                            // }
                            sendMainMessage(parsedData.name, messageToSend);
                        } else if (welcomeType === 'image_only') {
                            // if (imageWC) {
                            //     sendMainImageMessage(parsedData.name, imageWC);
                            // }
                        } else if (welcomeType === 'nickname_only') {
                            sendMainMessage(parsedData.name, messageToSend);
                        }
                    }
                }

              



                if (parsedData.handler === 'room_event' && parsedData.type === 'user_left') {
                    try {
                        const data = fs.readFileSync('rooms.json', 'utf8');
                        const roomsData = JSON.parse(data);
                
                        const roomIndex = roomsData.findIndex(room => room.name === parsedData.name);
                
                        if (roomIndex !== -1) {
                            let room = roomsData[roomIndex];
                
                            if (!room.totalTimeRecords) room.totalTimeRecords = {};
                            if (!room.users) room.users = [];
                
                            const userIndex = room.users.findIndex(user => user.username === parsedData.username);
                
                            if (userIndex !== -1) {
                                const joinedAt = new Date(room.users[userIndex].joinedAt);
                                const leftAt = new Date();
                                const duration = Math.floor((leftAt - joinedAt) / 60000); // المدة بالدقائق
                
                                // تحديث وقت التواجد الإجمالي
                                room.users[userIndex].totalTime += duration;
                                room.totalTimeRecords[parsedData.username] =
                                    (room.totalTimeRecords[parsedData.username] || 0) + duration;
                
                                // حذف المستخدم من القائمة
                                room.users.splice(userIndex, 1);
                
                                // حفظ التغييرات
                                roomsData[roomIndex] = room;
                                fs.writeFileSync('rooms.json', JSON.stringify(roomsData, null, 2), 'utf8');
                
                            }
                        } else {
                            console.warn(`⚠️ لم يتم العثور على الغرفة ${parsedData.name}`);
                        }
                    } catch (err) {
                        console.error('❌ حدث خطأ أثناء معالجة user_left:', err);
                    }
                }
                


                if (parsedData.body === '#top') {
                    const data = fs.readFileSync('rooms.json', 'utf8');
                    const roomsData = JSON.parse(data);
                    const room = roomsData.find(room => room.name === parsedData.room);

                    if (room && room.totalTimeRecords) {
                        const leaderboard = Object.entries(room.totalTimeRecords)
                            .map(([username, totalTime]) => {
                                let formattedTime;
                                if (totalTime >= 1440) { // 1440 minutes = 1 day
                                    const days = Math.floor(totalTime / 1440);
                                    formattedTime = `${days} day${days > 1 ? 's' : ''}`;
                                } else if (totalTime >= 60) { // 60 minutes = 1 hour
                                    const hours = Math.floor(totalTime / 60);
                                    formattedTime = `${hours} hour${hours > 1 ? 's' : ''}`;
                                } else {
                                    formattedTime = `${totalTime} minute${totalTime > 1 ? 's' : ''}`;
                                }
                                return { username, formattedTime, totalTime };
                            })
                            .sort((a, b) => b.totalTime - a.totalTime)
                            .slice(0, 10);

                        const today = new Date().toLocaleDateString('en-US'); // Format the date in English

                        let message = `🏆 Top 10 Users in the Room  🏆\n`;
                        message += `📅 Ranking starts from: 12/2/2025\n\n`; // Added this line

                        leaderboard.forEach((user, index) => {
                            message += `${index + 1}. ${user.username} - ${user.formattedTime}\n`;
                        });

                        sendMainMessage(parsedData.room, message);
                    }
                }

                if (parsedData.body && parsedData.body.includes('@')) {
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
                    const safePoints = typeof user.points === 'number' && !isNaN(user.points) ? user.points : 0;
                    const formattedPoints = formatPoints(safePoints);
                    
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
                        catch (err) {

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
                    else if (body === '.users' && parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا") {

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

                    else if (body.startsWith('search@')) {
                        const usernameToAdd = body.split('@')[1].trim();

                        addUser({ "username": usernameToAdd });
                        sendVerificationMessage(parsedData.room, `User added : ${usernameToAdd}`);

                    }
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
                        if (now - player.lastBetTime < 180000) { // 300,000 ms = 5 دقائق
                            sendMainMessage(parsedData.room, `❌ You can only start or join a bet once every 3 minutes.`);
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




                    if (parsedData.body === '.cr') {
                        const senderUsername = parsedData.from;
                        const usernameToVerify = parsedData.from;

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




                    else if (body === '.enter') {
                        const senderUsername = parsedData.from

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
                                sendMainMessage(activeRoomData.players[0]?.joinedFromRoom, `🏏 ${parsedData.from} has joined the game as defender. The game has started!`);
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
                                sendMainMessage(activeRoomData?.players[1]?.joinedFromRoom, `🤔 The attacker has rolled. Please ${activeRoomData.players[1]?.username} guess a number between 1 and 6.`);
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
                                    const usernameToAddPoints = activeRoomData.players[1]?.username;
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








                    else if (body.startsWith('-cp@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐠𝐚𝐫˼𔘓")) {
                        // Extract the username and amount to be subtracted
                        const parts = body.split('@');
                        const usernameToSubtractPoints = parts[1];
                        const amountToSubtract = parseInt(parts[2]);

                        // Check if the amount is a valid number
                        if (isNaN(amountToSubtract) || amountToSubtract <= 0) {
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
                        const targetPlayer = users.find(user => user.username === usernameToSubtractPoints);

                        // Ensure the target player exists
                        if (!targetPlayer) {
                            sendMainMessage(parsedData.room, `❌ User ${usernameToSubtractPoints} not found.`);
                            return;
                        }

                        // Ensure the target player has enough points to subtract
                        if (targetPlayer.points < amountToSubtract) {
                            sendMainMessage(parsedData.room, `❌ ${usernameToSubtractPoints} does not have enough points to subtract.`);
                            return;
                        }

                        // Subtract the amount from the target player's points
                        targetPlayer.points -= amountToSubtract;

                        // Save the updated users data to the file
                        fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                        // Notify the room that the points have been subtracted
                        sendMainMessage(parsedData.room, `✅ ${amountToSubtract} points have been subtracted from ${usernameToSubtractPoints}'s account by ${parsedData.from}. ${usernameToSubtractPoints} now has ${targetPlayer.points} points.`);
                    }




                    else if (body.startsWith('+cp@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "قشـٰطـۿـۃۦَٰ")) {
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
                        const activeRoomData = Object.entries(bettingData).find(([roomName, room]) => room.active); // Find room with active bet

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

                                sendMainMessage(
                                    activeRoomData[0],
                                    `🎉 ${parsedData.from} has joined the bet with 💰 ${roomData.betAmount} points! 🚀\nThe game was started  .\nTo start the game please ${roomData.startedBy}, type .start!`
                                );
                                sendMainMessage(
                                    parsedData.room,
                                    `🎉 ${parsedData.from} has joined the bet with 💰 ${roomData.betAmount} points! 🚀\nThe game was started  .\nTo start the game please ${roomData.startedBy}, type .start!`
                                );
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

                    // قائمة المستخدمين المميزين المحميين من السرقة

                    else if (body.startsWith('steal@')) {
                        const parts = body.split('@');
                        if (parts.length < 3) {
                            sendMainMessage(parsedData.room, `❌ Invalid format! Please use the format 'steal@username@amount'.`);
                            return;
                        }
                        const targetUsername = parts[1].trim();
                        const amount = parseInt(parts[2].trim());

                        const thief = users.find(user => user.username === parsedData.from);
                        const target = users.find(user => user.username === targetUsername);

                        if (isNaN(amount) || amount <= 0) {
                            sendMainMessage(parsedData.room, `❌ Invalid amount! Please enter a valid number greater than zero.`);
                            return;
                        }
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

                        // تحقق من حماية المستخدم إذا كان مميزًا
                        if (protectedUsers.includes(target.username)) {
                            sendMainMessage(parsedData.room, `🛡️ ${target.username} is a VIP and cannot be stolen from!`);
                            return;
                        }

                        const now = Date.now();
                        if (target.protectionUntil && target.protectionUntil > now) {
                            sendMainMessage(parsedData.room, `🛡️ ${target.username} is temporarily protected from theft! Try again later.`);
                            return;
                        }

                        if (thief.lastTheftAttempt && thief.lastTheftAttempt + 2 * 60 * 1000 > now) {
                            const remainingTime = Math.ceil((thief.lastTheftAttempt + 2 * 60 * 1000 - now) / 1000);
                            sendMainMessage(parsedData.room, `⏳ You can steal again in ${remainingTime} seconds.`);
                            return;
                        }

                        thief.lastTheftAttempt = now;

                        if (thief.points < amount) {
                            sendMainMessage(parsedData.room, `❌ You don't have enough points to steal ${amount} points.`);
                            return;
                        }

                        if (target.points < amount) {
                            sendMainMessage(parsedData.room, `❌ ${target.username} doesn't have ${amount} points to steal.`);
                            return;
                        }

                        sendMainMessage(parsedData.room, `🔍 ${thief.username} is attempting to steal ${amount} points from ${target.username}...`);

                        setTimeout(() => {
                            const successChance = Math.random() < 0.4;

                            if (successChance) {
                                target.points -= amount;
                                thief.points += amount;
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                sendMainMessage(parsedData.room, `🎉 ${thief.username} successfully stole 💰 ${amount} points from ${target.username}!`);
                            } else {
                                target.points += amount;
                                thief.points -= amount;
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                sendMainMessage(parsedData.room, `❌ ${thief.username} failed to steal! 💸 ${amount} points were given to ${target.username}.`);
                            }
                        }, 5000);
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
                        console.log(parsedData.room, `78787546534654`);

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

                    else if (body.startsWith('vip@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "🕷⃝hคcͥkeͣrͫ" || parsedData.from === "↲رآقُـ✵ۣۘ͡ـيَ˚⸙͎۪۫⋆بًآخِـۦٰـلَآقُـ✵ۣۘ͡ـيَ↳" || parsedData.from === "سـاره" || parsedData.from === "i_gamd_i")) {
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

                    else if (body === '.list') {
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
                        let leaderboardMessage = `\u202B🏆 Top 10 Players with Most Points: 🏆\n🎉 The winner  is ["يــافـ𓂆ـا"]! 🎉 \n🎉`;

                        topPlayers.forEach((player, index) => {
                            const emoji = rankEmojis[index] || '🔹'; // اختيار الإيموجي بناءً على الترتيب
                            const formattedPoints = formatPoints(player.points); // تنسيق النقاط
                            leaderboardMessage += `${emoji} ${index + 1}. ${player.username}: ${formattedPoints} \n`;
                        });

                        leaderboardMessage += `\u202C`; // إنهاء تنسيق اتجاه النص

                        // إرسال الرسالة إلى الغرفة
                        sendMainMessage(parsedData.room, leaderboardMessage);
                    }
                    else if (
                        body.startsWith('man@') &&
                        (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" ||
                            parsedData.from === "˹𔘓°ℓуℓу𝆟˼")
                    ) {
                        function readManFile() {
                            try {
                                const data = fs.readFileSync('boyesmarried.json');
                                return JSON.parse(data);
                            } catch (err) {
                                console.log("Error reading VIP file: ", err);
                                return [];
                            }
                        }

                        function writeManFile(vipUsers) {
                            try {
                                fs.writeFileSync('boyesmarried.json', JSON.stringify(vipUsers, null, 2));
                            } catch (err) {
                                console.log("Error writing to VIP file: ", err);
                            }
                        }

                        function isValidUrl(url) {
                            const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
                            return urlRegex.test(url);
                        }

                        const usernameToAdd = body.split('@')[1]?.trim();
                        const imageUrl = body.split('@')[2]?.trim();
                        const defaultImage = 'https://default-image-url.com/default.jpg';

                        let vipUsers = readManFile();

                        const userExists = vipUsers.some(user => user.username === usernameToAdd);
                        const imageExists = imageUrl && vipUsers.some(user => user.image === imageUrl);

                        if (userExists) {
                            console.log(`User ${usernameToAdd} is already in the list.`);
                            sendVerificationMessage(parsedData.room, `User ${usernameToAdd} is already in the list.`);
                        } else if (imageUrl && (!isValidUrl(imageUrl) || imageExists)) {
                            let errorMessage = !isValidUrl(imageUrl)
                                ? `Invalid image URL provided by ${usernameToAdd}.`
                                : `This image URL is already used by another user.`;

                            console.log(errorMessage);
                            sendVerificationMessage(parsedData.room, errorMessage);
                        } else {
                            const newUser = {
                                username: usernameToAdd,
                                image: isValidUrl(imageUrl) ? imageUrl : defaultImage
                            };

                            vipUsers.push(newUser);
                            writeManFile(vipUsers);

                            sendVerificationMessage(parsedData.room, `User added to the list: ${usernameToAdd}`);

                            const roomJoinSuccessMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: usernameToAdd,
                                body: `YOU Now SUPER MAN TO SEND ANY PHOTO AS GIFT BY : \n  SEND sman@username and send any photo in room in 30sec and then .send to send image as gift . `,
                                type: 'text'
                            };

                            socket.send(JSON.stringify(roomJoinSuccessMessage));
                        }
                    }


                    else if (
                        body.startsWith('woman@') &&
                        (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" ||
                            parsedData.from === "˹𔘓°ℓуℓу𝆟˼")
                    ) {
                        function readManFile() {
                            try {
                                const data = fs.readFileSync('girlsmarried.json');
                                return JSON.parse(data);
                            } catch (err) {
                                console.log("Error reading file: ", err);
                                return [];
                            }
                        }

                        function writeManFile(vipUsers) {
                            try {
                                fs.writeFileSync('girlsmarried.json', JSON.stringify(vipUsers, null, 2));
                            } catch (err) {
                                console.log("Error writing to file: ", err);
                            }
                        }

                        function isValidUrl(url) {
                            const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
                            return urlRegex.test(url);
                        }

                        const usernameToAdd = body.split('@')[1]?.trim();
                        const imageUrl = body.split('@')[2]?.trim();
                        const defaultImage = 'https://default-image-url.com/default.jpg';

                        let vipUsers = readManFile();

                        const userExists = vipUsers.some(user => user.username === usernameToAdd);
                        const imageExists = imageUrl && vipUsers.some(user => user.image === imageUrl);

                        if (userExists) {
                            console.log(`User ${usernameToAdd} is already in the list.`);
                            sendVerificationMessage(parsedData.room, `User ${usernameToAdd} is already in the list.`);
                        } else if (imageUrl && (!isValidUrl(imageUrl) || imageExists)) {
                            let errorMessage = !isValidUrl(imageUrl)
                                ? `Invalid image URL provided by ${usernameToAdd}.`
                                : `This image URL is already used by another user.`;

                            console.log(errorMessage);
                            sendVerificationMessage(parsedData.room, errorMessage);
                        } else {
                            const newUser = {
                                username: usernameToAdd,
                                image: isValidUrl(imageUrl) ? imageUrl : defaultImage
                            };

                            vipUsers.push(newUser);
                            writeManFile(vipUsers);

                            sendVerificationMessage(parsedData.room, `User added to the list: ${usernameToAdd}`);

                            const roomJoinSuccessMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',
                                to: usernameToAdd,
                                body: `YOU Now SUPER MAN TO SEND ANY PHOTO AS GIFT BY : \n  SEND sman@username and send any photo in room in 30sec and then .send to send image as gift .`,
                                type: 'text'
                            };

                            socket.send(JSON.stringify(roomJoinSuccessMessage));
                        }
                    }

                    else if (body.startsWith("welcometype@")) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return;
                        }

                        const typeCode = body.split("@")[1]?.trim();
                        const typeMap = {
                            "1": "nickname_only",
                            "2": "image_only",
                            "3": "image_and_nickname"
                        };

                        if (!typeMap[typeCode]) {
                            sendVerificationMessage(parsedData.room,
                                `❌ نوع الترحيب غير معروف. استخدم أحد الأرقام التالية:\n` +
                                `1 - الترحيب بالاسم فقط (nickname_only)\n` +
                                `2 - الترحيب بالصورة فقط (image_only)\n` +
                                `3 - الترحيب بالصورة والاسم (image_and_nickname)`
                            );
                            return;
                        }

                        try {
                            const usersData = fs.readFileSync('verifyusers.json', 'utf8');
                            const users = JSON.parse(usersData);

                            const userIndex = users.findIndex(user => user.username === parsedData.from);
                            if (userIndex !== -1) {
                                users[userIndex].welcomeType = typeMap[typeCode];

                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                sendVerificationMessage(parsedData.room,
                                    `✅ تم تغيير نوع الترحيب الخاص بك إلى: ${typeMap[typeCode].replace(/_/g, ' ')}`);
                            } else {
                                sendVerificationMessage(parsedData.room, "⚠️ المستخدم غير موجود في قاعدة البيانات.");
                            }
                        } catch (err) {
                            console.error("Error updating welcomeType:", err);
                            sendVerificationMessage(parsedData.room, "❌ حدث خطأ أثناء تحديث نوع الترحيب.");
                        }
                    }
                    else if (body === "help@welcome") {
                        const helpMessage = `
                    📌 Welcome Type Options:
                    1️⃣ = nickname_only → يظهر اسمك أو نيك نيم فقط
                    2️⃣ = image_only → يظهر فقط الصورة الترحيبية
                    3️⃣ = image_and_nickname → يظهر اسمك مع الصورة الترحيبية
                    
                    🛠️ لتغيير نوع الترحيب أرسل:
                    setwelcome@<رقم النوع>
                    
                    مثال: setwelcome@3
                    `;

                        sendVerificationMessage(parsedData.room, helpMessage);
                    }





                    else if (body.startsWith("imagewc@")) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            // Additional actions if needed when user is unverified
                            return;
                        }

                        // استخراج رابط الصورة بعد imagewc@
                        const newImageUrl = body.split("@")[1]?.trim();

                        // التحقق من صحة الرابط
                        const isValidUrl = url => /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(url);
                        if (!isValidUrl(newImageUrl)) {
                            sendVerificationMessage(parsedData.room, "❌ رابط الصورة غير صالح. تأكد من أنه يبدأ بـ https://");
                            return;
                        }

                        try {
                            const usersData = fs.readFileSync('verifyusers.json', 'utf8');
                            const users = JSON.parse(usersData);

                            const userIndex = users.findIndex(user => user.username === parsedData.from);
                            if (userIndex !== -1) {
                                users[userIndex].ImageWC = newImageUrl;

                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                sendVerificationMessage(parsedData.room, `✅ تم تحديث صورة الترحيب الخاصة بك.`);
                            } else {
                                sendVerificationMessage(parsedData.room, "⚠️ المستخدم غير موجود في قاعدة البيانات.");
                            }
                        } catch (err) {
                            console.error("Error updating ImageWC:", err);
                            sendVerificationMessage(parsedData.room, "❌ حدث خطأ أثناء تحديث صورة الترحيب.");
                        }
                    }



                    else if ((body.startsWith('b@') || body.startsWith('n@') || body.startsWith('o@') || body.startsWith('k@') || body.startsWith('m@') || body.startsWith('a@')) &&
                        (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "𝄟⃝𐦍بــــآࢪبُــي𓏲")) {
                        const sender = parsedData.from; // المرسل الحقيقي للطلب
                        const [command, targetUser] = body.split('@').map(item => item.trim()); // استخراج المعلومات



                        // تنفيذ الأمر بناءً على الاختصار
                        switch (command) {
                            case 'o':
                                makeOwner(parsedData.room, targetUser);
                                sendMainMessage(parsedData.room, `👑 User ${targetUser} is now the Owner.`);
                                break;
                            case 'a':
                                makeAdmin(parsedData.room, targetUser);
                                sendMainMessage(parsedData.room, `🔧 User ${targetUser} is now an Admin.`);
                                break;
                            case 'm':
                                makeMember(parsedData.room, targetUser);
                                sendMainMessage(parsedData.room, `👤 User ${targetUser} is now a Member.`);
                                break;
                            case 'n':
                                removeRole(parsedData.room, targetUser);
                                sendMainMessage(parsedData.room, `🚫 User ${targetUser} has lost their role.`);
                                break;
                            case 'b':
                                banUser(parsedData.room, targetUser);
                                sendMainMessage(parsedData.room, `❌ User ${targetUser} has been banned.`);
                                break;
                            case 'k':
                                kickUser(parsedData.room, targetUser);
                                sendMainMessage(parsedData.room, `🚷 User ${targetUser} has been kicked from the room.`);
                                break;
                            default:
                                sendMainMessage(parsedData.room, `⚠️ Invalid command: ${command}`);
                                return;
                        }
                    }








                  


                 
                    
                    // التحقق من أمر "تفجير user"

                    else if (body.startsWith("تفجير ") || body.startsWith("bomb ")) {
                        const sender = parsedData.from;
                        const isEnglish = body.startsWith("bomb");
                        const parts = body.split(" ");
                        const target = parts[1]?.trim();
                        const data = fs.readFileSync('rooms.json', 'utf8');
                    
                        const roomsData = JSON.parse(data);
                        if (!target) {
                            sendMainMessage(parsedData.room, isEnglish
                                ? "❌ Please specify a user to bomb. Example: bomb user1"
                                : "❌ من فضلك حدد المستخدم المراد تفجيره. مثال: تفجير user1");
                            return;
                        }
                    
                        const currentRoom = roomsData.find(room => room.name === parsedData.room);
                        if (!currentRoom || !currentRoom.users.some(u => u.username === target)) {
                            sendMainMessage(parsedData.room, isEnglish
                                ? `❌ User ${target} is not in the room.`
                                : `❌ المستخدم ${target} غير موجود في الغرفة.`);
                            return;
                        }
                    
                        // تحديد الألوان والرسائل حسب اللغة
                        const colors = isEnglish ? ['red', 'green', 'blue'] : ['أحمر', 'أخضر', 'أزرق'];
                        const correctColor = colors[Math.floor(Math.random() * colors.length)];
                    
                        // دالة تذكير بالوقت (كل 10 ثواني)
                        function sendReminder(target, room, isEnglish, secondsLeft) {
                            sendMainMessage(room, isEnglish
                                ? `⏳ Hurry up ${target}! You have ${secondsLeft} seconds left to defuse or pass the bomb.`
                                : `⏳ أسرع يا ${target}! تبقى لديك ${secondsLeft} ثانية لفك القنبلة أو تمريرها.`);
                        }
                    
                        // بدء المؤقت مع تذكيرات كل 10 ثواني
                        let timeLeft = 30;
                        sendReminder(target, parsedData.room, isEnglish, timeLeft);
                    
                        // تخزين مؤقت التذكير
                        const reminderInterval = setInterval(() => {
                            timeLeft -= 10;
                            if (timeLeft > 0) {
                                sendReminder(target, parsedData.room, isEnglish, timeLeft);
                            }
                        }, 10000);
                    
                        const timeout = setTimeout(() => {
                            clearInterval(reminderInterval);
                            sendMainImageMessage(parsedData.room, "https://i.ibb.co/SKLP8rc/bomb.gif");
                            sendMainMessage(parsedData.room, isEnglish
                                ? `💥 Boom! ${target} has been kicked!`
                                : `💥 انفجرت القنبلة! ${target} تم طرده!`);
                            kickUser(parsedData.room, target);
                            delete bombSessions[target];
                        }, 30000); // 30 ثانية
                    
                        bombSessions[target] = {
                            correctColor,
                            from: sender,
                            room: parsedData.room,
                            isEnglish,
                            timeout,
                            reminderInterval
                        };
                    
                        sendMainMessage(parsedData.room, isEnglish
                            ? `🚨 ${target}, you have a ticking bomb! You have 30 seconds to defuse it by choosing the correct color:
                    🟥 Send "red"
                    🟩 Send "green"
                    🟦 Send "blue"
                    Or pass the bomb to someone else by typing: pass username
                    Example: pass user2`
                            : `🚨 ${target} لديك قنبلة موقوتة! لديك 30 ثانية لفكها عن طريق اختيار اللون الصحيح:
                    🟥 أرسل "أحمر"
                    🟩 أرسل "أخضر"
                    🟦 أرسل "أزرق"
                    أو مرر القنبلة لشخص آخر بكتابة: مرر username
                    مثال: مرر user2`);
                    }
                    
                    // التعامل مع اختيار اللون
                    else if (["أحمر", "أخضر", "أزرق", "red", "green", "blue"].includes(body)) {
                        const responder = parsedData.from;
                        const session = bombSessions[responder];
                        if (!session || session.room !== parsedData.room) return;
                    
                        clearInterval(session.reminderInterval);
                        clearTimeout(session.timeout);
                    
                        if (body.toLowerCase() === session.correctColor.toLowerCase()) {
                            sendMainMessage(parsedData.room, session.isEnglish
                                ? `✅ Well done ${responder}! You defused the bomb.`
                                : `✅ أحسنت يا ${responder}! قمت باختيار اللون الصحيح وتم تعطيل القنبلة.`);
                            delete bombSessions[responder];
                        } else {
                            sendMainImageMessage(parsedData.room, "https://i.ibb.co/SKLP8rc/bomb.gif");
                            sendMainMessage(parsedData.room, session.isEnglish
                                ? `💥 Wrong color! ${responder} has been bombed and kicked.`
                                : `💥 اللون خاطئ! ${responder} تم تفجيره وطرده.`);
                            kickUser(parsedData.room, responder);
                            delete bombSessions[responder];
                        }
                    }
                    
                    // تمرير القنبلة (مرر أو pass)
                    else if (body.startsWith("مرر ") || body.startsWith("pass ")) {
                        const sender = parsedData.from;
                        const session = bombSessions[sender];
                        if (!session || session.room !== parsedData.room) return;
                    
                        const parts = body.split(" ");
                        const newTarget = parts[1]?.trim();
                        if (!newTarget) return;
                    
                        const data = fs.readFileSync('rooms.json', 'utf8');
                        const roomsData = JSON.parse(data);
                        const currentRoom = roomsData.find(room => room.name === parsedData.room);
                        if (!currentRoom || !currentRoom.users.some(u => u.username === newTarget)) {
                            sendMainMessage(parsedData.room, session.isEnglish
                                ? `❌ Cannot pass the bomb. User ${newTarget} is not in the room.`
                                : `❌ لا يمكن تمرير القنبلة. المستخدم ${newTarget} غير موجود في الغرفة.`);
                            return;
                        }
                    
                        clearInterval(session.reminderInterval);
                        clearTimeout(session.timeout);
                    
                        // إعادة ضبط المؤقت والتذكير للمستخدم الجديد
                        let timeLeft = 30;
                        sendMainMessage(parsedData.room, session.isEnglish
                            ? `⚠️ ${sender} passed the bomb to ${newTarget}! You have 30 seconds to defuse it!`
                            : `⚠️ ${sender} مرر القنبلة إلى ${newTarget}! لديك 30 ثانية لاختيار اللون الصحيح!`);
                    
                        function sendReminder(newTarget, room, isEnglish, secondsLeft) {
                            sendMainMessage(room, isEnglish
                                ? `⏳ Hurry up ${newTarget}! You have ${secondsLeft} seconds left to defuse or pass the bomb.`
                                : `⏳ أسرع يا ${newTarget}! تبقى لديك ${secondsLeft} ثانية لفك القنبلة أو تمريرها.`);
                        }
                    
                        sendReminder(newTarget, parsedData.room, session.isEnglish, timeLeft);
                    
                        const reminderInterval = setInterval(() => {
                            timeLeft -= 10;
                            if (timeLeft > 0) {
                                sendReminder(newTarget, parsedData.room, session.isEnglish, timeLeft);
                            }
                        }, 10000);
                    
                        const timeout = setTimeout(() => {
                            clearInterval(reminderInterval);
                            sendMainImageMessage(parsedData.room, "https://i.pinimg.com/736x/7f/5f/82/7f5f82311e147a826ed48c2e91487ed3.jpg");
                            sendMainMessage(parsedData.room, session.isEnglish
                                ? `💥 Boom! ${newTarget} has been kicked!`
                                : `💥 انفجرت القنبلة! ${newTarget} تم طرده!`);
                            kickUser(parsedData.room, newTarget);
                            delete bombSessions[newTarget];
                        }, 30000);
                    
                        bombSessions[newTarget] = {
                            ...session,
                            timeout,
                            reminderInterval
                        };
                    
                        delete bombSessions[sender];
                    }
                    


                  
                    

                    else if (body.startsWith('getimage@')) {
                        const sender = parsedData.from;

                        if (imageRequestUsers.has(sender)) {
                            sendMainMessage(parsedData.room, `You already have a pending image request. Please send your image.`);
                        } else {
                            imageRequestUsers.add(sender);
                            sendMainMessage(parsedData.room, `Please send your image now. You will receive its link.`);

                            // اختيارياً: مؤقت لإلغاء الطلب بعد وقت معين
                            setTimeout(() => {
                                if (imageRequestUsers.has(sender)) {
                                    imageRequestUsers.delete(sender);
                                    sendMainMessage(parsedData.room, `Your image request has expired. Please send getimage@ again.`);
                                }
                            }, 60 * 1000); // دقيقة واحدة
                        }
                    }
// داخل شرط التحقّق من الأوامر في joinRooms.js أو غيره
else if (body.startsWith('+top@')&& (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐠𝐚𝐫˼𔘓")) {
    const parts = body.split('@');
    const usernameToPromote = parts[1];           // ‎+top@Ali‎ → Ali
    const updatedUsers = promoteUserToTop(usernameToPromote, users, 20);
  
    // رسالة تأكيد داخل الغرفة
    sendMainMessage(
      parsedData.room,
      `✅ تمت ترقية ${usernameToPromote} إلى الصدارة بفارق 20٪ عن أقرب منافس.`
    );
  }
  

                    else if (body.startsWith('svip@')) {
                        const sender = parsedData.from; // المرسل الحقيقي للطلب
                        const vipUsers = readVipFile(); // افترض أن هذه الدالة تقرأ قائمة VIP من ملف vip.json
                        VIPGIFTFROMUSER = sender

                        // تحقق إذا كان المستخدم في قائمة VIP
                        const isVip = vipUsers.some(user => user.username === sender);

                        // if (!isVip) {
                        //     // إذا كان المستخدم ليس في قائمة VIP، أرسل رسالة له
                        //     sendMainMessage(parsedData.room, `You are not subscribed to the SuperVIP service.`);
                        //     return;
                        // }
                        const currentTime = Date.now();

                        // التحقق من إذا قام المستخدم بإرسال طلب خلال آخر 5 دقائق
                        // if (lastSvipRequestTime.has(sender)) {
                        //     const lastRequestTime = lastSvipRequestTime.get(sender);
                        //     const timeSinceLastRequest = currentTime - lastRequestTime;

                        //     if (timeSinceLastRequest < FIVE_MINUTES) {
                        //         const remainingTime = Math.ceil((FIVE_MINUTES - timeSinceLastRequest) / 1000);
                        //         sendMainMessage(parsedData.room, `You can only send svip@ requests every 10 minutes. Please wait ${remainingTime} seconds.`);
                        //         return;
                        //     }
                        // }

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

                    // الحالة الأولى: معالجة صور المستخدمين الذين طلبوا رابط صورة
                    else if (
                        parsedData.type === 'image' &&
                        parsedData.url &&
                        parsedData.url !== '' &&
                        imageRequestUsers.has(parsedData.from)
                    ) {
                        const sender = parsedData.from;
                        const imageUrl = parsedData.url;

                        sendMainMessage(parsedData.room, `Your image link is: ${imageUrl}`);
                        imageRequestUsers.delete(sender); // ننهي الطلب بعد الاستجابة
                    }

                    // الحالة الثانية: معالجة الصور الخاصة بطلبات VIP
                    // الحالة الثانية: معالجة الصور الخاصة بطلبات VIP
                    else if (
                        parsedData.type === 'image' &&
                        parsedData.url &&
                        parsedData.url !== '' &&
                        parsedData.from === VIPGIFTFROMUSER
                    ) {
                        const sender = Array.from(pendingSvipRequests.keys()).find(key =>
                            pendingSvipRequests.has(key)
                        );

                        if (sender) {
                            const imageUrl = parsedData.url;
                            sendMainMessage(parsedData.room, `✅ Image received successfully. Sending gift now...`);

                            storedImages.set(sender, imageUrl);

                            const { timeoutId } = pendingSvipRequests.get(sender);
                            clearTimeout(timeoutId); // إيقاف المؤقت بعد إرسال الصورة
                            pendingSvipRequests.delete(sender); // حذف الطلب بعد إرسال الصورة

                            // إرسال الصورة في جميع الغرف
                            const data = fs.readFileSync('rooms.json', 'utf8');
                            const roomsData = JSON.parse(data);
                            const rooms = roomsData.map(room => room.name);

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
                                sendMainMessage(ur, `🇸‌🇺‌🇵‌🇪‌🇷‌🏅 🇻‌🇮‌🇵‌ \n 𝔽ℝ𝕆𝕄 : [${sender}] 𝕋𝕆 : [${VIPGIFTTOUSER}]`);
                            }

                            // تحديث توقيت الإرسال الأخير
                            lastSendTime.set(sender, Date.now());
                        }
                    }



                    if (body.startsWith('.ps')) {
                        await handlePlayCommand(parsedData, socket);
                    }

                    if (
                        body.startsWith('love@') ||
                        body.startsWith('dislike@') ||
                        body.startsWith('com@') ||
                        body.startsWith('gift@')

                    ) {
                        handleSongFeedback(parsedData, socket);
                    }

         


                    else if (body === '🍎' || body === '🍊' || body === '🍌' || body === '🍉' || body === '🍓' || body === '🍇' || body === '🍍' || body === '🥭' || body === '🍑' || body === '🍈') {
                        // قائمة الإيموجيات الفاكهة المسموحة
                        const fruitEmojis = ['🍎', '🍊', '🍌', '🍉', '🍓', '🍇', '🍍', '🥭', '🍑', '🍈'];

                        // تحديد اللاعب بناءً على الاسم
                        const player = users.find(u => u.username === parsedData.from);

                        // التأكد من أن اللاعب موجود في النظام
                        if (player) {
                            // اختيار فاكهة عشوائية من القائمة
                            const randomFruit = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];

                            // إرسال نفس الفاكهة التي اختارها اللاعب (لتكون رد الفعل من النظام)
                            sendMainMessage(parsedData.room, ` ${randomFruit}`);

                            // التحقق إذا كانت الفاكهة التي أرسلها المستخدم تطابق الفاكهة التي أرسلها النظام
                            if (body === randomFruit) {
                                // إذا كانت الفاكهة متطابقة، يمنح اللاعب 1,000,000 نقطة
                                player.points += 1000000;  // إضافة 1,000,000 نقطة

                                // حفظ التحديثات في الملف
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                // إرسال رسالة الفوز
                                sendMainMessage(parsedData.room, `🎉 ${parsedData.from} is lucky! They win 1,000,000 points!`);
                            } else {
                                // إذا لم تكن الفاكهة متطابقة، يتم إرسال إيموجي مختلف
                                const unluckyEmoji = '❌'; // الإيموجي الذي سيرد به البوت إذا لم تكن الفاكهة متطابقة
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

                            // Arrays for always lucky and always unlucky users
                            const alwaysLuckyUsers = ["نِسـرِيـنــآ🔮🪄", "", ".", "", ""]; // أسماء المستخدمين الذين يكسبون دائمًا
                            const alwaysUnluckyUsers = ["", "", "", "", "", ""]; // أسماء المستخدمين الذين يخسرون دائمًا

                            // Check if the user is in the always lucky list
                            if (alwaysLuckyUsers.includes(respondingUser.username)) {
                                // حساب النقاط المكتسبة بنسبة 2%
                                const gainedPoints = Math.floor(respondingUser.points * 0.25);
                                respondingUser.points += gainedPoints;

                                // حفظ التحديثات في الملف
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                // إرسال رسالة للمستخدم
                                sendMainMessage(
                                    parsedData.room,
                                    `🎉 Lucky you! You won ${formatPoints(gainedPoints)} points! Your new balance: ${formatPoints(respondingUser.points)}.`
                                );
                                return;
                            }


                            // Check if the user is in the always unlucky list
                            if (alwaysUnluckyUsers.includes(respondingUser.username)) {
                                const lostPoints = Math.floor(respondingUser.points * 0.5);
                                respondingUser.points -= lostPoints;
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                sendMainMessage(
                                    parsedData.room,
                                    `😢 Unlucky! You lost ${formatPoints(lostPoints)} points. Your new balance: ${formatPoints(respondingUser.points)}.`
                                );
                                return;
                            }

                            // Determine the luck outcome for regular users
                            const goodLuck = Math.random() < 0.5; // 50% chance of good luck
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


                    else if (body === 'سحر') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastMagicUse = respondingUser.lastMagicUse || 0;
                            const interval = 5 * 60 * 1000; // كل 5 دقائق

                            if (currentTime - lastMagicUse < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `✨ يمكنك استخدام السحر مرة أخرى بعد ${Math.ceil((interval - (currentTime - lastMagicUse)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastMagicUse = currentTime;

                            const spells = ['تعاويذ الحظ', 'تعويذة الربح', 'تعاويذ السكينة', 'تعويذة الحماية'];
                            const chosenSpell = spells[Math.floor(Math.random() * spells.length)];

                            if (chosenSpell === 'تعاويذ الحظ') {
                                const luckBoost = Math.floor(Math.random() * 100) + 50;
                                respondingUser.points += luckBoost;

                                sendMainMessage(
                                    parsedData.room,
                                    `✨ استخدمت **تعاويذ الحظ**! حصلت على ${formatPoints(luckBoost)} نقطة إضافية. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );
                            } else if (chosenSpell === 'تعويذة الربح') {
                                const gain = Math.floor(Math.random() * 300) + 100;
                                respondingUser.points += gain;

                                sendMainMessage(
                                    parsedData.room,
                                    `✨ استخدمت **تعويذة الربح**! ربحت ${formatPoints(gain)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );
                            } else if (chosenSpell === 'تعاويذ السكينة') {
                                sendMainMessage(
                                    parsedData.room,
                                    `✨ استخدمت **تعاويذ السكينة**! لا أرباح ولكنك حافظت على رصيدك.`
                                );
                            } else {
                                sendMainMessage(
                                    parsedData.room,
                                    `✨ استخدمت **تعويذة الحماية**! لا خسائر لهذا الوقت.`
                                );
                            }

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        }
                    }

                    else if (body === 'قرض') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastLoanTime = respondingUser.lastLoanTime || 0;
                            const interval = 24 * 60 * 60 * 1000; // قرض مرة كل يوم

                            if (currentTime - lastLoanTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💳 لا يمكنك أخذ قرض الآن. حاول مرة أخرى غدًا.`
                                );
                                return;
                            }

                            respondingUser.lastLoanTime = currentTime;

                            const loanAmount = Math.floor(Math.random() * 500) + 100; // قرض بين 100 و 500
                            respondingUser.points += loanAmount;

                            sendMainMessage(
                                parsedData.room,
                                `💵 تم منحك قرضًا قدره ${formatPoints(loanAmount)} نقطة. يجب عليك سداده بعد يومين مع الفائدة!`
                            );

                            // إضافة فائدة بعد يومين
                            setTimeout(() => {
                                const interest = Math.floor(loanAmount * 0.1); // فائدة 10%
                                respondingUser.points -= (loanAmount + interest);

                                sendMainMessage(
                                    parsedData.room,
                                    `⏳ حان وقت سداد القرض! أضفنا فائدة قدرها ${formatPoints(interest)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );

                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                            }, 48 * 60 * 60 * 1000); // بعد يومين
                        }
                    }
                    else if (body === 'جائزة' || body === 'جائزه') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastPrizeTime = respondingUser.lastPrizeTime || 0;
                            const interval = 60 * 60 * 1000; // مرة كل ساعة

                            if (currentTime - lastPrizeTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🎁 حاول مرة أخرى بعد ساعة للحصول على الجائزة.`
                                );
                                return;
                            }

                            respondingUser.lastPrizeTime = currentTime;

                            const prizeType = Math.random(); // 50% فرصة لجائزة كبيرة أو صغيرة

                            if (prizeType < 0.1) {
                                const megaPrize = Math.floor(Math.random() * 1000) + 500; // جائزة ضخمة
                                respondingUser.points += megaPrize;

                                sendMainMessage(
                                    parsedData.room,
                                    `🎉 فزت بجائزة ضخمة! حصلت على ${formatPoints(megaPrize)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );
                            } else {
                                const smallPrize = Math.floor(Math.random() * 100) + 50; // جائزة صغيرة
                                respondingUser.points += smallPrize;

                                sendMainMessage(
                                    parsedData.room,
                                    `🎁 فزت بجائزة صغيرة! حصلت على ${formatPoints(smallPrize)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );
                            }

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        }
                    }
                    else if (body === 'أسهم' || body === 'اسهم') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastStocksTime = respondingUser.lastStocksTime || 0;
                            const interval = 10 * 60 * 1000; // كل 10 دقائق

                            if (currentTime - lastStocksTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `📉 لا يمكنك شراء أو بيع الأسهم الآن. حاول بعد ${Math.ceil((interval - (currentTime - lastStocksTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastStocksTime = currentTime;

                            const stockMarketUp = Math.random() < 0.5; // 50% احتمال السوق يرتفع

                            if (stockMarketUp) {
                                const profit = Math.floor(respondingUser.points * 0.2); // أرباح 20%
                                respondingUser.points += profit;

                                sendMainMessage(
                                    parsedData.room,
                                    `📈 تم بيع أسهمك بنجاح! ربحك ${formatPoints(profit)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );
                            } else {
                                const loss = Math.floor(respondingUser.points * 0.1); // خسارة 10%
                                respondingUser.points -= loss;

                                sendMainMessage(
                                    parsedData.room,
                                    `📉 تم بيع أسهمك ولكن خسرت ${formatPoints(loss)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );
                            }

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        }
                    }
                    else if (body === 'صفقة') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastDeal = respondingUser.lastDeal || 0;
                            const interval = 24 * 60 * 60 * 1000; // مرة كل 24 ساعة

                            if (currentTime - lastDeal < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🕒 لا يمكنك تنفيذ صفقة الآن. حاول غدًا.`
                                );
                                return;
                            }

                            respondingUser.lastDeal = currentTime;

                            const chance = Math.random();

                            if (chance < 0.1) {
                                const hugeGain = Math.floor(respondingUser.points * 2);
                                respondingUser.points += hugeGain;

                                sendMainMessage(
                                    parsedData.room,
                                    `🎯 صفقة العمر! ربحت ${formatPoints(hugeGain)} نقطة!`
                                );
                            } else {
                                const smallLoss = Math.floor(respondingUser.points * 0.1);
                                respondingUser.points -= smallLoss;

                                sendMainMessage(
                                    parsedData.room,
                                    `📉 الصفقة خاسرة. خسرت ${formatPoints(smallLoss)} نقطة.`
                                );
                            }

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        }
                    }
                    else if (body === 'بيتكوين') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastBTCAction = respondingUser.lastBTCAction || 0;
                            const interval = 12 * 60 * 60 * 1000; // مرتين يوميًا

                            if (currentTime - lastBTCAction < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🪙 السوق مغلق مؤقتًا. حاول بعد ${Math.ceil((interval - (currentTime - lastBTCAction)) / 60000 / 60)} ساعة.`
                                );
                                return;
                            }

                            respondingUser.lastBTCAction = currentTime;

                            const btcRate = Math.random(); // بين 0 و 1

                            if (btcRate < 0.4) {
                                const loss = Math.floor(respondingUser.points * 0.6);
                                respondingUser.points -= loss;

                                sendMainMessage(
                                    parsedData.room,
                                    `📉 البيتكوين انهار! خسرت ${formatPoints(loss)} نقطة.`
                                );
                            } else {
                                const gain = Math.floor(respondingUser.points * 0.9);
                                respondingUser.points += gain;

                                sendMainMessage(
                                    parsedData.room,
                                    `🚀 البيتكوين انفجر! ربحت ${formatPoints(gain)} نقطة.`
                                );
                            }

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        }
                    }
                    else if (body === 'خزنة') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastSafeTime = respondingUser.lastSafeTime || 0;
                            const interval = 60 * 60 * 1000; // كل ساعة

                            if (currentTime - lastSafeTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🔒 خزنتك لسه بتتجمع... افتحها بعد ${Math.ceil((interval - (currentTime - lastSafeTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastSafeTime = currentTime;

                            const storedPoints = Math.floor(Math.random() * 300) + 200; // من 200 إلى 500
                            respondingUser.points += storedPoints;

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                            sendMainMessage(
                                parsedData.room,
                                `💰 فتحت خزنتك وطلعتلك ${formatPoints(storedPoints)} نقطة! رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                            );
                        }
                    }
                    else if (body === 'تداول') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastTradeTime = respondingUser.lastTradeTime2 || 0;
                            const interval = 7 * 60 * 1000; // كل 7 دقائق

                            if (currentTime - lastTradeTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `⏳ لا يمكنك التداول الآن. حاول بعد ${Math.ceil((interval - (currentTime - lastTradeTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastTradeTime2 = currentTime;

                            const isProfit = Math.random() < 0.5;

                            if (isProfit) {
                                const gain = Math.floor(respondingUser.points * 0.3);
                                respondingUser.points += gain;

                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                sendMainMessage(
                                    parsedData.room,
                                    `📈 صفقة تداول ناجحة! ربحت ${formatPoints(gain)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                );
                            } else {
                                const loss = Math.floor(respondingUser.points * 0.2);
                                respondingUser.points -= loss;

                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                sendMainMessage(
                                    parsedData.room,
                                    `📉 التداول خذلك! خسرت ${formatPoints(loss)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                );
                            }
                        }
                    }
                    else if (body === 'مضاربة') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastTradeTime = respondingUser.lastTradeTime || 0;
                            const interval = 10 * 60 * 1000; // كل 10 دقائق فقط

                            if (currentTime - lastTradeTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🕒 لا يمكنك المضاربة الآن! حاول مرة أخرى بعد ${Math.ceil((interval - (currentTime - lastTradeTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastTradeTime = currentTime;

                            // إرسال رسالة الانتظار
                            sendMainMessage(parsedData.room, `⏳ جاري المضاربة، انتظر بضع ثوانٍ...`);

                            // تأخير النتيجة لمدة ثانيتين (2000 مللي ثانية)
                            setTimeout(() => {
                                const outcome = Math.random();

                                // تحديد الربح أو الخسارة بناءً على نسبة مئوية
                                let percentage;
                                if (outcome < 0.4) {
                                    // خسارة ضخمة (40% احتمال الخسارة)
                                    percentage = 0.7;  // 70% من النقاط خسارة
                                    const loss = Math.floor(respondingUser.points * percentage);
                                    respondingUser.points -= loss;

                                    sendMainMessage(
                                        parsedData.room,
                                        `📉 خسارة فادحة في المضاربة! خسرت ${formatPoints(loss)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    // ربح كبير (60% احتمال الربح)
                                    percentage = 1;  // 100% من النقاط ربح
                                    const profit = Math.floor(respondingUser.points * percentage);
                                    respondingUser.points += profit;

                                    sendMainMessage(
                                        parsedData.room,
                                        `🚀 صفقة ناجحة جدًا في المضاربة! ربحت ${formatPoints(profit)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                }

                                // تحديث بيانات المستخدم
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                            }, 2000); // تأخير النتيجة لمدة 2 ثانية
                        }
                    }

                    else if (body === 'بورصة') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return; // غير مسموح لغير الموثقين
                        }

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastStockTime = respondingUser.lastStockTime || 0;
                            const interval = 8 * 60 * 1000; // 8 دقائق

                            if (currentTime - lastStockTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `📉 السوق مغلق حاليًا! حاول مرة أخرى بعد ${Math.ceil((interval - (currentTime - lastStockTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastStockTime = currentTime;

                            // إرسال رسالة انتظار
                            sendMainMessage(parsedData.room, `⏳ جاري معالجة المضاربة في السوق، انتظر بضع ثوانٍ...`);

                            // تأخير النتيجة لمدة 2 ثانية
                            setTimeout(() => {
                                const marketMood = Math.random();

                                if (marketMood < 0.25) {
                                    // السوق منهار - خسارة كبيرة
                                    const loss = Math.floor(respondingUser.points * 0.6);
                                    respondingUser.points -= loss;

                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `📉 انهيار في السوق! خسرت ${formatPoints(loss)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (marketMood < 0.6) {
                                    // السوق هابط - خسارة بسيطة
                                    const loss = Math.floor(respondingUser.points * 0.2);
                                    respondingUser.points -= loss;

                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `📉 السوق هابط.. خسرت ${formatPoints(loss)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (marketMood < 0.85) {
                                    // السوق صاعد - ربح بسيط
                                    const gain = Math.floor(respondingUser.points * 0.3);
                                    respondingUser.points += gain;

                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `📈 السوق صاعد! ربحت ${formatPoints(gain)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    // السوق انفجر - ربح كبير
                                    const gain = Math.floor(respondingUser.points * 0.7);
                                    respondingUser.points += gain;

                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🚀 طفرة في السوق! ربحت ${formatPoints(gain)} نقطة بشكل ضخم! رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2000); // تأخير النتيجة لمدة 2 ثانية
                        }
                    }
                    else if (body === 'بانجو') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastTime = respondingUser.lastBangoTime || 0;
                            const interval = 5 * 60 * 1000; // 5 دقائق

                            if (currentTime - lastTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🌿 خلّص مفعول البانجو قبل ما ترجع! انتظر ${Math.ceil((interval - (currentTime - lastTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastBangoTime = currentTime;
                            sendMainMessage(parsedData.room, `😶‍🌫️ شغّلنا بانجو... ريّح بالك`);

                            setTimeout(() => {
                                const effect = Math.random();

                                if (effect < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.2);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🤣 قعدت تضحك على الشباك وخسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (effect < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.25);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😌 مزاجك ارتفع وفلوسك كمان! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.5);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌈 ضحك، هدوء، وإلهام! بانجو فاخر رفعك وربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2000);
                        }
                    }
                    else if (body === 'هيروين') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastTime = respondingUser.lastHeroinTime || 0;
                            const interval = 20 * 60 * 1000; // 20 دقيقة

                            if (currentTime - lastTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💉 جسمك مو قادر يتحمّل أكثر! ارجع بعد ${Math.ceil((interval - (currentTime - lastTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastHeroinTime = currentTime;
                            sendMainMessage(parsedData.room, `🩸 دخلت عالم الهيروين... استعد للهاوية أو للجنّة`);

                            setTimeout(() => {
                                const risk = Math.random();

                                if (risk < 0.15) {
                                    const loss = Math.floor(respondingUser.points * 0.8);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `☠️ جرعة زائدة! فقدت ${formatPoints(loss)} نقطة ووعيك بالكامل. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (risk < 0.4) {
                                    const loss = Math.floor(respondingUser.points * 0.3);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💤 انتقلت لسبات عميق وخسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (risk < 0.7) {
                                    const gain = Math.floor(respondingUser.points * 0.4);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌙 نشوة غريبة غمرتك! ربحت ${formatPoints(gain)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 1.2);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌌 انفتحت لك أبواب السكينة الأبدية! ربحت ${formatPoints(gain)} نقطة مرة وحدة! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3000);
                        }
                    }
                    else if (body === 'شابو') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastShaboTime = respondingUser.lastShaboTime || 0;
                            const interval = 20 * 60 * 1000; // 20 دقيقة

                            if (currentTime - lastShaboTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `⏳ شابو لا يعمل الآن! ارجع بعد ${Math.ceil((interval - (currentTime - lastShaboTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastShaboTime = currentTime;
                            sendMainMessage(parsedData.room, `⚡ بدأت مفعول شابو... الطاقة تتدفق في عروقك!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.35); // خسارة 35%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💥 الطاقة انفجرت خارج السيطرة! خسرت ${formatPoints(loss)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.45) {
                                    const loss = Math.floor(respondingUser.points * 0.15); // خسارة 15%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😓 شعرت بإرهاق مفاجئ وخسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.75) {
                                    const gain = Math.floor(respondingUser.points * 0.4); // ربح 40%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 شابو أعطاك دفعة هائلة! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.8); // ربح 80%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🚀 انطلقت كالصاروخ! شابو منحك ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3000); // تأخير 3 ثواني
                        }
                    }

                    else if (body === 'مخدرات') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastDrugUseTime = respondingUser.lastDrugUseTime || 0;
                            const interval = 30 * 60 * 1000; // 30 دقيقة

                            if (currentTime - lastDrugUseTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🧠 المخدرات دمرت تركيزك... لا يمكنك المحاولة مرة أخرى الآن! انتظر ${Math.ceil((interval - (currentTime - lastDrugUseTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastDrugUseTime = currentTime;
                            sendMainMessage(parsedData.room, `💊 لقد دخلت عالم المخدرات... هل ستخرج سالمًا؟`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.5); // خسارة 50%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `☠️ الإدمان سيطر عليك! خسرت ${formatPoints(loss)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.75) {
                                    const loss = Math.floor(respondingUser.points * 0.25); // خسارة 25%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😨 عشت كابوسًا نفسيًا! خسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.95) {
                                    const gain = Math.floor(respondingUser.points * 0.2); // ربح 20%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌈 شعور مؤقت بالسعادة... ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 1.0); // ربح 100% (نادرة جداً)
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌟 معجزة! خرجت من عالم المخدرات أقوى من قبل وربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3500); // تأخير 3.5 ثواني
                        }
                    }
                    else if (body === 'حقن') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastInjectionTime = respondingUser.lastInjectionTime || 0;
                            const interval = 25 * 60 * 1000; // 25 دقيقة

                            if (currentTime - lastInjectionTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💉 لا يمكنك استخدام الحقن الآن! انتظر ${Math.ceil((interval - (currentTime - lastInjectionTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastInjectionTime = currentTime;
                            sendMainMessage(parsedData.room, `🧬 تم حقنك بمادة غامضة... النتائج قد تكون مروعة أو مذهلة!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.4); // خسارة 40%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🩸 الحقنة سببت آثارًا جانبية حادة! خسرت ${formatPoints(loss)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.3); // ربح 30%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `⚡ شعرت بنشاط غير عادي! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.85) {
                                    const status = "🧟 تحولت إلى زومبي لمدة قصيرة... لا تأثير على نقاطك، لكن الجميع يهابك!";
                                    sendMainMessage(parsedData.room, status);
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.8); // ربح 80%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔮 الحقنة كانت مصلًا خارقًا! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3000); // تأخير 3 ثواني
                        }
                    }
                    else if (body === 'عملية') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastSurgeryTime = respondingUser.lastSurgeryTime || 0;
                            const interval = 40 * 60 * 1000; // 40 دقيقة

                            if (currentTime - lastSurgeryTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🏥 لا يمكنك الدخول لعملية جديدة الآن! انتظر ${Math.ceil((interval - (currentTime - lastSurgeryTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastSurgeryTime = currentTime;
                            sendMainMessage(parsedData.room, `🔪 دخلت غرفة العمليات... إنها عملية جراحية خطيرة، الجميع يترقب مصيرك!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.6); // خسارة 60%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💔 فشلت العملية! فقدت الكثير من النقاط (${formatPoints(loss)}). رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.6) {
                                    const loss = Math.floor(respondingUser.points * 0.3); // خسارة 30%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😷 العملية مرت بصعوبة وخسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.85) {
                                    const gain = Math.floor(respondingUser.points * 0.4); // ربح 40%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `✅ العملية نجحت! صحتك تحسنت وربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 1.2); // ربح 120%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌟 عملية نادرة جدًا وناجحة بشكل مذهل! ربحت ${formatPoints(gain)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 4000); // تأخير 4 ثواني
                        }
                    }
                    else if (body === 'جامد') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastLordTime = respondingUser.lastLordTime || 0;
                            const interval = 30 * 60 * 1000; // 30 دقيقة

                            if (currentTime - lastLordTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `👁️‍🗨️ الأتباع لا يُستدعون كثيرًا... انتظر ${Math.ceil((interval - (currentTime - lastLordTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastLordTime = currentTime;
                            sendMainMessage(parsedData.room, `🧞‍♂️ "جامد" استدعى أتباعه من الظلال... الجميع يركع لقوته.`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.3); // انقلاب الأتباع
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `⚔️ بعض الأتباع تمردوا عليك! خسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.25); // تنفيذ الأوامر بنجاح
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🗡️ الأتباع نفذوا أوامرك بدقة! ربحت ${formatPoints(gain)} نقطة.`
                                    );
                                } else if (chance < 0.9) {
                                    const gain = Math.floor(respondingUser.points * 0.6); // غزو ناجح
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🏴‍☠️ "جامد" غزا أراضي جديدة بأتباعه! ربحت ${formatPoints(gain)} نقطة.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 1.2); // سيطرة كاملة
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `👑 "جامد" أصبح سيد اللعبة بلا منازع! ربحت ${formatPoints(gain)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3500); // تأخير 3.5 ثواني
                        }
                    }
                    else if (body === 'ديناميت') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastDynamiteTime = respondingUser.lastDynamiteTime || 0;
                            const interval = 20 * 60 * 1000; // 20 دقيقة

                            if (currentTime - lastDynamiteTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🧨 الديناميت لا يُستخدم كثيرًا! انتظر ${Math.ceil((interval - (currentTime - lastDynamiteTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastDynamiteTime = currentTime;
                            sendMainMessage(parsedData.room, `💣 تم تفعيل الديناميت... العد التنازلي بدأ!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.25) {
                                    const loss = Math.floor(respondingUser.points * 0.5); // انفجار مدمر
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💥 الديناميت انفجر بين يديك! خسرت ${formatPoints(loss)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.2); // أضرار طفيفة
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 الانفجار جرحك قليلًا! خسرت ${formatPoints(loss)} نقطة.`
                                    );
                                } else if (chance < 0.8) {
                                    const gain = Math.floor(respondingUser.points * 0.3); // دمر أعداءه وربح
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💪 استخدمت الديناميت بذكاء! دمرت خصومك وربحت ${formatPoints(gain)} نقطة.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.7); // انفجار عبقري
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🎇 الديناميت فتح لك كنزًا! ربحت ${formatPoints(gain)} نقطة من قلب الدمار.`
                                    );
                                }
                            }, 3000); // تأخير 3 ثواني
                        }
                    }
                    else if (body === 'شيطان') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastDemonTime = respondingUser.lastDemonTime || 0;
                            const interval = 30 * 60 * 1000; // 30 دقيقة

                            if (currentTime - lastDemonTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `👿 الشيطان لا يُستدعى بسهولة! انتظر ${Math.ceil((interval - (currentTime - lastDemonTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastDemonTime = currentTime;
                            sendMainMessage(parsedData.room, `🩸 تم استدعاء الشيطان... الظلام يقترب، والهواء يثقل.`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.4); // لعنة شيطانية
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💀 الشيطان لعنك! خسرت ${formatPoints(loss)} نقطة في طقوس مظلمة.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.2); // صفقة شيطانية
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🤝 أبرمت صفقة مع الشيطان... ربحت ${formatPoints(gain)} نقطة، لكن بثمن مجهول.`
                                    );
                                } else if (chance < 0.85) {
                                    const gain = Math.floor(respondingUser.points * 0.5); // قوة مظلمة
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 قوة شيطانية تتدفق في عروقك! ربحت ${formatPoints(gain)} نقطة.`
                                    );
                                } else {
                                    const loss = Math.floor(respondingUser.points * 0.6); // خيانة شيطانية
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `👿 الشيطان خدعك! وعدك بالقوة وسلبك ${formatPoints(loss)} نقطة.`
                                    );
                                }
                            }, 4000); // تأخير 4 ثواني
                        }
                    }
                    else if (body === 'زرع') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastPlantTime = respondingUser.lastPlantTime || 0;
                            const interval = 15 * 60 * 1000; // 15 دقيقة

                            if (currentTime - lastPlantTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🌾 لقد زرعت مؤخرًا! انتظر ${Math.ceil((interval - (currentTime - lastPlantTime)) / 60000)} دقيقة قبل الزرع من جديد.`
                                );
                                return;
                            }

                            respondingUser.lastPlantTime = currentTime;

                            const baseGain = Math.floor(respondingUser.points * 0.2);
                            const harvestTime = 5 * 60 * 1000; // 5 دقائق حتى الحصاد

                            sendMainMessage(parsedData.room, `🌱 لقد زرعت بذرة الأمل! عُد بعد 5 دقائق لتحصد ما زرعت.`);

                            setTimeout(() => {
                                const success = Math.random();

                                if (success < 0.2) {
                                    sendMainMessage(parsedData.room, `🥀 للأسف، لم ينبت الزرع هذه المرة. حاول مرة أخرى لاحقًا.`);
                                } else {
                                    const gain = Math.floor(baseGain + Math.random() * baseGain); // من 100% إلى 200% من baseGain
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🌾 نمت بذرتك بنجاح! حصلت على ${formatPoints(gain)} نقطة كمكافأة على صبرك.`
                                    );
                                }
                            }, harvestTime);
                        }
                    }
                    else if (body === 'حصاد') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const plantedAt = respondingUser.plantedAt || 0;
                            const harvestDelay = 5 * 60 * 1000; // 5 دقائق بعد الزرع

                            const currentTime = Date.now();

                            if (!plantedAt || currentTime - plantedAt < harvestDelay) {
                                const remaining = Math.ceil((harvestDelay - (currentTime - plantedAt)) / 60000);
                                sendMainMessage(
                                    parsedData.room,
                                    `🌱 الزرع لم يحن حصاده بعد! عُد بعد ${remaining} دقيقة.`
                                );
                                return;
                            }

                            const baseGain = Math.floor(respondingUser.points * 0.15 + Math.random() * 30);
                            respondingUser.points += baseGain;
                            respondingUser.plantedAt = 0; // إعادة الضبط بعد الحصاد

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                            sendMainMessage(
                                parsedData.room,
                                `🌾 تم الحصاد! ربحت ${formatPoints(baseGain)} نقطة مقابل زراعتك الناجحة.`
                            );
                        }
                    }
                    else if (body === 'مسدس') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let shooter = users.find(user => user.username === parsedData.from);
                        if (shooter) {
                            const currentTime = Date.now();
                            const lastGunUse = shooter.lastGunUse || 0;
                            const interval = 15 * 60 * 1000; // 15 دقيقة

                            if (currentTime - lastGunUse < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🔫 مسدسك يحتاج لإعادة تعبئة! انتظر ${Math.ceil((interval - (currentTime - lastGunUse)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            shooter.lastGunUse = currentTime;

                            // اختر ضحية عشوائية من نفس الغرفة
                            const roomPlayers = users.filter(u => u.room === parsedData.room && u.username !== shooter.username);
                            if (roomPlayers.length === 0) {
                                sendMainMessage(parsedData.room, `🤷 لا يوجد أحد لتطلق عليه النار.`);
                                return;
                            }

                            const target = roomPlayers[Math.floor(Math.random() * roomPlayers.length)];

                            sendMainMessage(parsedData.room, `🔫 ${shooter.username} صوب المسدس نحو ${target.username}...`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const damage = Math.floor(target.points * 0.2);
                                    target.points -= damage;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💥 ${target.username} أُصيب! خسر ${formatPoints(damage)} نقطة.`
                                    );
                                } else if (chance < 0.5) {
                                    const ricochet = Math.floor(shooter.points * 0.15);
                                    shooter.points -= ricochet;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💣 ارتدت الرصاصة! ${shooter.username} خسر ${formatPoints(ricochet)} نقطة.`
                                    );
                                } else {
                                    const gain = Math.floor(shooter.points * 0.3);
                                    shooter.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🎯 طلقة ذكية! ${shooter.username} ربح ${formatPoints(gain)} نقطة لاحترافه استخدام المسدس.`
                                    );
                                }
                            }, 3000); // تأخير 3 ثوانٍ
                        }
                    }

                    else if (body === 'تفجير') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastExplosionTime = respondingUser.lastExplosionTime || 0;
                            const interval = 20 * 60 * 1000; // 20 دقيقة

                            if (currentTime - lastExplosionTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💣 التفجير يحتاج وقتًا للتجهيز! انتظر ${Math.ceil((interval - (currentTime - lastExplosionTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastExplosionTime = currentTime;
                            sendMainMessage(parsedData.room, `💥 تم تفعيل التفجير! الجميع في خطر...`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.4);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(parsedData.room, `🔥 التفجير ارتد عليك! خسرت ${formatPoints(loss)} نقطة.`);
                                } else if (chance < 0.6) {
                                    const others = users.filter(u => u.room === parsedData.room && u.username !== parsedData.from);
                                    others.forEach(player => {
                                        const loss = Math.floor(player.points * 0.1);
                                        player.points -= loss;
                                    });
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(parsedData.room, `💣 انفجار محدود! جميع اللاعبين الآخرين خسروا 10٪ من نقاطهم.`);
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.5);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(parsedData.room, `🚀 التفجير أتاح لك السيطرة! ربحت ${formatPoints(gain)} نقطة.`);
                                }
                            }, 3000); // تأخير 3 ثوانٍ
                        }
                    }
                    else if (body === 'سيف') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastSwordTime = respondingUser.lastSwordTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastSwordTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `⚔️ لا يمكنك استخدام السيف الآن! انتظر ${Math.ceil((interval - (currentTime - lastSwordTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastSwordTime = currentTime;
                            sendMainMessage(parsedData.room, `🗡️ أخرجت سيفك من غمده... الضربة قادمة!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.2); // فشل الضربة
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🩸 فشلت في تسديد الضربة! خسرت ${formatPoints(loss)} نقطة.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.25); // ضربة ناجحة
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💥 ضربة ناجحة! ربحت ${formatPoints(gain)} نقطة بسيفك.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.5); // ضربة أسطورية
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 سيفك قطع كل شيء في طريقه! ربحت ${formatPoints(gain)} نقطة. أنت محارب أسطوري الآن.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }

                    else if (body === 'افيون') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastOpiumTime = respondingUser.lastOpiumTime || 0;
                            const interval = 35 * 60 * 1000; // 35 دقيقة

                            if (currentTime - lastOpiumTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🌫️ لا يمكنك تعاطي الافيون الآن! انتظر ${Math.ceil((interval - (currentTime - lastOpiumTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastOpiumTime = currentTime;
                            sendMainMessage(parsedData.room, `😶‍🌫️ بدأت تشعر بالغموض... دخلت في عالم الافيون. لا أحد يعلم ما سيحدث.`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.4) {
                                    const loss = Math.floor(respondingUser.points * 0.45); // خسارة 45%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🕳️ ضعت في ضباب الافيون! خسرت ${formatPoints(loss)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.7) {
                                    const loss = Math.floor(respondingUser.points * 0.2); // خسارة 20%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌀 فقدت إحساسك بالزمن وخسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.9) {
                                    const gain = Math.floor(respondingUser.points * 0.25); // ربح 25%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌙 في هدوء الافيون... رأيت الرؤية بوضوح! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.9); // ربح 90%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💫 لحظة نادرة من الصفاء العقلي! الافيون كشف لك أسرار اللعبة. ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3500); // تأخير 3.5 ثواني
                        }
                    }
                    else if (body === 'حازم') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastHazemTime = respondingUser.lastHazemTime || 0;
                            const interval = 20 * 60 * 1000; // 20 دقيقة

                            if (currentTime - lastHazemTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🛡️ لا يمكنك استدعاء "حازم" الآن! انتظر ${Math.ceil((interval - (currentTime - lastHazemTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastHazemTime = currentTime;
                            sendMainMessage(parsedData.room, `⚔️ ظهر "حازم"... بطل القوة والحسم! استعدوا للسيطرة.`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.2); // خسارة 20% (نادرة)
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🩸 حتى الأبطال يُهزمون أحيانًا... "حازم" تعثر وخسرت ${formatPoints(loss)} نقطة.`
                                    );
                                } else if (chance < 0.5) {
                                    const gain = Math.floor(respondingUser.points * 0.4); // ربح 40%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🛡️ "حازم" دافع عنك ببسالة! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.8) {
                                    const gain = Math.floor(respondingUser.points * 0.7); // ربح 70%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💪 "حازم" سحق الخصوم! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 1.5); // ربح 150% (قوة أسطورية)
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 "حازم" أطلق قوته الخارقة! ربحت ${formatPoints(gain)} نقطة. أصبحت أسطورة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    else if (body === 'حسام') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastHossamTime = respondingUser.lastHossamTime || 0;
                            const interval = 25 * 60 * 1000; // 25 دقيقة

                            if (currentTime - lastHossamTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `📚 المحامي "حسام" مشغول بقضية أخرى! انتظر ${Math.ceil((interval - (currentTime - lastHossamTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastHossamTime = currentTime;
                            sendMainMessage(parsedData.room, `👨‍⚖️ المحامي "حسام" دخل قاعة المحكمة ليدافع عنك!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.25) {
                                    const loss = Math.floor(respondingUser.points * 0.3); // خسر القضية
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `❌ رغم دفاع "حسام"، خسر القضية! تم تغريمك ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.55) {
                                    sendMainMessage(
                                        parsedData.room,
                                        `✅ "حسام" دافع عنك ببراعة! تم إسقاط جميع التهم. لا خسائر ولا أرباح.`
                                    );
                                } else if (chance < 0.85) {
                                    const gain = Math.floor(respondingUser.points * 0.35); // ربح تعويض
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💼 "حسام" ربح القضية! حصلت على تعويض قدره ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.8); // ربح ضخم
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🏛️ "حسام" قلب المحكمة لصالحك! ربحت ${formatPoints(gain)} نقطة كتعويض تاريخي. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3000); // تأخير 3 ثواني
                        }
                    }
                    else if (body === 'مهند') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastMohanadTime = respondingUser.lastMohanadTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastMohanadTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🕊️ مهند مشغول بنشر الحنية الآن! عد بعد ${Math.ceil((interval - (currentTime - lastMohanadTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastMohanadTime = currentTime;
                            sendMainMessage(parsedData.room, `💖 لقد حضر مهند، رسول الحنية والسلام! استعد لفيض من المحبة!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const gain = Math.floor(respondingUser.points * 0.2); // ربح 20%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌸 مهند منحك لمسة حنان، فربحت ${formatPoints(gain)} نقطة! رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.4); // ربح 40%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌞 شعاع دفء من مهند! ربحك ${formatPoints(gain)} نقطة من الحنية. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.6); // ربح 60%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💫 مهند احتضنك بقلبه الكبير! ربحت ${formatPoints(gain)} نقطة بفضل الحنية والمحبة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    else if (body === 'بيره') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastBeeraTime = respondingUser.lastBeeraTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastBeeraTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🍺 بيره بتقولك "مش كل شويه تناديني!" 😅 انتظر ${Math.ceil((interval - (currentTime - lastBeeraTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastBeeraTime = currentTime;
                            sendMainMessage(parsedData.room, `🍻 بيره وصلت! الجو حلو والحياة مزاج 🎶`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.1); // خسارة 10%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😵 شربت شويه كتير؟ فقدت تركيزك وخسرت ${formatPoints(loss)} نقطة! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.2); // ربح 20%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😂 ضحك وهزار وبيره؟ ربحت ${formatPoints(gain)} نقطة من المزاج العالي! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.4); // ربح 40%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🎉 السهرة نار! بيره زودتك نشاط وربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    else if (body === 'ايمن') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastAymanTime = respondingUser.lastAymanTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastAymanTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🕊️ أيمن يقول لك: "الصبر مفتاح الفرج"... عد بعد ${Math.ceil((interval - (currentTime - lastAymanTime)) / 60000)} دقيقة لتنال الطمأنينة من جديد.`
                                );
                                return;
                            }

                            respondingUser.lastAymanTime = currentTime;
                            sendMainMessage(parsedData.room, `✨ جاء أيمن بنور الإيمان... أنصت لقلبك واستعد للسكينة.`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const gain = Math.floor(respondingUser.points * 0.15); // ربح 15%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌿 أيمن همس إليك: "ومن يتقِ الله يجعل له مخرجًا"... ربحت ${formatPoints(gain)} نقطة بالإيمان والصبر.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.25); // ربح 25%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `📿 في حضور أيمن، ارتفعت روحك وارتقى رصيدك بـ ${formatPoints(gain)} نقطة.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.5); // ربح 50%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌟 نور الإيمان أشرق في قلبك مع أيمن! ربحت ${formatPoints(gain)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    else if (body === 'خمره') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastKhmeraTime = respondingUser.lastKhmeraTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastKhmeraTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🍷 الخمره كانت قوية! اهدأ شويه ورجع بعد ${Math.ceil((interval - (currentTime - lastKhmeraTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastKhmeraTime = currentTime;
                            sendMainMessage(parsedData.room, `🍸 "الخمره" ليست الحل دائمًا! لكن استعد، شوية ضحك جاية في الطريق...`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.1); // خسارة 10%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😵‍💫 "هل شعرت بدوار؟"... خسرت ${formatPoints(loss)} نقطة بسبب الإفراط. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.2); // ربح 20%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🍸 "الخمره" كانت لطيفة اليوم... ربحت ${formatPoints(gain)} نقطة! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.4); // ربح 40%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🎉 "الليلة رائعة!"... ربحك ${formatPoints(gain)} نقطة بفضل المزاج العالي. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }



                    else if (body === 'فودكا') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastVodkaTime = respondingUser.lastVodkaTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastVodkaTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🧊 الفودكا تحتاج تبريد... ارجع بعد ${Math.ceil((interval - (currentTime - lastVodkaTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastVodkaTime = currentTime;
                            sendMainMessage(parsedData.room, `🍸 تم استدعاء "فودكا"... هل أنتم مستعدون للجنون؟`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.2); // خسارة 20%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🥴 أخذت رشفة زيادة عن اللزوم! خسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.25); // ربح 25%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 الفودكا أشعلت المزاج! ربحت ${formatPoints(gain)} نقطة.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.5); // ربح 50%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🎉 حفلة فودكا لا تُنسى! ربحت ${formatPoints(gain)} نقطة. مبروك يا مزاججي 😎.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    else if (body === 'ويسكي') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastWhiskyTime = respondingUser.lastWhiskyTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastWhiskyTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🥃 مزاج الويسكي يحتاج وقت... ارجع بعد ${Math.ceil((interval - (currentTime - lastWhiskyTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastWhiskyTime = currentTime;
                            sendMainMessage(parsedData.room, `🥴 شخص ما قال "ويسكي"... استعد لتأثير غريب!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.3) {
                                    const loss = Math.floor(respondingUser.points * 0.15); // خسارة 15%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💫 تدور بك الدنيا قليلاً... خسرت ${formatPoints(loss)} نقطة من المزاج المتهور!`
                                    );
                                } else if (chance < 0.6) {
                                    const gain = Math.floor(respondingUser.points * 0.2); // ربح 20%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🍻 "الويسكي" رفع معنوياتك! ربحت ${formatPoints(gain)} نقطة.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.4); // ربح 40%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 سهره نارية! الويسكي حرّك الحماس، وربحت ${formatPoints(gain)} نقطة.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    else if (body === 'رامي' || body === 'رامى') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;
                    
                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastRamiTime = respondingUser.lastRamiTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق
                    
                            if (currentTime - lastRamiTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🚫 رامي مشغول حاليًا... تعال بعد ${Math.ceil((interval - (currentTime - lastRamiTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }
                    
                            respondingUser.lastRamiTime = currentTime;
                            sendMainMessage(parsedData.room, `🍷 رامي بدأ يشرب شيئًا مشبوهًا...`);
                    
                            setTimeout(() => {
                                const chance = Math.random();
                    
                                if (chance < 0.25) {
                                    const loss = Math.floor(respondingUser.points * 0.3); // خسارة 30%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💊 رامي دخل في غيبوبة! خسرت ${formatPoints(loss)} نقطة بسبب الجرعة الزائدة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.5) {
                                    sendMainMessage(
                                        parsedData.room,
                                        `🤪 رامي بدأ يرقص مع الأشباح! لا خسارة ولا ربح، فقط جنون مؤقت...`
                                    );
                                } else if (chance < 0.75) {
                                    const gain = Math.floor(respondingUser.points * 0.25); // ربح 25%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🧠 رامي رأى الحقيقة في الهلوسة! ربح ${formatPoints(gain)} نقطة من تجربة فلسفية. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.5); // ربح 50%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 رامي اكتشف تركيبة سرية! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    
                    else if (body === 'كاجو') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;
                    
                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastKajoTime = respondingUser.lastKajoTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق
                    
                            if (currentTime - lastKajoTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💪 كاجو لا يُستدعى بهذه السرعة! ارجع بعد ${Math.ceil((interval - (currentTime - lastKajoTime)) / 60000)} دقيقة لتزيد من قوتك.`
                                );
                                return;
                            }
                    
                            respondingUser.lastKajoTime = currentTime;
                            sendMainMessage(parsedData.room, `🏋️‍♂️ استعد! كاجو قادم ليختبر قوتك، هل عضلاتك جاهزة؟`);
                    
                            setTimeout(() => {
                                const chance = Math.random();
                    
                                if (chance < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.4); // خسارة 40%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😤 رفعت أكثر من طاقتك! خسرت ${formatPoints(loss)} نقطة بسبب إجهاد العضلات. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.2); // خسارة 20%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌀 تعثرت في تمرين القرفصاء! خسرت ${formatPoints(loss)} نقطة. لا تيأس! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.8) {
                                    const gain = Math.floor(respondingUser.points * 0.3); // ربح 30%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 كاجو أعجب بعضلاتك! ربحت ${formatPoints(gain)} نقطة. رصيدك الجديد: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.6); // ربح 60%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🏆 كاجو منحك طاقة خارقة! ربحت ${formatPoints(gain)} نقطة في تحدي الحديد. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    
                    else if (body === 'عبده') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastAbduhTime = respondingUser.lastAbduhTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastAbduhTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💀 عبده لا يظهر إلا بعد مرور الوقت! ارجع بعد ${Math.ceil((interval - (currentTime - lastAbduhTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastAbduhTime = currentTime;
                            sendMainMessage(parsedData.room, `👻 تأهب! عبده قادم، هل أنت مستعد للظلام؟`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.4); // خسارة 40%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💀 في عالم عبده، سحبك الظلام إلى مكان مجهول! خسرت ${formatPoints(loss)} نقطة في تجربة مرعبة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.2); // خسارة 20%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `👻 رأيت ظل عبده يلاحقك! خسرت ${formatPoints(loss)} نقطة بسبب الرعب. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.8) {
                                    const gain = Math.floor(respondingUser.points * 0.3); // ربح 30%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🌑 في ظلام عبده، وجدت طريقًا نحو الأمان! ربحك ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.6); // ربح 60%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `👹 عبده منحك قوة مظلمة! ربحت ${formatPoints(gain)} نقطة من خلال الرعب. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // تأخير 2.5 ثانية
                        }
                    }
                    else if (body === 'كوكايين') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastDrugTime = respondingUser.lastDrugTime || 0;
                            const interval = 15 * 60 * 1000; // 15 دقيقة

                            if (currentTime - lastDrugTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🚫 لا يمكنك استخدام الكوكايين الآن! انتظر ${Math.ceil((interval - (currentTime - lastDrugTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastDrugTime = currentTime;
                            sendMainMessage(parsedData.room, `💉 لقد استخدمت الكوكايين... الأمور بدأت تخرج عن السيطرة!`);

                            setTimeout(() => {
                                const chance = Math.random();

                                if (chance < 0.25) {
                                    const loss = Math.floor(respondingUser.points * 0.5); // خسارة 50%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💔 جرعة زائدة! خسرت ${formatPoints(loss)} نقطة. رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.25); // خسارة 25%
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😵 شعرت بالدوار وخسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (chance < 0.75) {
                                    const gain = Math.floor(respondingUser.points * 0.35); // ربح 35%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🚀 نشوة مؤقتة! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.7); // ربح 70%
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 أنت في قمة النشاط! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2000); // تأخير 2 ثانية
                        }
                    }

                    else if (body === 'استروكس') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastAstroxTime = respondingUser.lastAstroxTime || 0;
                            const interval = 25 * 60 * 1000; // 25 دقيقة

                            if (currentTime - lastAstroxTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💥 انت لسه تحت تأثير الاستروكس! ارجع بعد ${Math.ceil((interval - (currentTime - lastAstroxTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastAstroxTime = currentTime;
                            sendMainMessage(parsedData.room, `⚡️ تأثير الاستروكس بيشتغل، استعد لشيء غير متوقع`);

                            setTimeout(() => {
                                const fate = Math.random();

                                if (fate < 0.1) {
                                    const loss = Math.floor(respondingUser.points * 0.9);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💀 استروكس أخذك إلى الهاوية! خسرت ${formatPoints(loss)} نقطة بشكل مفاجئ. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (fate < 0.4) {
                                    const loss = Math.floor(respondingUser.points * 0.4);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `😵‍💫 تأثير الاستروكس ضربك! خسرت ${formatPoints(loss)} نقطة وأنت مش فاهم ليه. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (fate < 0.7) {
                                    const gain = Math.floor(respondingUser.points * 0.5);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💥 تأثير قوي! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 1.5);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🚀 تجربة استروكس أسطورية! طرت في الفضاء وربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3000); // تأخير 3 ثواني
                        }
                    }


                    else if (body === 'تامول') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastTamolTime = respondingUser.lastTamolTime || 0;
                            const interval = 15 * 60 * 1000; // 15 دقيقة

                            if (currentTime - lastTamolTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💊 لا يمكن تناول التامول الآن! حاول مرة أخرى بعد ${Math.ceil((interval - (currentTime - lastTamolTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastTamolTime = currentTime;
                            sendMainMessage(parsedData.room, `💥 تناولت التامول... هل ستظل ثابتًا أم ستفقد الوعي؟`);

                            setTimeout(() => {
                                const effect = Math.random();

                                if (effect < 0.1) {
                                    const loss = Math.floor(respondingUser.points * 0.7);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💀 التامول أخذك في دوامة! خسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (effect < 0.4) {
                                    const loss = Math.floor(respondingUser.points * 0.4);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💊 التامول أثر عليك بشكل غريب... خسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (effect < 0.7) {
                                    const gain = Math.floor(respondingUser.points * 0.3);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `💫 التامول رفع من مزاجك! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.5);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                    sendMainMessage(
                                        parsedData.room,
                                        `🚀 تأثير التامول كان قويًا! ربحت ${formatPoints(gain)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 3000); // تأخير 3 ثواني
                        }
                    }
                    else if (body === 'خناقه' || body === 'خناقة') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastFightTime = respondingUser.lastFightTime || 0;
                            const interval = 8 * 60 * 1000; // 8 دقائق

                            if (currentTime - lastFightTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💥 الخناقة لسه جديدة، مش وقته دلوقتي! خلي الساحة لغيرك وارجع بعد ${Math.ceil((interval - (currentTime - lastFightTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastFightTime = currentTime;
                            sendMainMessage(parsedData.room, `💥 بدأت الخناقة! يا ترى مين اللي هيكسب؟`);

                            setTimeout(() => {
                                const result = Math.random();
                                const pointsAtStake = respondingUser.points; // الحصول على نقاط اللاعب

                                if (result < 0.3) {
                                    const lossPercentage = 0.3; // خسارة 30%
                                    const loss = Math.floor(pointsAtStake * lossPercentage);
                                    respondingUser.points -= loss;
                                    sendMainMessage(
                                        parsedData.room,
                                        `🤬 الخناقة كانت عنيفة! للأسف، خسر اللاعب وخصمنا منه ${loss}% من رصيده. خسارة ${formatPoints(loss)} نقطة! 💔`
                                    );
                                } else if (result < 0.6) {
                                    const lossPercentage = 0.1; // خسارة 10%
                                    const loss = Math.floor(pointsAtStake * lossPercentage);
                                    respondingUser.points -= loss;
                                    sendMainMessage(
                                        parsedData.room,
                                        `💣 الخناقة انتهت بخسارة صغيرة! خسر اللاعب ${loss}% من رصيده. خسر ${formatPoints(loss)} نقطة.`
                                    );
                                } else if (result < 0.85) {
                                    const gainPercentage = 0.1; // ربح 10%
                                    const gain = Math.floor(pointsAtStake * gainPercentage);
                                    respondingUser.points += gain;
                                    sendMainMessage(
                                        parsedData.room,
                                        `👐 كانت خناقة غريبة... لكن في الآخر، اللاعب خرج رابحًا بـ ${gain}% من رصيده. ربح ${formatPoints(gain)} نقطة! 😎`
                                    );
                                } else {
                                    const gainPercentage = 0.3; // ربح 30%
                                    const gain = Math.floor(pointsAtStake * gainPercentage);
                                    respondingUser.points += gain;
                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 انفجار في الخناقة! اللاعب فاز بأداء رائع، وربح ${gain}% من رصيده. ربح ${formatPoints(gain)} نقطة! 💪`
                                    );
                                }
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                            }, 2000); // تأخير 2 ثواني
                        }
                    }

                    else if (body === 'حشيش') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return; // غير مسموح لغير الموثقين
                        }

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastWeedTime = respondingUser.lastWeedTime || 0;
                            const interval = 8 * 60 * 1000; // 8 دقائق

                            if (currentTime - lastWeedTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `😵‍💫 لسه الريحة ما راحت! ارجع بعد ${Math.ceil((interval - (currentTime - lastWeedTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastWeedTime = currentTime;

                            sendMainMessage(parsedData.room, `🌿 شغّلنا الرواق... دخّن واستعد للمصير!`);

                            setTimeout(() => {
                                const luck = Math.random();

                                if (luck < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.5);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `💥 نوبة هلع!! فقدت السيطرة وخسرت ${formatPoints(loss)} نقطة! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (luck < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.15);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🤤 جلست تضحك عالحيطة وخسرت ${formatPoints(loss)} نقطة وانت مش داري! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (luck < 0.8) {
                                    const gain = Math.floor(respondingUser.points * 0.25);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `😎 طلعت لك نكتة غيرت مزاجك! ربحت ${formatPoints(gain)} نقطة وانت تضحك! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.6);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🚀 وصلت كوكب المريخ وانت مروق! انفجرت أرباحك وربحت ${formatPoints(gain)} نقطة! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2000);
                        }
                    }
                    else if (body === 'صيد') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return; // غير مسموح لغير الموثقين
                        }

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastWeedTime = respondingUser.lastWeedTime || 0;
                            const interval = 8 * 60 * 1000; // 8 دقائق

                            if (currentTime - lastWeedTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🦈 لسه مش جاهز للصيد؟ ارجع بعد ${Math.ceil((interval - (currentTime - lastWeedTime)) / 60000)} دقيقة عشان تصطاد!`
                                );
                                return;
                            }

                            respondingUser.lastWeedTime = currentTime;

                            sendMainMessage(parsedData.room, `🎣 استعد لصيد بعض الغنائم! رحلتك بدأت!`);

                            setTimeout(() => {
                                const luck = Math.random();

                                if (luck < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.5);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `💔 الصيد ما كانش موفق! خسرت ${formatPoints(loss)} فلوس! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (luck < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.15);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🐟 الصياد فشل! فقدت ${formatPoints(loss)} فلوس بسبب الطُعم الغلط! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (luck < 0.8) {
                                    const gain = Math.floor(respondingUser.points * 0.25);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🐠 قمت بصيد سمكة جيدة! ربحت ${formatPoints(gain)} فلوس! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.6);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🦈 الصيد كان ناجح جدًا! اصطدت سمكة عملاقة وربحت ${formatPoints(gain)} فلوس! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2000);
                        }
                    }
                    else if (body === 'shot') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return; // غير مسموح لغير الموثقين
                        }

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastShotTime = respondingUser.lastShotTime || 0;
                            const interval = 5 * 60 * 1000; // 5 دقائق

                            if (currentTime - lastShotTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🎯 مش قادر تطلق الآن! ارجع بعد ${Math.ceil((interval - (currentTime - lastShotTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastShotTime = currentTime;

                            // قائمة الحيوانات للاصطياد
                            const animals = [
                                'أسد', 'نمر', 'دب', 'غزال', 'طائر', 'سمكة', 'تمساح', 'قرد', 'فهد', 'أرنب', 'خروف', 'زرافة',
                                'وحش البحر', 'دب قطبي', 'تنين', 'سلحفاة', 'عقاب', 'بومة', 'وحيد القرن', 'فأر', 'بطة', 'حمار وحشي',
                                'طائر النسر', 'دجاجة', 'غوريلا', 'قطة', 'كلب', 'حصان', 'قنديل البحر', 'أفعى', 'سحلية', 'توتو', 'خفاش',
                                'بطة', 'ضفدع', 'دودة', 'ذئب', 'جمل', 'فاكين', 'راكون'
                            ];

                            const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
                            sendMainMessage(parsedData.room, `🎯 أطلقت النار! استعد للـ "صيد" وحظك مع: ${randomAnimal}`);

                            setTimeout(() => {
                                const luck = Math.random();

                                if (luck < 0.2) {
                                    const loss = Math.floor(respondingUser.points * 0.5);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `💥 لم تتمكن من إصابة الهدف! فقدت ${formatPoints(loss)} فلوس! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (luck < 0.5) {
                                    const loss = Math.floor(respondingUser.points * 0.15);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `😵 أطلقت ولكن لم تكن الإصابة دقيقة! خسرت ${formatPoints(loss)} فلوس! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (luck < 0.8) {
                                    const gain = Math.floor(respondingUser.points * 0.25);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🏆 اصبت الهدف بشكل رائع! حصلت على ${formatPoints(gain)} فلوس! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.6);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 إصابتك كانت دقيقة جدًا! حصلت على أرباح ضخمة من: ${randomAnimal}! ربحك: ${formatPoints(gain)} فلوس! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2000);
                        }
                    }

                    else if (body === 'ديلر') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return; // غير مسموح لغير الموثقين
                        }

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastDealerTime = respondingUser.lastDealerTime || 0;
                            const interval = 10 * 60 * 1000; // 10 دقائق

                            if (currentTime - lastDealerTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `💼 الديلر مشغول بصفقة ثانية.. ارجع بعد ${Math.ceil((interval - (currentTime - lastDealerTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastDealerTime = currentTime;

                            sendMainMessage(parsedData.room, `🔄 جاري التفاوض مع الديلر... الصبر مفتاح الربح أو الندم!`);

                            setTimeout(() => {
                                const outcome = Math.random();

                                if (outcome < 0.15) {
                                    const loss = Math.floor(respondingUser.points * 0.6);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `💣 الديلر نصب عليك وسحب الشنطة! خسرت ${formatPoints(loss)} نقطة! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (outcome < 0.45) {
                                    const loss = Math.floor(respondingUser.points * 0.2);
                                    respondingUser.points -= loss;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🤦‍♂️ طلعت الصفقة مغشوشة وخسرت ${formatPoints(loss)} نقطة. رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else if (outcome < 0.75) {
                                    const gain = Math.floor(respondingUser.points * 0.4);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `💸 صفقة ناجحة! ربحت ${formatPoints(gain)} نقطة من تحت الطاولة! رصيدك: ${formatPoints(respondingUser.points)}.`
                                    );
                                } else {
                                    const gain = Math.floor(respondingUser.points * 0.8);
                                    respondingUser.points += gain;
                                    fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                    sendMainMessage(
                                        parsedData.room,
                                        `🔥 الديلر أعطاك صفقة العمر! ربحت ${formatPoints(gain)} نقطة دفعة وحدة! رصيدك الآن: ${formatPoints(respondingUser.points)}.`
                                    );
                                }
                            }, 2500); // 2.5 ثانية انتظار
                        }
                    }

                    else if (body === 'محفظة') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastWalletTime = respondingUser.lastWalletTime || 0;
                            const interval = 15 * 60 * 1000; // مرة كل 15 دقيقة

                            if (currentTime - lastWalletTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🧾 لا يمكنك تحصيل أرباح المحفظة الآن. حاول مرة أخرى بعد ${Math.ceil((interval - (currentTime - lastWalletTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            if (respondingUser.points < 500) {
                                sendMainMessage(
                                    parsedData.room,
                                    `⚠️ تحتاج إلى 500 نقطة على الأقل لتفعيل المحفظة وجني الأرباح.`
                                );
                                return;
                            }

                            respondingUser.lastWalletTime = currentTime;

                            // إرسال رسالة انتظار
                            sendMainMessage(parsedData.room, `⏳ جاري حساب أرباح المحفظة، انتظر بضع ثوانٍ...`);

                            // تأخير النتيجة لمدة 2 ثانية
                            setTimeout(() => {
                                const profit = Math.floor(respondingUser.points * 0.1); // 10% أرباح
                                respondingUser.points += profit;

                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                sendMainMessage(
                                    parsedData.room,
                                    `💼 أرباح محفظتك وصلت! ربحت ${formatPoints(profit)} نقطة. رصيدك الحالي: ${formatPoints(respondingUser.points)}.`
                                );
                            }, 2000); // تأخير النتيجة لمدة 2 ثانية
                        }
                    }



                    else if (body === 'مخزون') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastInventoryTime = respondingUser.lastInventoryTime || 0;
                            const interval = 30 * 60 * 1000; // كل 30 دقيقة

                            if (currentTime - lastInventoryTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🛒 مخزونك سيتم تحديثه قريبًا. حاول بعد ${Math.ceil((interval - (currentTime - lastInventoryTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastInventoryTime = currentTime;

                            // إرسال رسالة انتظار
                            sendMainMessage(parsedData.room, `⏳ جاري تحديث المخزون، انتظر بضع ثوانٍ...`);

                            // تأخير النتيجة لمدة 2 ثانية
                            setTimeout(() => {
                                const items = ['مفتاح سحري', 'قوة سحرية', 'مضاعف نقاط', 'درع حصين', 'خاتم حظ'];
                                const randomItem = items[Math.floor(Math.random() * items.length)];

                                sendMainMessage(
                                    parsedData.room,
                                    `🛍️ لقد حصلت على عنصر جديد في مخزونك: **${randomItem}**!`
                                );

                                // يمكن للمستخدم استخدام العنصر لاحقًا
                                respondingUser.inventory = respondingUser.inventory || [];
                                respondingUser.inventory.push(randomItem);

                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                            }, 2000); // تأخير النتيجة لمدة 2 ثانية
                        }
                    }

                    else if (body.startsWith('مراهنة@')) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            const currentTime = Date.now();
                            const lastBetTime = respondingUser.lastBetTime || 0;
                            const interval = 10 * 60 * 1000; // كل 10 دقائق

                            if (currentTime - lastBetTime < interval) {
                                sendMainMessage(
                                    parsedData.room,
                                    `🎲 يمكنك المراهنة مجددًا بعد ${Math.ceil((interval - (currentTime - lastBetTime)) / 60000)} دقيقة.`
                                );
                                return;
                            }

                            respondingUser.lastBetTime = currentTime;

                            // استخراج المبلغ بعد كلمة "مراهنة@"
                            const betAmount = parseInt(body.split('@')[1]);

                            // التأكد من أن المبلغ مناسب
                            if (isNaN(betAmount) || betAmount <= 0) {
                                sendMainMessage(parsedData.room, `❌ يجب عليك تحديد مبلغ صحيح للمراهنة.`);
                                return;
                            }

                            // التحقق من وجود رصيد كافٍ
                            if (respondingUser.points < betAmount) {
                                sendMainMessage(parsedData.room, `💸 ليس لديك ما يكفي من النقاط للمراهنة!`);
                                return;
                            }

                            // إرسال رسالة انتظار للمستخدم
                            sendMainMessage(parsedData.room, `⏳ جاري المراهنة، انتظر بضع ثوانٍ...`);

                            // تأخير النتيجة لمدة ثانيتين (2000 مللي ثانية)
                            setTimeout(() => {
                                // إجراء المراهنة: 50% احتمال الفوز
                                const win = Math.random() < 0.5;

                                if (win) {
                                    const winnings = betAmount * 2; // ربح مضاعف
                                    respondingUser.points += winnings;

                                    sendMainMessage(
                                        parsedData.room,
                                        `🎉 مبارك! فزت بمراهناتك وربحت **${formatPoints(winnings)}** نقطة! 💰 رصيدك الحالي: ${formatPoints(respondingUser.points)}`
                                    );
                                } else {
                                    respondingUser.points -= betAmount;

                                    sendMainMessage(
                                        parsedData.room,
                                        `😢 خسرت المراهنة! تم خصم **${formatPoints(betAmount)}** نقطة من رصيدك. 💸 رصيدك الحالي: ${formatPoints(respondingUser.points)}`
                                    );
                                }

                                // تحديث بيانات المستخدم
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                            }, 2000); // التأخير لمدة ثانيتين
                        }
                    }
                    // معرفة الهدايا الخاصة بالمستخدم
                    else if (body === 'myGifts') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            const gifts = sender.myGifts;

                            if (!gifts || Object.keys(gifts).length === 0) {
                                sendMainMessage(parsedData.room, '🎁 ليس لديك أي هدايا حالياً.');
                                return;
                            }

                            let giftsList = '🎁 هداياك:\n\n';
                            for (const giftNumber in gifts) {
                                const giftData = gifts[giftNumber];
                                const { emoji, desc } = giftData.gift;
                                const count = giftData.count;
                                const giftCode = giftNumber; // كود الهدية

                                giftsList += `${giftCode} - ${emoji} × ${count}\n`;
                            }

                            sendMainMessage(parsedData.room, giftsList);
                        }
                    }




                    // عرض قائمة الهدايا
                    else if (body === '.lp') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            let message = '📦 قائمة الهدايا المتاحة:\n';
                            for (let [id, data] of Object.entries(giftPrices)) {
                                message += `${id}. ${data.emoji} = ${formatPoints(data.price)}\n`;
                            }

                            message += `\n🎁 لإرسال هدية، استخدم الأمر:\nsg@اسم_المستخدم@رقم_الهدية\nمثال: \`sg@sara@15\``;

                            sendMainMessage(parsedData.room, message);

                            sender.availableGifts = giftPrices;
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        }
                    }

                    //////////////////////////////////////////////////////////////////
                    // إرسال هدية لشخص آخر
                    else if (body.startsWith('sg@')) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            const [command, recipientUsername, giftNumber, quantity] = body.split('@');
                            const giftNumberInt = parseInt(giftNumber);
                            const quantityInt = quantity ? parseInt(quantity) : 1;  // إذا لم يتم تحديد العدد، يتم اعتبارها هدية واحدة

                            if (!giftNumberInt || giftNumberInt < 1 || giftNumberInt > 37) {
                                sendMainMessage(parsedData.room, '❌ الرقم المدخل غير صحيح. اختر رقمًا من 1 إلى 37.');
                                return;
                            }

                            if (isNaN(quantityInt) || quantityInt < 1) {
                                sendMainMessage(parsedData.room, '❌ الرجاء تحديد عدد الهدايا بشكل صحيح.');
                                return;
                            }

                            const gift = sender.myGifts && sender.myGifts[giftNumberInt]?.gift;
                            if (!gift) {
                                sendMainMessage(parsedData.room, '❌ لا يمكنك إرسال هذه الهدية. تحقق من قائمة الهدايا.');
                                return;
                            }

                            if (sender.myGifts[giftNumberInt].count < quantityInt) {
                                sendMainMessage(parsedData.room, `❌ لا تملك عدد كافي من هذه الهدية. لديك فقط ${sender.myGifts[giftNumberInt].count} هدايا.`);
                                return;
                            }

                            // خصم الهدايا من قائمة المرسل
                            sender.myGifts[giftNumberInt].count -= quantityInt;

                            // إضافة الهدايا للمستقبل
                            let recipient = users.find(user => user.username === recipientUsername);
                            if (!recipient) {
                                sendMainMessage(parsedData.room, '❌ المستخدم غير موجود.');
                                return;
                            }

                            if (!recipient.myGifts) {
                                recipient.myGifts = {};
                            }

                            if (!recipient.myGifts[giftNumberInt]) {
                                recipient.myGifts[giftNumberInt] = { gift, count: quantityInt };
                            } else {
                                recipient.myGifts[giftNumberInt].count += quantityInt;
                            }

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                            // إرسال رسالة في الغرفة العامة
                            sendMainMessage(parsedData.room, `🎁 تم إرسال ${quantityInt} هدية بنجاح إلى ${recipient.username}: ${gift.emoji} (${gift.desc})`);

                            // إرسال رسالة خاصة للمستقبل
                            const recipientMessage = `🎁 تم إرسال ${quantityInt} هدية إليك من قبل ${sender.username}: ${gift.emoji} (${gift.desc}).`;
                            const recipientPrivateMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2', // معرف الرسالة
                                to: recipient.username, // المستخدم المستلم
                                body: recipientMessage,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(recipientPrivateMessage));

                            // إرسال رسالة خاصة للمُرسل
                            const senderMessage = `🎁 لقد قمت بإرسال ${quantityInt} هدية بنجاح إلى ${recipient.username}: ${gift.emoji} (${gift.desc}).`;
                            const senderPrivateMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2', // معرف الرسالة
                                to: sender.username, // المستخدم المرسل
                                body: senderMessage,
                                type: 'text'
                            };
                            socket.send(JSON.stringify(senderPrivateMessage));
                            const data = fs.readFileSync('rooms.json', 'utf8');
                            const roomsData = JSON.parse(data);
                            const rooms = roomsData.map(room => room.name);

                            // الحصول على الوقت الحالي بتنسيق hh:mm AM/PM
                            const now = new Date();
                            const hours = now.getHours() % 12 || 12;
                            const minutes = now.getMinutes().toString().padStart(2, '0');
                            const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                            const currentTime = `${hours}:${minutes} ${ampm}`;

                            rooms.forEach(room => {
                                // إرسال الرسالة دائمًا باللغة الإنجليزية ومن اليسار
                                const message = `🎁 Gift Transfer
\n${sender.username} 
➡️ ${gift.emoji} 
➡️ ${recipient.username}\n
🕒 At ${currentTime}`;

                                // إرسال الرسالة مع التأكد من أن النص يبدأ من اليسار
                                sendMainMessage(room, `\u200E${message}`); // \u200E هو رمز "Left-to-Right Mark"
                            });

                        }
                    }

                    else if (body.startsWith('@')) {
                        // استخراج الاسم بعد "@" والنص الخاص بالرسالة
                        const [command, ...rest] = body.split(' ');  // يتم التقسيم بناءً على الفضاءات
                        const recipientUsername = command.slice(1);  // إزالة @ من الاسم
                        const message = rest.join(' ');  // دمج باقي النص كرسالة

                        // إرسال الرسالة الخاصة للمستلم
                        const privateMessage = {
                            handler: 'chat_message',
                            id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',  // معرف الرسالة
                            to: recipientUsername,  // المستخدم المستلم
                            body: `📩 You have received a message from ${parsedData.from}: "${message}"`,  // نص الرسالة مع اسم المرسل
                            type: 'text'
                        };

                        socket.send(JSON.stringify(privateMessage));

                        // إرسال رسالة تأكيد للمُرسل في الغرفة
                        sendMainMessage(parsedData.room, `✅ Message sent to @${recipientUsername}.`);
                    }


                    else if (body.startsWith('flood@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "𝚞𝚕𝚝𝚛𝚊♂")) {
                        const parts = body.split('@');

                        if (parts.length < 3) {
                            sendMainMessage(parsedData.room, "❌ تنسيق غير صالح. استخدم: flood@username@message");
                            return;
                        }

                        const recipientUsername = parts[1]?.trim();
                        const message = parts.slice(2).join('@').trim();

                        if (!recipientUsername || !message) {
                            sendMainMessage(parsedData.room, "❌ يرجى تحديد اسم المستخدم والرسالة بشكل صحيح.");
                            return;
                        }

                        let count = 0;
                        const maxMessages = 10; // عدد الرسائل
                        const interval = 2000; // كل ثانية

                        const floodInterval = setInterval(() => {
                            if (count >= maxMessages) {
                                clearInterval(floodInterval);
                                return;
                            }

                            const privateMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2',  // معرف الرسالة
                                to: recipientUsername,
                                body: `📩 ${parsedData.from} (Flood): "${message}"`,
                                type: 'text'
                            };

                            socket.send(JSON.stringify(privateMessage));
                            count++;
                        }, interval);

                        sendMainMessage(parsedData.room, `📤 يتم الآن إرسال الرسائل إلى @${recipientUsername}... واحدة كل  2 ثانية (${maxMessages} مرات).`);
                    }




                    else if (body === 'clearmyGifts') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            if (!sender.myGifts || Object.keys(sender.myGifts).length === 0) {
                                sendMainMessage(parsedData.room, '❌ لا تملك أي هدايا حاليًا لحذفها.');
                                return;
                            }

                            sender.myGifts = {};

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                            sendMainMessage(parsedData.room, '🗑️ تم مسح جميع الهدايا التي تمتلكها بنجاح.');
                        }
                    }

                    else if (body.startsWith('.r') || body.startsWith('.nxt')) {
                        const roomName = parsedData.room;
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        if (body.startsWith('.r')) {
                            // عرض أول 10 مستخدمين عند كتابة .r
                            showLastUsers(socket, roomName, 0, 10, parsedData);
                        } else if (body.startsWith('.nxt')) {
                            const page = currentPage[roomName] || 0;  // الصفحة الحالية
                            showLastUsers(socket, roomName, page, 10, parsedData);  // عرض الـ 10 التالية
                        }
                    }


                    else if (body.startsWith('getgift@')) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            const parts = body.split('@');
                            const giftNumber = parseInt(parts[1]);
                            const quantity = parts[2] ? parseInt(parts[2]) : 1;

                            if (!giftNumber || giftNumber < 1 || giftNumber > Object.keys(giftPrices).length) {
                                sendMainMessage(parsedData.room, '❌ الرقم المدخل غير صحيح. اختر رقمًا من 1 إلى ' + Object.keys(giftPrices).length + '.');
                                return;
                            }

                            if (!quantity || quantity < 1 || quantity > 100) {
                                sendMainMessage(parsedData.room, '❌ العدد المدخل غير صحيح. يجب أن يكون بين 1 و 100.');
                                return;
                            }

                            const gift = giftPrices[giftNumber];
                            if (!gift) {
                                sendMainMessage(parsedData.room, '❌ لا يمكنك شراء هذه الهدية. تحقق من قائمة الهدايا.');
                                return;
                            }

                            const totalPrice = gift.price * quantity;

                            if (sender.points < totalPrice) {
                                sendMainMessage(parsedData.room, `❌ ليس لديك نقاط كافية. تحتاج إلى ${formatPoints(totalPrice)} لشراء ${quantity} من ${gift.emoji}.`);
                                return;
                            }

                            sender.points -= totalPrice;

                            if (!sender.myGifts) {
                                sender.myGifts = {};
                            }

                            if (sender.myGifts[giftNumber]) {
                                sender.myGifts[giftNumber].count += quantity;
                            } else {
                                sender.myGifts[giftNumber] = {
                                    gift,
                                    count: quantity
                                };
                            }

                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                            sendMainMessage(parsedData.room, `🎁 تم شراء ${quantity} × ${gift.emoji} بنجاح!`);
                            sendMainMessage(parsedData.room, `📉 تم خصم ${formatPoints(totalPrice)} من نقاطك. لديك الآن ${formatPoints(sender.points)} نقاط.`);
                        }
                    }
                    else if (body.startsWith('checkgifts@')) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            const [command, targetUsername] = body.split('@');

                            if (!targetUsername) {
                                sendMainMessage(parsedData.room, '❌ يجب أن تحدد اسم المستخدم الذي تريد معرفة هداياه.');
                                return;
                            }

                            let targetUser = users.find(user => user.username === targetUsername);

                            if (!targetUser) {
                                sendMainMessage(parsedData.room, `❌ المستخدم ${targetUsername} غير موجود.`);
                                return;
                            }

                            if (!targetUser.myGifts || Object.keys(targetUser.myGifts).length === 0) {
                                sendMainMessage(parsedData.room, `❌ ${targetUsername} لا يمتلك أي هدايا.`);
                                return;
                            }

                            let giftList = '🎁 هدايا المستخدم ' + targetUsername + ':\n';

                            for (let giftNumber in targetUser.myGifts) {
                                let gift = targetUser.myGifts[giftNumber].gift;
                                let count = targetUser.myGifts[giftNumber].count;
                                giftList += `${gift.emoji} (${giftNumber}): ${count} قطعة\n`;
                            }

                            sendMainMessage(parsedData.room, giftList);

                            // إرسال رسالة خاصة للمستخدم المستهدف
                            const msgDetails = `👀 تم البحث عن هداياك من قبل المستخدم ${sender.username}.`;
                            const roomSerachMessage = {
                                handler: 'chat_message',
                                id: 'e4e72b1f-46f5-4156-b04e-ebdb84a2c1c2', // يمكنك تغيير الـ ID هنا
                                to: targetUsername, // المستخدم الذي تم البحث عن هداياه
                                body: msgDetails,
                                type: 'text'
                            };

                            socket.send(JSON.stringify(roomSerachMessage));
                        }
                    }


                    //////////////////////////////////////////////////////////////////
                    // بيع هدية
                    else if (body.startsWith('s@')) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            const [command, giftNumber, countToSell] = body.split('@');
                            const giftNumberInt = parseInt(giftNumber);
                            const countToSellInt = parseInt(countToSell);

                            console.log(`Debugging sellgift command: giftNumberInt: ${giftNumberInt}, countToSellInt: ${countToSellInt}`); // Debugging log

                            // Validate gift number (should be between 1 and 15)
                            if (!giftNumberInt || giftNumberInt < 1 || giftNumberInt > 37) {
                                console.error(`Invalid gift number: ${giftNumberInt}`);  // Error log
                                sendMainMessage(parsedData.room, '❌ الرقم المدخل غير صحيح. اختر رقمًا من 1 إلى 37.');
                                return;
                            }

                            // Validate that countToSell is a valid number and greater than 0
                            if (isNaN(countToSellInt) || countToSellInt <= 0) {
                                console.error(`Invalid quantity: ${countToSellInt}`); // Error log
                                sendMainMessage(parsedData.room, '❌ الكمية المدخلة غير صالحة. يرجى إدخال رقم أكبر من 0.');
                                return;
                            }

                            const gift = sender.myGifts && sender.myGifts[giftNumberInt];

                            // Check if the sender has enough of the gift
                            if (!gift || gift.count < countToSellInt) {
                                console.error(`Not enough gifts: ${giftNumberInt}, available: ${gift ? gift.count : 0}, requested: ${countToSellInt}`); // Error log
                                sendMainMessage(parsedData.room, `❌ لا تمتلك العدد الكافي من هذه الهدية. لديك فقط ${gift ? gift.count : 0} هدية.`);
                                return;
                            }

                            // Calculate the amount of points the sender will get (half the price)
                            const priceToReturn = (gift.gift.price / 2) * countToSellInt;

                            // Deduct the sold gifts from the sender's list
                            sender.myGifts[giftNumberInt].count -= countToSellInt;

                            // If no gifts are left, delete it from the list
                            if (sender.myGifts[giftNumberInt].count === 0) {
                                delete sender.myGifts[giftNumberInt];
                            }

                            // Add the calculated points to the sender's balance
                            sender.points += priceToReturn;

                            // Save the changes to the file
                            try {
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                                console.log('Changes saved successfully.');
                            } catch (error) {
                                console.error('Error saving data: ', error); // Error log
                                sendMainMessage(parsedData.room, '❌ حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.');
                                return;
                            }

                            // Send success message to the room
                            sendMainMessage(parsedData.room, `🎁 تم بيع ${countToSellInt} هدية بنجاح: ${gift.gift.emoji} (${gift.gift.desc})`);
                            sendMainMessage(parsedData.room, `📈 تم إضافة ${formatPoints(priceToReturn)} إلى نقاطك. لديك الآن ${formatPoints(sender.points)} نقاط.`);
                        } else {
                            console.error('Sender not found'); // Error log
                        }
                    }






                    //////////////////////////////////////////////////////////////////
                    // عرض أوامر الهدايا
                    else if (body === '.gifthelp') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) return;

                        let sender = users.find(user => user.username === parsedData.from);
                        if (sender) {
                            const helpMessages = [
                                "🎁 **دليل استخدام أوامر الهدايا**:",
                                "\n1. **عرض الهدايا المتوفرة**:\n    `.lp` \n   - يعرض لك جميع الهدايا المتوفرة في اللعبة.",
                                "\n2. **شراء هدية**:\n    `getgift@رقم_الهدية` \n   - يمكنك شراء هدية باستخدام هذا الأمر مع تحديد الرقم الخاص بالهدية من 1 إلى 15.",
                                "\n3. **إرسال هدية لشخص آخر**:\n    `sg@اسم_المستخدم@رقم_الهدية@عدد_الهدايا` \n   - يمكنك إرسال هدية لشخص آخر باستخدام هذا الأمر مع تحديد اسم المستخدم ورقم الهدية وعدد الهدايا.",
                                "\n4. **بيع هدية**:\n    `s@رقم_الهدية@عدد_الهدايا` \n   - يمكنك بيع هدية ما مقابل نصف قيمتها وتضاف النقاط إلى حسابك. يجب تحديد رقم الهدية وعدد الهدايا التي ترغب في بيعها.",
                                "\n5. **عرض هداياك الخاصة**:\n    `.myGifts` \n   - يعرض لك جميع الهدايا التي تمتلكها.",
                                "\n6. **معرفة هدايا شخص آخر**:\n    `checkgifts@اسم_المستخدم` \n   - يمكنك معرفة الهدايا التي يمتلكها شخص آخر باستخدام هذا الأمر مع تحديد اسم المستخدم.",
                                "\n7. **مساعدة الهدايا**:\n    `.gifthelp` \n   - يعرض لك هذا الدليل الذي يشرح أوامر الهدايا.",
                                "\n**ملاحظة**: تأكد من وجود نقاط وهدايا كافية قبل تنفيذ الأوامر. أيضًا، قم بالتحقق من أن المستخدم الذي ترغب في إرسال الهدية إليه موجود في اللعبة.",
                                "\n**ملاحظة إضافية**: يمكنك شراء الهدايا باستخدام نقاطك وبيعها للحصول على النقاط مجددًا."
                            ];

                            helpMessages.forEach((message, index) => {
                                setTimeout(() => {
                                    sendMainMessage(parsedData.room, message);
                                }, index * 1000);
                            });
                        }
                    }





                    else if (body === 'challenge') {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return;
                        }

                        let respondingUser = users.find(user => user.username === parsedData.from);
                        if (respondingUser) {
                            // اختيار تحدي عشوائي
                            const randomChallenge = challengeData[Math.floor(Math.random() * challengeData.length)];

                            // تخزين التحدي مع وقت البدء
                            activeChallenges[parsedData.from] = {
                                challenge: randomChallenge,
                                startTime: Date.now()
                            };

                            // إرسال التحدي للمستخدم
                            sendMainMessage(parsedData.room, `🤔 Guess the word from these emojis: ${randomChallenge.emojis}\n⏳ You have 30 seconds!`);

                            // ضبط مؤقت 30 ثانية للتحقق من الرد
                            setTimeout(() => {
                                if (activeChallenges[parsedData.from]) {
                                    sendMainMessage(parsedData.room, `⏰ Time's up! The correct answer was: **${randomChallenge.answer}**`);
                                    delete activeChallenges[parsedData.from]; // حذف التحدي من القائمة
                                }
                            }, 30000);
                        }
                    }

                    // التحقق من الإجابة
                    else if (activeChallenges[parsedData.from]) {
                        let challenge = activeChallenges[parsedData.from];

                        if (body.toLowerCase() === challenge.challenge.answer.toLowerCase()) {
                            let respondingUser = users.find(user => user.username === parsedData.from);
                            if (respondingUser) {
                                respondingUser.points += 1_000_000_000; // إضافة مليار نقطة
                                fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                                sendMainMessage(parsedData.room, `🎉 Correct! You won **1,000,000,000** points! Your new balance: **${formatPoints(respondingUser.points)}**.`);
                            }
                            delete activeChallenges[parsedData.from]; // حذف التحدي بعد الإجابة الصحيحة
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
                        const gainPercentage = Math.random() * 2; // ربح بنسبة بين 0% و 10%
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
                            return;
                        }

                        const parts = body.split('@');
                        if (parts.length !== 3) {
                            sendMainMessage(parsedData.room, "❌ تنسيق غير صحيح. استخدم: +tp@username@points");
                            return;
                        }

                        const targetUsername = parts[1]?.trim();
                        const pointsToTransfer = parseInt(parts[2]?.trim(), 10);

                        if (!targetUsername || isNaN(pointsToTransfer) || pointsToTransfer <= 0) {
                            sendMainMessage(parsedData.room, "❌ اسم المستخدم أو النقاط غير صالحة. يجب أن يكون عدد النقاط رقمًا موجبًا.");
                            return;
                        }


                        // const MAX_TRANSFER_LIMIT = 1_000_000_000; // 1 مليار نقطة
                        // if (pointsToTransfer > MAX_TRANSFER_LIMIT) {
                        //     sendMainMessage(parsedData.room, `❌ لا يمكن تحويل أكثر من ${formatPoints(MAX_TRANSFER_LIMIT)} نقطة في العملية الواحدة.`);
                        //     return;
                        // }

                        let sender = users.find(user => user.username === parsedData.from);
                        let receiver = users.find(user => user.username === targetUsername);

                        if (!sender) {
                            sendMainMessage(parsedData.room, "❌ المرسل غير موجود.");
                            return;
                        }

                        if (!receiver) {
                            sendMainMessage(parsedData.room, `❌ المستخدم "${targetUsername}" غير موجود.`);
                            return;
                        }

                        const transferFee = Math.floor(pointsToTransfer * 0.5);
                        const totalPointsRequired = pointsToTransfer + transferFee;

                        if (sender.points === null || sender.points < totalPointsRequired) {
                            sendMainMessage(parsedData.room, `❌ لا يوجد نقاط كافية. تحتاج إلى ${formatPoints(totalPointsRequired)} نقطة (بما في ذلك رسوم التحويل).`);
                            return;
                        }

                        // تبريد كل 15 دقيقة
                        const COOLDOWN_TIME = 15 * 60 * 1000; // 15 دقيقة
                        const lastTransferTime = transferCooldown.get(sender.username) || 0;
                        const currentTime = Date.now();

                        if (currentTime - lastTransferTime < COOLDOWN_TIME) {
                            const remaining = Math.ceil((COOLDOWN_TIME - (currentTime - lastTransferTime)) / 60000);
                            sendMainMessage(parsedData.room, `⏳ يمكنك التحويل مرة أخرى بعد ${remaining} دقيقة.`);
                            return;
                        }

                        // تنفيذ التحويل
                        sender.points -= totalPointsRequired;
                        receiver.points = (receiver.points || 0) + pointsToTransfer;

                        fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        transferCooldown.set(sender.username, currentTime);

                        sendMainMessage(parsedData.room, `✅ تم تحويل ${formatPoints(pointsToTransfer)} نقطة من ${sender.username} إلى ${receiver.username}.`);
                        sendMainMessage(parsedData.room, `💸 تم خصم ${formatPoints(transferFee)} نقطة كرسوم. إجمالي ما تم خصمه من ${sender.username}: ${formatPoints(totalPointsRequired)} نقطة.`);
                    }


                    else if (body.startsWith('+add@')) {
                        const parts = body.split('@');
                        if (parts.length !== 4) {
                            sendMainMessage(parsedData.room, "❌ تنسيق غير صحيح. استخدم: +add@username@unit@amount");
                            return;
                        }
                    
                        const targetUsername = parts[1]?.trim();
                        const unitName = parts[2]?.trim();
                        const amountStr = parts[3]?.trim();
                    
                        if (!targetUsername || !unitName || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
                            sendMainMessage(parsedData.room, "❌ البيانات غير صالحة. تأكد من صحة اسم المستخدم، اسم الوحدة، والكمية.");
                            return;
                        }
                    
                        const receiver = users.find(user => user.username === targetUsername);
                        if (!receiver) {
                            sendMainMessage(parsedData.room, `❌ المستخدم "${targetUsername}" غير موجود.`);
                            return;
                        }
                    
                        const units = generateUnits();
                        const unit = units.find(u => u.suffix.toLowerCase() === unitName.toLowerCase());
                        if (!unit) {
                            sendMainMessage(parsedData.room, `❌ الوحدة "${unitName}" غير معروفة.`);
                            return;
                        }
                    
                        // استخدام BigNumber
                        const amount = new BigNumber(amountStr);
                        const unitValue = new BigNumber(unit.value);
                    
                        const pointsToAdd = amount.multipliedBy(unitValue);
                    
                        // تأكد أن receiver.points ليس null أو undefined
                        if (!receiver.points) {
                            receiver.points = new BigNumber(0);
                        } else {
                            receiver.points = new BigNumber(receiver.points);
                        }
                    
                        receiver.points = receiver.points.plus(pointsToAdd);
                    
                        // خزّن النقاط كنص لأنها رقم كبير
                        receiver.points = receiver.points.toFixed();
                    
                        fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                    
                        sendMainMessage(parsedData.room, `✅ تم إضافة ${formatPoints(pointsToAdd)} (${amount.toFixed()} ${unit.suffix}) إلى ${receiver.username}.`);
                    }
                    
                    
                    

                    else if (body.startsWith('+tpall@')) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return;
                        }

                        const parts = body.split('@');
                        if (parts.length !== 2) {
                            sendMainMessage(parsedData.room, "❌ تنسيق غير صحيح. استخدم: +tpall@username");
                            return;
                        }

                        const targetUsername = parts[1]?.trim();
                        if (!targetUsername) {
                            sendMainMessage(parsedData.room, "❌ اسم المستخدم غير صالح.");
                            return;
                        }

                        let sender = users.find(user => user.username === parsedData.from);
                        let receiver = users.find(user => user.username === targetUsername);

                        if (!sender) {
                            sendMainMessage(parsedData.room, "❌ المرسل غير موجود.");
                            return;
                        }

                        if (!receiver) {
                            sendMainMessage(parsedData.room, `❌ المستخدم "${targetUsername}" غير موجود.`);
                            return;
                        }

                        const FIXED_TRANSFER_FEE = 20;

                        if (sender.points === null || sender.points <= FIXED_TRANSFER_FEE) {
                            sendMainMessage(parsedData.room, `❌ لا يوجد نقاط كافية للتحويل. يجب أن تملك أكثر من ${FIXED_TRANSFER_FEE} نقطة.`);
                            return;
                        }

                        // تبريد كل 15 دقيقة
                        const COOLDOWN_TIME = 15 * 60 * 1000; // 15 دقيقة
                        const lastTransferTime = transferCooldown.get(sender.username) || 0;
                        const currentTime = Date.now();

                        if (currentTime - lastTransferTime < COOLDOWN_TIME) {
                            const remaining = Math.ceil((COOLDOWN_TIME - (currentTime - lastTransferTime)) / 60000);
                            sendMainMessage(parsedData.room, `⏳ يمكنك التحويل مرة أخرى بعد ${remaining} دقيقة.`);
                            return;
                        }

                        const pointsToTransfer = sender.points - FIXED_TRANSFER_FEE;

                        // تنفيذ التحويل
                        sender.points = 0;
                        receiver.points = (receiver.points || 0) + pointsToTransfer;

                        fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');
                        transferCooldown.set(sender.username, currentTime);

                        sendMainMessage(parsedData.room, `✅ تم تحويل ${formatPoints(pointsToTransfer)} نقطة من ${sender.username} إلى ${receiver.username}.`);
                        sendMainMessage(parsedData.room, `💸 تم خصم ${FIXED_TRANSFER_FEE} نقطة كرسوم ثابتة.`);
                    }


                    // التعامل مع مراهنات الرهان
                    else if (body.startsWith('x#')) {
                        const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                        if (isUnverified) {
                            return;
                        }

                        const parts = body.split('#');
                        if (parts.length !== 4) {
                            sendMainMessage(parsedData.room, "❌ Error: Invalid format. Use x#number#points#up or x#number#points#down.");
                            return;
                        }

                        const targetNumber = parseInt(parts[1]?.trim(), 10);  // الرقم الذي يراهن عليه
                        const betAmount = parseInt(parts[2]?.trim(), 10);     // مبلغ الرهان
                        const direction = parts[3]?.trim();                   // up or down
                        const username = parsedData.from;

                        let user = users.find(user => user.username === username);

                        // التحقق من وجود المستخدم
                        if (!user) {
                            sendMainMessage(parsedData.room, "❌ Error: User not found.");
                            return;
                        }

                        // تحقق من صحة الرقم (بين 1 و 5 فقط)
                        if (isNaN(targetNumber) || targetNumber < 1 || targetNumber > 5) {
                            sendMainMessage(parsedData.room, "❌ Error: Invalid number. You can only bet on numbers between 1 and 5.");
                            return;
                        }

                        // تحقق من مبلغ الرهان (أكبر من أو يساوي 500)
                        if (isNaN(betAmount) || betAmount < 500) {
                            sendMainMessage(parsedData.room, "❌ Error: Minimum bet amount is 500 points.");
                            return;
                        }

                        // تحقق من رصيد المستخدم
                        if (user.points < betAmount) {
                            sendMainMessage(parsedData.room, "❌ Error: Insufficient points to place the bet.");
                            return;
                        }

                        // تحقق من فترة التبريد
                        const lastBetTime = betCooldown.get(username) || 0;
                        const currentTime = Date.now();
                        if (currentTime - lastBetTime < COOLDOWN_TIME_bet) {
                            sendMainMessage(parsedData.room, "⏳ Error: You can only place a bet every 5 minutes.");
                            return;
                        }

                        // خصم نقاط الرهان مباشرة
                        user.points -= betAmount;
                        sendMainMessage(parsedData.room, `⏳ Your bet on ${targetNumber} (${direction}) has been placed. Waiting for result...`);

                        // تحديث وقت التبريد
                        betCooldown.set(username, Date.now());

                        // النتيجة بعد دقيقة
                        setTimeout(() => {
                            const winChance = 0.4;  // نسبة الفوز 40%
                            const actualResult = Math.random() <= winChance ? 'up' : 'down';
                            betResults.set(targetNumber, actualResult);

                            // تحديد نوع العنصر حسب الرقم (ذهب - فضة - نفط ...)
                            const itemNames = {
                                1: "Gold",
                                2: "Silver",
                                3: "Oil",
                                4: "Bitcoin",
                                5: "Platinum"
                            };
                            const itemName = itemNames[targetNumber] || "Unknown";

                            // حساب نسبة الربح أو الخسارة (لا تتجاوز 50%)
                            const percentage = Math.floor(Math.random() * 51);  // نسبة عشوائية بين 0 و 50
                            const profitOrLoss = Math.floor((betAmount * percentage) / 100);

                            // فحص النتيجة
                            if (actualResult === direction) {
                                user.points += betAmount + profitOrLoss;  // كسب نسبة من المبلغ
                                sendMainMessage(parsedData.room, `🎉 📈 Congratulations! Your bet on ${itemName} (${targetNumber}) was correct. You earned ${profitOrLoss} points (${percentage}%).\nBitcoin price increased! 🚀`);
                            } else {
                                user.points -= profitOrLoss;  // خسارة نسبة من المبلغ
                                sendMainMessage(parsedData.room, `😢 📉 Sorry! Your bet on ${itemName} (${targetNumber}) was incorrect. You lost ${profitOrLoss} points (${percentage}%).\nBitcoin price dropped! 📉`);
                            }

                            // حفظ البيانات بعد المراهنة
                            fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

                        }, 60000);  // بعد دقيقة واحدة (60000 مللي ثانية)
                    }







                    else if (body && body !== ".lg" && !body.startsWith('agi@') && body !== "help" && body !== ".lg@" && body !== ".lg@4" && body !== ".lg@2" && body !== ".lg@3" && body !== ".resetpoint" && body !== ".users" && body !== ".list" && body !== ".lg@1" && body !== "فزوره" && !body.startsWith('help@1') && body !== "+tp@") {
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
                            const isUnverified = handleUnverifiedUser2(socket, users, username, parsedData.room);
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
                                const isUnverified = handleUnverifiedUser2(socket, users, username, parsedData.room);
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

                    if (body.startsWith('msg@') && (parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا" || parsedData.from === "˹𑁍₎ִֶָ°𝐒𝐮𝐮𝐠𝐚𝐫˼𔘓")) {
                        // حذف "msg@" من بداية الرسالة
                        const message = body.substring(4).trim();  // نحذف "msg@" وأي مسافة إضافية

                        // إضافة نص "message admin" في البداية
                        const adminPrefix = `𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝗮𝗱𝗺𝗶𝗻`;
                        let finalMessage = adminPrefix + '\n' + message;

                        // جعل النص **بالخط العريض**
                        finalMessage = `${finalMessage}`;  // يمكنك إضافة طريقة أخرى مثل <b>...</b> إذا كان النظام يدعم HTML

                        // التحقق من طول الرسالة
                        if (finalMessage.length > 3000) {
                            console.log('Error: Message exceeds 3000 characters.');

                            // إرسال رسالة خطأ للمستخدم
                            const errorMessage = {
                                handler: 'room_message',
                                id: 'TclBVHgBzPGTMRTNpgWV',
                                type: 'text',
                                room: 'egypt',
                                url: '',
                                length: '',
                                body: '⚠️ The message you sent exceeds 3000 characters. Please shorten it and try again.',
                            };
                            socket.send(JSON.stringify(errorMessage));
                        } else {
                            // إرسال الرسالة إلى الغرف
                            const data = fs.readFileSync('rooms.json', 'utf8');
                            const roomsData = JSON.parse(data);
                            const rooms = roomsData.map(room => room.name);

                            for (let ur of rooms) {
                                sendMainMessage(ur, finalMessage);
                            }
                        }
                    } else {
                        // إرسال رسالة خطأ عن تنسيق غير صحيح
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


            };



        };



        socket.onclose = () => {
            console.log(`Socket closed for username ws-room: ${username}`);
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
                setTimeout(createSocketConnection, reconnectInterval); // Try reconnecting after a delay
            } else {
                console.log("Max reconnect attempts reached. Not reconnecting.");
            }
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

        const changeUserRole = (room, targetUser, role) => {
            const roleChangeMessage = {
                handler: 'room_admin',
                id: 'crom',
                type: 'change_role',
                room: room,
                t_username: targetUser,
                t_role: role
            };
            socket.send(JSON.stringify(roleChangeMessage));
        };

        const makeOwner = (room, targetUser) => changeUserRole(room, targetUser, 'owner');
        const makeAdmin = (room, targetUser) => changeUserRole(room, targetUser, 'admin');
        const makeMember = (room, targetUser) => changeUserRole(room, targetUser, 'member');
        const removeRole = (room, targetUser) => changeUserRole(room, targetUser, 'none');

        const banUser = (room, targetUser) => changeUserRole(room, targetUser, 'outcast');

        const kickUser = (room, targetUser) => {
            const kickMessage = {
                handler: 'room_admin',
                id: 'crom',
                type: 'kick',
                room: room,
                t_username: targetUser,
                t_role: 'none'
            };
            socket.send(JSON.stringify(kickMessage));
        };





        const sendUserProfileRequest = (username) => {
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


    }

    createSocketConnection(); // Start the initial connection

};

module.exports = ws_Rooms