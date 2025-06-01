const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// تخزين بيانات الأغاني المشغّلة
const activeSongs = {}; // shortId => { user, title, link, duration }

// توليد معرف قصير
function generateShortId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// جلب client_id من SoundCloud
async function getClientId() {
    try {
        const { data: html } = await axios.get('https://soundcloud.com');
        const $ = cheerio.load(html);
        const scriptUrls = [];

        $('script').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.includes('sndcdn')) scriptUrls.push(src);
        });

        for (const url of scriptUrls) {
            const { data: jsFile } = await axios.get(url);
            const match = jsFile.match(/client_id\s*:\s*"([a-zA-Z0-9-_]+)"/);
            if (match) return match[1];
        }

        throw new Error('Client ID not found');
    } catch (error) {
        console.error('❌ Failed to get client_id:', error.message);
    }
}

// البحث عن الأغنية
async function searchTrack(query) {
    const client_id = await getClientId();
    if (!client_id) return [];

    try {
        const response = await axios.get('https://api-v2.soundcloud.com/search/tracks', {
            params: { q: query, client_id, limit: 1 },
        });
        return response.data.collection;
    } catch (error) {
        console.error('❌ Error while searching track:', error.message);
        return [];
    }
}

// إنشاء رسالة صوتية
function createAudioRoomMessage(roomName, audioURL, durationInSeconds = '2') {
    return {
        handler: 'room_message',
        id: 'fbycGcESSGEbMuhornbf',
        room: roomName,
        type: 'audio',
        url: audioURL,
        length: durationInSeconds.toString(),
        body: ''
    };
}

// إرسال رسالة نصية عامة
function sendRoomMessage(socket, room, message) {
    const msg = {
        handler: 'room_message',
        id: 'text-msg-id',
        room: room,
        type: 'text',
        url: '',
        length: '',
        body: message
    };
    socket.send(JSON.stringify(msg));
}

// إرسال رسالة خاصة
function sendPrivateMessage(socket, to, message) {
    const privateMessage = {
        handler: 'chat_message',
        id: 'private-msg-id',
        to,
        body: message,
        type: 'text'
    };
    socket.send(JSON.stringify(privateMessage));
}

// معالجة أمر تشغيل الأغنية
async function handlePlayCommand(parsedData, socket) {
    const body = parsedData.body.toLowerCase();
    if (body.startsWith('.ps ') || body.startsWith('تشغيل ')) {
        const query = parsedData.body.split(' ').slice(1).join(' ');

        // ⏳ رسالة انتظار
        sendRoomMessage(socket, parsedData.room, `⏳ Please wait, loading the track: "${query}"...`);

        const tracks = await searchTrack(query);
        if (tracks.length === 0) {
            sendRoomMessage(socket, parsedData.room, `❌ No track found for: ${query}`);
            return;
        }

        const track = tracks[0];
        const client_id = await getClientId();
        const streamEndpoint = track.media.transcodings.find(t => t.format.protocol === 'progressive');

        if (!streamEndpoint) {
            sendRoomMessage(socket, parsedData.room, `❌ Cannot stream this track.`);
            return;
        }

        const streamUrl = `${streamEndpoint.url}?client_id=${client_id}`;
        const { data } = await axios.get(streamUrl);
        const finalAudioUrl = data.url;

        const roomsData = JSON.parse(fs.readFileSync('rooms.json', 'utf8'));
        const rooms = roomsData.map(room => room.name);

        const songId = generateShortId();
        const durationSeconds = Math.floor(track.duration / 1000);

        // تخزين بيانات الأغنية
        activeSongs[songId] = {
            user: parsedData.from,
            title: track.title,
            link: track.permalink_url,
            duration: durationSeconds
        };

        // اسم الغرفة التي تم فيها طلب التشغيل
        const requestedFromRoom = parsedData.room;

        for (const room of rooms) {
            socket.send(JSON.stringify(createAudioRoomMessage(room, finalAudioUrl, durationSeconds)));
            sendRoomMessage(
                socket,
                room,
                `🎧 *Now Playing:* ${track.title}  
👤 by: ${parsedData.from}  
📍 Room: ${requestedFromRoom}  
🆔 ID: ${songId}
            
❤️ Like: \`love@${songId}\` 

👎 Dislike: \`dislike@${songId}\`  
💬 Comment: \`com@${songId}@YourMessage\`  
🎁 Gift: \`gift@${songId}@username\``
            );
            
            
        }

        sendRoomMessage(socket, requestedFromRoom, `✅ Track "${track.title}" is now playing in all rooms.`);
    }
}


