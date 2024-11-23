const fs = require('fs');
const moment = require('moment');  // التأكد من استيراد moment

const WebSocket = require('ws');
const {
    readBettingData,
    writeBettingData,
    updateLastTimeGift,
    saveLoginData,
    deleteUserFromFile,
    deleteRoomName,
    saveRoomName,
    readLoginDataTeBot,
    getRandomEmoji,
    isUserInMasterBot,
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
    readBlockedUsers,
    deleteBlockedUser,
    saveGameData,
    users,
    getRandomNumber,
    getRandomHikma,
    getRandomImage,
}= require('./functions');



const ws_Rooms = async ({ username, password, roomName }) => {
    const socket = new WebSocket('wss://chatp.net:5333/server');
    let answerTimeout;
    let reminderInterval;
    let timeLeft = 30; // 30 seconds
    let correctAnswer = null;
    let puzzleInProgress = false;
    let revealedLayers = 5; // Number of parts to reveal gradually

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
    let gameTimer; // المؤقت
    let choiceTimeout; // متغير للوقت المحدد لإنهاء اللعبة
    let isGameActive = false; // حالة اللعبة لتحديد ما إذا كانت هناك لعبة جارية أم لا
    let userChoiceTimeout; // مؤقت لرسالة تحفيزية
    let canChoosePath = false; // لمنع اللاعب من اختيار الطريق قبل كلمة "ابدأ"
    let puzzleTimeout;

    // دالة لإيقاف اللعبة بعد 30 ثانية
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
        const rooms = JSON.parse(data);
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
            console.log(`Joined room: ${room}`);
        })


    };
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
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                 const emoji=   getRandomEmoji()
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
                 const hikma=   getRandomHikma()
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
                         const rooms = JSON.parse(data);

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



            if (parsedData.handler === 'room_event' && parsedData.type === 'user_joined') {
                sendMainMessage(parsedData.name, `🌟𝗪𝗘𝗟𝗖𝗢𝗠𝗘🌟 \n ${parsedData.username}`);
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
                        user = { username: usernameToVerify, verified: true, lasttimegift: null, points: null, name:null,
                            nickname:null };
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
                } else if (body.startsWith('ms@') && parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا"  ) {

                    const usernameToAdd = body.split('@')[1].trim();
                    addUserToMasterBot(usernameToAdd);
                    sendVerificationMessage(parsedData.room, `User Added Master: ${usernameToAdd}`);


                    // تحقق من الرسائل التي تبدأ بـ delms@ لحذف المستخدم من masterbot
                } else if (body.startsWith('delms@') && parsedData.from === "ا◙☬ځُــۥـ☼ـڈ◄أڵـــســمـــٱ۽►ـۉد☼ــۥــۓ☬◙ا") {
                    const usernameToRemove = body.split('@')[1].trim();
                    removeUserFromMasterBot(usernameToRemove);
                    sendVerificationMessage(parsedData.room, `User removed Master: ${usernameToRemove}`);

                } else if (body === '.po') {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
                    let respondingUser = users.find(user => user.username === parsedData.from);
                    if (respondingUser) {
                        // Convert points to a formatted string
                        const formattedPoints = formatPoints(respondingUser?.points);
                        sendMainMessage(parsedData.room, `User ${parsedData.from} has: ${formattedPoints} points`);
                    }
                }else if (body.startsWith('spec@')) {
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
                    const betAmount = parseInt(body.split('@')[1]);  // استخراج المبلغ المراهن عليه
                    const bettingData = readBettingData();
                    const player = users.find(user => user.username === parsedData.from);
                    if (!player || player.points < betAmount) {
                        sendMainMessage(parsedData.room, `❌ You don't have enough points to start a bet. You currently have ${player ? player.points : 0} points.`);
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
                
                    // حفظ بيانات المراهنة
                    writeBettingData(bettingData);
                
                    sendMainMessage(parsedData.room, `🎲 ${parsedData.from} has started a bet with ${betAmount} points!`);
                    sendMainMessage(parsedData.room, `🎲 Other players can join by typing 'bet'.`);
                
                    // تعيين مؤقت لإغلاق اللعبة بعد دقيقة إذا لم يُرسل .start
                    setTimeout(() => {
                        const updatedBettingData = readBettingData();
                        const updatedRoomData = updatedBettingData[parsedData.room];
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
                
                else if (body === 'bet') {
                    const bettingData = readBettingData();
                    const roomData = bettingData[parsedData.room];
                
                    // تحقق إذا كانت المراهنة قد بدأت
                    if (!roomData || !roomData.active) {
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
                            player.points -= roomData.betAmount;  // خصم المبلغ من نقاط اللاعب
                            roomData.players.push({
                                username: parsedData.from,
                                betAmount: roomData.betAmount
                            });
                
                            writeBettingData(bettingData);  // تحديث بيانات المراهنة
                
                            sendMainMessage(parsedData.room, `🎲 ${parsedData.from} has joined the bet with ${roomData.betAmount} points.`);
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
                    sendMainMessage(parsedData.room, `🎉 The winner is ${winner.username} with ${winner.betAmount} points! 🎉`);
                
                    // تحديث النقاط: الفائز يحصل على ضعف المبلغ
                    let winnerPlayer = users.find(user => user.username === winner.username);
                    if (winnerPlayer && winner.betAmount > 0 && roomData.players.length > 0) {
                        winnerPlayer.points += winner.betAmount * roomData.players.length;
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
                    let leaderboardMessage = `\u202B🏆 Top 10 Players with Most Points: 🏆\n`;
                    
                    topPlayers.forEach((player, index) => {
                        const emoji = rankEmojis[index] || '🔹'; // اختيار الإيموجي بناءً على الترتيب
                        leaderboardMessage += `${emoji} ${index + 1}. ${player.username}: ${player.points} points\n`;
                    });
                
                    leaderboardMessage += `\u202C`; // إنهاء تنسيق اتجاه النص
                
                    // إرسال الرسالة إلى الغرفة
                    sendMainMessage(parsedData.room, leaderboardMessage);
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
                }else if (body.startsWith('name@')) {
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
                
                else if (body && body !== ".lg" && !body.startsWith('agi@')&& body !== "help"&& body !== ".lg@" && body !== ".lg@4"&& body !== ".lg@2"  && body !== ".lg@1" && body !== "فزوره"&& !body.startsWith('help@1')&& body !== "+tp@") {
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
  
    Ex : agi@NumberGift@username@message
    
    `);

                }
                else if (body.startsWith('agi@')) {
                    const isUnverified = handleUnverifiedUser(socket, users, parsedData);
                    if (isUnverified) {
                        // Additional actions if needed when user is unverified
                        return;
                    }
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
                            const msg = body.split('@')[3].trim();
                            const id = Number(body.split('@')[1].trim());
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
                                        const rooms = JSON.parse(data);
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
                                        const rooms = JSON.parse(data);
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
                                        const rooms = JSON.parse(data);
                                
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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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

                            } else if (id === 11) {
                                imageType5 = '2sp';

                                if (imageType5 === '2sp') {
                                    const imageUrl = getRandomImage(imageType5);
                                    if (imageUrl) {
                                        const data = fs.readFileSync('rooms.json', 'utf8');
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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
                                        const rooms = JSON.parse(data);

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

                }else if (body ==='help') {
                  
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
                else if (body ==='help@1') {
                  
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

                        if (message.length > 100) {
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
                            const rooms = JSON.parse(data);

                            for (let ur of rooms) {
                                console.log(`Sending message: "${message}" to room: ${ur}`);

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

module.exports = ws_Rooms