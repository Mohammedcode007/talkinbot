const fs = require('fs');
const path = require('path');

const tweetsFilePath = path.join(__dirname, 'tweets.json');

function loadTweets() {
  // قراءة البيانات من الملف
  const data = fs.readFileSync(tweetsFilePath, 'utf8');

  // تحويل البيانات من JSON إلى كائن JavaScript
  const parsedData = JSON.parse(data);

  // التأكد أن المصفوفة تحتوي على تغريدات
  if (parsedData.tweets && parsedData.tweets.length > 0) {
      // تصفية التغريدات القديمة (أكثر من 48 ساعة)
      const currentTime = new Date();
      parsedData.tweets = parsedData.tweets.filter(tweet => {
          const tweetTime = new Date(tweet.createdAt);
          const timeDiff = (currentTime - tweetTime) / (1000 * 60 * 60); // الفرق بالساعة
          return timeDiff <= 48; // الاحتفاظ بالتغريدات التي أضيفت خلال آخر 48 ساعة
      });

      // إرجاع التغريدات بعد التصفية
      return parsedData.tweets;
  } else {
      console.log("No tweets available.");
      return [];
  }
}


// حفظ التغريدات في الملف
function saveTweets(tweets) {
  const data = JSON.stringify({ tweets }, null, 2); // Pretty print with 2 spaces
  fs.writeFileSync(tweetsFilePath, data, 'utf8');
}

function addTweet(newTweet) {
  const newTweetWithTimestamp = {
      ...newTweet,
      createdAt: new Date().toISOString() // إضافة التاريخ والوقت
  };

  const tweets = loadTweets();
  tweets.push(newTweetWithTimestamp);
  saveTweets(tweets);
  console.log('New tweet added:', newTweetWithTimestamp);
}


// دالة لاختيار تغريدة عشوائية
function getRandomTweet() {
  const tweets = loadTweets();
  if (tweets.length > 0) {
    const randomIndex = Math.floor(Math.random() * tweets.length);
    return tweets[randomIndex];
  } else {
    console.log("No tweets available.");
    return null;
  }
}

// دالة لعرض تغريدات كل 5 دقائق
function startTweetInterval() {
  const tweets = loadTweets();
  let currentIndex = 0;

  const intervalId = setInterval(() => {
    if (currentIndex < tweets.length) {
      const tweet = tweets[currentIndex];
      console.log(`User: ${tweet.user}`);
      console.log(`Tweet: ${tweet.text}`);
      console.log(`Likes: ${tweet.likes}, Dislikes: ${tweet.dislikes}`);
      console.log('-----------------------------------');
      currentIndex++;
    } else {
      console.log('All tweets have been displayed.');
      clearInterval(intervalId); // إيقاف العرض بعد انتهاء جميع التغريدات
    }
  }, 5 * 60 * 1000); // 5 دقائق بالميلي ثانية
}

// تصدير الوظائف لاستخدامها في ملفات أخرى
module.exports = {
  loadTweets,
  saveTweets,
  addTweet,
  getRandomTweet,
  startTweetInterval,
};