function handleSongFeedback(parsedData, socket) {
    const body = parsedData.body.trim();
    const username = parsedData.from;
    const roomName = parsedData.room;

    if (body.startsWith('love@') || body.startsWith('dislike@') || body.startsWith('com@') || body.startsWith('gift@')) {
        let match;

        // إعجاب
        if ((match = body.match(/^love@(\w{6})$/))) {
            const id = match[1];
            if (activeSongs[id]) {
                sendPrivateMessage(socket, activeSongs[id].user, `👍 ${username} liked your song: "${activeSongs[id].title}"`);
                sendRoomMessage(socket, roomName, `✅ ${username} liked the song "${activeSongs[id].title}"`);
            } else {
                sendRoomMessage(socket, roomName, `❌ Song ID "${id}" not found.`);
            }

        // عدم إعجاب
        } else if ((match = body.match(/^dislike@(\w{6})$/))) {
            const id = match[1];
            if (activeSongs[id]) {
                sendPrivateMessage(socket, activeSongs[id].user, `👎 ${username} disliked your song: "${activeSongs[id].title}"`);
                sendRoomMessage(socket, roomName, `⚠️ ${username} disliked the song "${activeSongs[id].title}"`);
            } else {
                sendRoomMessage(socket, roomName, `❌ Song ID "${id}" not found.`);
            }

        // تعليق
        } else if ((match = body.match(/^com@(\w{6})@(.+)$/))) {
            const id = match[1];
            const message = match[2];
            if (activeSongs[id]) {
                sendPrivateMessage(socket, activeSongs[id].user, `💬 ${username} commented on your song "${activeSongs[id].title}": ${message}`);
                sendRoomMessage(socket, roomName, `✅ ${username} commented on the song "${activeSongs[id].title}"`);
            } else {
                sendRoomMessage(socket, roomName, `❌ Song ID "${id}" not found.`);
            }

        // هدية
        } else if ((match = body.match(/^gift@(\w{6})@(\w+)$/))) {
            const id = match[1];
            const recipient = match[2];

            if (activeSongs[id]) {
                const song = activeSongs[id];
                const sender = username;

                sendPrivateMessage(socket, recipient, 
                    `🎁 ${sender} sent you a musical gift!\n❤️ "${song.title}"`);

                const roomsData = JSON.parse(fs.readFileSync('rooms.json', 'utf8'));
                const rooms = roomsData.map(room => room.name);

                for (const room of rooms) {
                    sendRoomMessage(
                        socket,
                        room,
                        `🎁 *Musical Gift!*\n❤️ ${sender} sent "${song.title}" to ${recipient}!\n🎶 Spread the love!`
                    );
                }

                sendRoomMessage(socket, roomName, `✅ ${sender} gifted the song "${song.title}" to ${recipient}`);
            } else {
                sendRoomMessage(socket, roomName, `❌ Song ID "${id}" not found.`);
            }
        }
    }
}


/**
 * يروِّج المستخدم ليصبح في المركز الأول بفارق معيّن (٪) عن صاحب المركز الثاني.
 *
 * @param {string}  username          اسم المستخدم المطلوب ترقيته.
 * @param {Array}   users             مصفوفة المستخدمين (كل عنصر: { username, points }).
 * @param {number}  percentDifference الفارق المرغوب عن صاحب المركز الثاني (افتراضي 20).
 * @returns {Array} نسخة محدثة من المصفوفة بعد إعادة الفرز.
 */
function promoteUserToTop(username, users, percentDifference = 20) {
  // العثور على أعلى نقاط حالية (باستثناء المستخدم المستهدف إن وجد).
  const highestOtherPoints = users.reduce((max, u) =>
    u.username !== username && u.points > max ? u.points : max
  , 0);

  // حساب النقاط الجديدة المطلوبة للمستخدم (أعلى بنسبة معينة).
  const newPoints = Math.ceil(highestOtherPoints * (1 + percentDifference / 100));

  // إضافة المستخدم إن لم يكن موجودًا، أو تحديث نقاطه إن وُجد.
  let target = users.find(u => u.username === username);
  if (!target) {
    target = { username, points: 0 };
    users.push(target);
  }
  target.points = newPoints;

  // إعادة فرز المصفوفة تنازليًا حسب النقاط.
  users.sort((a, b) => b.points - a.points);

  // حفظ التغييرات في ملف البيانات.
  fs.writeFileSync('verifyusers.json', JSON.stringify(users, null, 2), 'utf8');

  return users;
}


module.exports = {
    handlePlayCommand,
    handleSongFeedback,
    promoteUserToTop
};
