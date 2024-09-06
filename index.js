const token = "6907573108:AAFouwdQ2jfO04ZhcEsqtPI3Wd5sOxB9310";
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(token, { polling: true });

// Admins id
const admins = [298444246];

// Kanallarning ID raqami
const channelId = "-1002494870935";

// Saqlanadigan postlar
let posts = {};

// Adminning hozirgi holati
let currentAdminState = {};

// Doimiy menyu tugmalarini yaratish
const adminKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: "Postlarni boshqarish 📮" }, { text: "Statistika 📊" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};

const userKeyboard = {
  reply_markup: {
    keyboard: [[{ text: "Premium a'zolik ✨" }, { text: "Bog'lanish ☎️" }]],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};

// check admin
const isAdmin = (chatId) => {
  return admins.includes(chatId);
};

// ID yordamida postni qidirish va yuborish
const sendSavedPost = (chatId, postId) => {
  // check post availablity
  const post = posts[postId];

  // send post
  if (post) {
    // check post type and send the post
    switch (post.type) {
      case "text":
        bot.sendMessage(chatId, post.content);
        break;
      case "photo":
        bot.sendPhoto(chatId, post.content, { caption: post.caption });
        break;
      case "document":
        bot.sendDocument(chatId, post.content, { caption: post.caption });
        break;
      case "video":
        bot.sendVideo(chatId, post.content, { caption: post.caption });
        break;
      case "sticker":
        bot.sendSticker(chatId, post.content);
        break;
      case "animation":
        bot.sendAnimation(chatId, post.content, { caption: post.caption });
        break;
    }
  } else {
    bot.sendMessage(chatId, "Ushbu ID bilan bog'liq post topilmadi. 😔");
  }
};

// Start / foydalanuvchi ismi bilan xabar yuborish
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

  if (admins.includes(chatId)) {
    bot.sendMessage(chatId, `Xush kelibsiz, Admin *${firstName}!*`, {
      reply_markup: adminKeyboard.reply_markup,
      parse_mode: "Markdown",
    });
  } else {
    bot.sendMessage(chatId, `Xush kelibsiz, *${firstName}!*`, {
      reply_markup: userKeyboard.reply_markup,
      parse_mode: "Markdown",
    });
  }
});

// Inline klaviatura callback-larini qayta ishlash
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;

  if (isAdmin(chatId)) {
    if (query.data === "add_post") {
      bot.sendMessage(chatId, "Iltimos menga postni yuboring!");
      currentAdminState[chatId] = "awaiting_post";
    } else if (query.data === "delete_post") {
      bot.sendMessage(
        chatId,
        "Iltimos o'chirmoqchi bo'lgan postingizni ID raqamini kiritng!"
      );
      currentAdminState[chatId] = "awaiting_delete_id";
    }
  } else {
    bot.sendMessage(chatId, "Siz admin emassiz!");
  }
});

// post qabul qilish
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (isAdmin(chatId)) {
    // control posts
    if (currentAdminState[chatId] === "awaiting_post") {
      const post = {};

      // chey post type
      if (msg.text) {
        post.type = "text";
        post.content = msg.text;
      } else if (msg.photo) {
        post.type = "photo";
        post.content = msg.photo[msg.photo.length - 1].file_id;
        if (msg.caption) post.caption = msg.caption;
      } else if (msg.document) {
        post.type = "document";
        post.content = msg.document.file_id;
        if (msg.caption) post.caption = msg.caption;
      } else if (msg.video) {
        post.type = "video";
        post.content = msg.video.file_id;
        if (msg.caption) post.caption = msg.caption;
      } else if (msg.sticker) {
        post.type = "sticker";
        post.content = msg.sticker.file_id;
      } else if (msg.animation) {
        post.type = "animation";
        post.content = msg.animation.file_id;
      }

      // Post qabul qilingandan so'ng ID kiritishni so'rash
      if (post.content) {
        bot.sendMessage(chatId, "Post uchun takrorlanmas ID kiriting:");
        currentAdminState[chatId] = {
          state: "awaiting_post_id",
          post: post,
        };
      } else {
        bot.sendMessage(chatId, "Post turini tanib bo'lmadi. Qayta yuboring.");
      }
    }
    // awaiting chat id
    else if (currentAdminState[chatId]?.state === "awaiting_post_id") {
      const postId = msg.text;

      if (posts[postId]) {
        bot.sendMessage(chatId, "Bu ID allaqachon mavjud. Boshqa ID kiriting.");
      } else {
        // Postni saqlash va kanalda yuborish
        posts[postId] = currentAdminState[chatId].post;
        bot.sendMessage(chatId, "Post saqlandi va kanalga yuborildi!");

        // Postni turiga qarab kanalda jo'natish
        const post = posts[postId];
        switch (post.type) {
          case "text":
            bot.sendMessage(channelId, post.content);
            break;
          case "photo":
            bot.sendPhoto(channelId, post.content, { caption: post.caption });
            break;
          case "document":
            bot.sendDocument(channelId, post.content, {
              caption: post.caption,
            });
            break;
          case "video":
            bot.sendVideo(channelId, post.content, { caption: post.caption });
            break;
          case "sticker":
            bot.sendSticker(channelId, post.content);
            break;
          case "animation":
            bot.sendAnimation(channelId, post.content, {
              caption: post.caption,
            });
            break;
        }

        // Adminning holatini tozalash
        delete currentAdminState[chatId];
      }
    }
    // keyboard tugmalarini ishlatish
    else {
      if (text === "Postlarni boshqarish 📮") {
        bot.sendMessage(chatId, "Nima qilamiz?", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Yangi post qo'shish", callback_data: "add_post" }],
              [{ text: "Postni o'chirish", callback_data: "delete_post" }],
            ],
          },
        });
      } else if (text === "Statistika 📊") {
        bot.sendMessage(chatId, "Nimani statistikasini aniqlamoqchisiz?", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Foydalanuvchilar", callback_data: "users_stats" }],
              [{ text: "Postlar", callback_data: "posts_stats" }],
            ],
          },
        });
      }
    }
  }
  // find and send the saved post by ID
  else {
    const postId = Number(text);
    console.log("user", msg);

    if (!isNaN(postId)) {
      sendSavedPost(chatId, postId);
    }
  }
});
