// ---- CREATE BOT CONFIGURATION ----

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TOKEN, { polling: true });



// ---- KEYBOARDS ----

const { backKeyboard } = require("./src/keyboards/global-keyboards");
const { ownerKeyboards, controlAdminsInlineKeyboards } = require("./src/keyboards/owner-keyboards");
const { userKeyboards, premiumMembershipInlineKeyboards, contactInlineKeyboards, } = require("./src/keyboards/user-keyboards");
const { controlPostsInlineKeyboards, adminKeyboards, securityInlineKeyboards, sponsoredChannelsInlineKeyboards, } = require("./src/keyboards/admin-keyboards");



// --- DATA ---- 

let savedPosts = {};
let dbChannelId = null;
let currentAdminState = {};
let admins = [{ id: 298444246, type: "owner" }];
const sponsoredChannels = [{ username: "tarjima_kinolar_gc" }];



// ---- HELPER FUNCTIONS ----

const isAdmin = (id) => admins.find((admin) => admin.id === id);
const isOwner = (id) => admins.find((admin) => admin.id === id && admin.type === "owner");
const sendPost = (chatId, post) => {
  // --- Helpers ---
  const options = { caption: post.caption || "" };
  const checkPostType = (type) => post.type === type;
  const sendMsg = ({ showCaption = false }) => {
    bot.sendMessage(chatId, post.content, showCaption ? options : {})
  };

  // --- Send post by type ---

  // text
  if (checkPostType("text")) {
    sendMsg();
  }
  // sticker
  else if (checkPostType("sticker")) {
    sendMsg();
  }
  // photo
  else if (checkPostType("photo")) {
    sendMsg({ showCaption: true });
  }
  // document
  else if (checkPostType("document")) {
    sendMsg({ showCaption: true });
  }
  // video
  else if (checkPostType("video")) {
    sendMsg({ showCaption: true });
  }
  // animation
  else if (checkPostType("animation")) {
    sendMsg({ showCaption: true });
  };
};
const getChannelId = async (channelUsername) => {
  const username = channelUsername[0] === "@" ? channelUsername : "@" + channelUsername;
  try {
    const chat = await bot.getChat(username);
    return chat.id;
  } catch (error) {
    return null;
  }
}
const isMembership = async (channelUsername, userId) => {
  let result = { member: false, error: false };
  try {
    const member = await bot.getChatMember("@" + channelUsername, userId);
    if (member.status === 'member' || member.status === 'administrator' || member.status === 'creator') {
      result.member = true;
    }
  } catch (error) {
    result.error = "Kanalga obuna bo'lganligingizni tekshirishda xatolik yuz berdi.\nIltimos qayta urinib ko'ring!";
  }
  return result;
}
const checkUserSubscribed = async (userId) => {
  let result = true;
  if (sponsoredChannels.length > 0) {
    const checkMemberships = await Promise.all(sponsoredChannels.map((channel) => isMembership(channel.username, userId)));
    result = checkMemberships.every((membership) => membership.member);
  }
  return result;
}
const checkAndSavePost = (msg) => {
  const post = {};
  if (msg.text) post.type = "text", post.content = msg.text;
  else if (msg.photo) post.type = "photo", post.content = msg.photo.pop().file_id, post.caption = msg.caption;
  else if (msg.document) post.type = "document", post.content = msg.document.file_id, post.caption = msg.caption;
  else if (msg.video) post.type = "video", post.content = msg.video.file_id, post.caption = msg.caption;
  else if (msg.sticker) post.type = "sticker", post.content = msg.sticker.file_id;
  else if (msg.animation) post.type = "animation", post.content = msg.animation.file_id, post.caption = msg.caption;
  return post;
};
const setupAdminKeyboards = (chatId, message) => {
  const keyboards = isOwner(chatId) ? ownerKeyboards : adminKeyboards;
  bot.sendMessage(chatId, message, keyboards);
}
const handleBack = (chatId, message = "Amal bekor qilindi!") => {
  delete currentAdminState[chatId];
  setupAdminKeyboards(chatId, message)
};
const adminsDataToText = (adminsDataArray) => {
  let list = "";
  adminsDataArray.forEach((admin, index) => {
    const adminRole = admin.type.toLowerCase() === "owner" ? "Ega" : "Administrator";
    const adminDataText = `${index + 1}. Holati [${adminRole}](tg://user?id=${admin.id}), ID raqami ` + "`" + admin.id + "`\n";
    list += adminDataText;
  });
  return list;
};
const mandatoryMembershipMsg = (chatId, title = "Botdan foydalanish 🤖") => {
  const msg = `*${title}*\n\nIltimos botdan foydalanish uchun quyidagi homiy kanallarimizga obuna bo'ling.`;
  const channelsKeyboards = sponsoredChannels.map((channel, index) => ([{ text: (index + 1) + " - kanal", url: "https://t.me/" + channel.username }]));

  bot.sendMessage(chatId, msg, {
    parse_mode: "Markdown",
    reply_markup: {
      resize_keyboard: true,
      inline_keyboard: [...channelsKeyboards, [{ text: "Tekshirish ✅", callback_data: "check" }]],
    },
  });
}



// ---- BOT LISTENERS ----

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // --- CLEAR ADMIN STATE ----
  delete currentAdminState[chatId];

  // --- GREETING MESSAGES ----
  const userLink = `(tg://user?id=${userId})!\n\n`;
  const adminGreetingDescription = "Men ishlashga tayyorman! Nima qilamiz?";
  const userGreetingTitle = `*Assalomu alaykum ☺️*\nXush kelibsiz, hurmatli [foydalanuvchi]${userLink}`;
  const adminGreetingTitle = `*Assalomu alaykum ☺️*\nXush kelibsiz, hurmatli [${isOwner(chatId) ? 'ega' : 'admin'}]${userLink}`;
  const userGreetingDescription = "Menga siz qidirayotgan post (video, rasm va hk) ID raqamini yuboring va men sizga shu zahoti postni yuboaraman!";

  // --- SEND A GREETING MESSAGE TO ADMIN ---
  if (isAdmin(chatId)) {
    setupAdminKeyboards(chatId, adminGreetingTitle + adminGreetingDescription);
  }

  // --- SEND A GREETING MESSAGE TO USER ---
  else {
    bot.sendMessage(chatId, userGreetingTitle + userGreetingDescription, userKeyboards);
  }
});



// ---- MESSAGES ----

bot.on("message", async (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isBack = text === "◀️ Bekor qilish";

  // --- FOR ADMIN ONLY ---
  if (isAdmin(chatId)) {

    // awaiting post  
    if (currentAdminState[chatId] === "awaiting_post" && !isBack) {
      const post = checkAndSavePost(msg);
      const errMsg = "Post turini aniqlab bo'lmadi, iltimos postni qayta yuborib ko'ring."
      const sendIdMsg = "Juda soz! Endi esa post uchun takrorlanmas ID raqam kiriting.\nDiqqat! ID raqam faqat raqamlardan iborat bo'lishi kerak."

      // check post content
      if (!post.content) return bot.sendMessage(chatId, errMsg);

      // message sending id number for post
      bot.sendMessage(chatId, sendIdMsg);

      // update admin state
      currentAdminState[chatId] = { state: "awaiting_post_id", post };
    }

    // awaiting id and save the post  
    else if (currentAdminState[chatId]?.state === "awaiting_post_id" && !isBack) {
      const postId = Number(text);
      const dbChannelId = process.env.SAVED_POSTS_CHANNEL_ID;

      // check if post already saved
      if (!isNaN(postId) && !savedPosts[postId]) {
        // save post
        savedPosts[postId] = currentAdminState[chatId].post;

        // send post to database channel
        sendPost(dbChannelId, savedPosts[postId]);

        // back to homepage
        delete currentAdminState[chatId];
        setupAdminKeyboards(chatId, "Post saqlandi va kanalga yuborildi ✅");
      }

      // error
      else {
        bot.sendMessage(chatId, "*Xato ⚠️*\n\nID raqam noto'g'ri yoki ushbu ID raqam bilan bog'liq post mavjud.\nIltimos muqobil ID raqam kiritib qayta urinib ko'ring! ☺️", { parse_mode: "Markdown" });
      }
    }

    // awaiting id and save the post  
    else if (currentAdminState[chatId] === "awaiting_edit_post_id" && !isBack) {
      const postId = Number(text);

      // check if post already saved
      if (!isNaN(postId) && !savedPosts[postId]) {
        // save post
        savedPosts[postId] = currentAdminState[chatId].post;

        // send post to database channel
        sendPost(dbChannelId, savedPosts[postId]);

        // back to homepage
        delete currentAdminState[chatId];
        setupAdminKeyboards(chatId, `Post saqlandi va ma'lumotlar ombori kanaliga ${dbChannelId ? "yuborildi" : "yuborilmadi."} ✅`);
      }

      // error
      else {
        bot.sendMessage(chatId, "*Xato ⚠️*\n\nID raqam noto'g'ri yoki ushbu ID raqam bilan bog'liq post mavjud.\nIltimos muqobil ID raqam kiritib qayta urinib ko'ring! ☺️");
      }
    }

    // waiting for post id number to send post to admin
    else if (currentAdminState[chatId] === "awaiting_search_post_id" && !isBack) {
      const postId = Number(text);

      // check id
      if (!isNaN(postId) && savedPosts[postId]) {

        // back to homepage
        delete currentAdminState[chatId];
        setupAdminKeyboards(chatId, "Post qidirilmoqda 🔍");

        // send post to admin
        sendPost(chatId, savedPosts[postId]);
      }

      // error
      else {
        bot.sendMessage(chatId, "*Xato ⚠️*\n\nID raqam noto'g'ri yoki ushbu ID raqam bilan bog'liq post mavjud emas.\nIltimos muqobil ID raqam kiritib qayta urinib ko'ring! ☺️", { parse_mode: "Markdown" });
      }
    }

    // waiting for ADMIN id number and add admin
    else if (currentAdminState[chatId] === "awaiting_admin_id" && !isBack) {
      // check admin role
      if (!isOwner(chatId)) return bot.sendMessage(chatId, "Siz ega emassiz!")

      // check admin id and add admin data
      const adminId = Number(text);
      if (!isNaN(adminId) && !isAdmin(adminId)) {
        const adminModel = { type: "admin", id: adminId };
        const adminsList = adminsDataToText([...admins, adminModel]);

        // add admin data
        admins.push(adminModel);

        // back to homepage
        delete currentAdminState[chatId];
        setupAdminKeyboards(chatId, "*Admin muvaffaqiyatli qo'shildi! ✅\n\nMavjud adminlar*\n" + adminsList);
      }

      // error
      else {
        bot.sendMessage(chatId, "*Xato ⚠️*\n\nID raqam noto'g'ri yoki ushbu ID raqam bilan bog'liq admin mavjud.\nIltimos muqobil ID raqam kiritib qayta urinib ko'ring! ☺️", { parse_mode: "Markdown" });
      }
    }

    // waiting for ADMIN id number and delete admin
    else if (currentAdminState[chatId] === "awaiting_delete_admin_id" && !isBack) {
      // check admin role
      if (!isOwner(chatId)) return bot.sendMessage(chatId, "Siz ega emassiz!")

      // check admin id and add delete data
      const adminId = Number(text);
      if (!isNaN(adminId) && isAdmin(adminId) && !isOwner(adminId)) {
        // delete admin data
        const updatedAdmins = admins.filter(admin => admin.id !== adminId);
        admins = updatedAdmins;

        const adminsList = adminsDataToText(admins);

        // back to homepage
        delete currentAdminState[chatId];
        setupAdminKeyboards(chatId, "*Admin muvaffaqiyatli o'chirildi! ✅\n\nMavjud adminlar*\n" + adminsList);
      }

      // error
      else {
        bot.sendMessage(chatId, "*Xato ⚠️*\n\nID raqam noto'g'ri yoki ushbu ID raqam bilan bog'liq admin mavjud emas.\nIltimos muqobil ID raqam kiritib qayta urinib ko'ring! ☺️", { parse_mode: "Markdown" });
      }
    }

    // send control posts message
    else if (text === "Postlar 📮") {
      const msg = "*Postlarni boshqarish 📮*\n\nQuyidagi tugmalar orqali postlarni oson boshqaring!\nEndi nima qilamiz?"
      bot.sendMessage(chatId, msg, controlPostsInlineKeyboards);
    }

    // send control admins message
    else if (text === "Adminlar 👥") {
      const adminsList = adminsDataToText(admins);

      const msg = `*Adminlarni boshqarish 👥*\n\n*Mavjud adminlar*\n${adminsList}\nQuyidagi tugmalar orqali adminlarni oson boshqaring!\nEndi nima qilamiz?`
      bot.sendMessage(chatId, msg, controlAdminsInlineKeyboards);
    }

    // send control admins message
    else if (text === "Xavfsizlik 🔐") {
      const msg = `*Xavfsizlik 🔐*\n\nQuyidagi tugmalar orqali sizga kerakli bo'lgan ma'lumotlarni oson oling!\nEndi nima qilamiz?`
      bot.sendMessage(chatId, msg, securityInlineKeyboards);
    }

    // send control sponsor channels message
    else if (text === "Homiy kanallar 📣") {
      const msg = `*Homiy kanallarni boshqarish 📣*\n\nQuyidagi tugmalar orqali sizga kerakli bo'lgan homiy kanallarni oson boshqaring!\nEndi nima qilamiz?`
      bot.sendMessage(chatId, msg, sponsoredChannelsInlineKeyboards);
    }

    // cancel the action
    else if (currentAdminState[chatId] && isBack) {
      handleBack(chatId);
    }
  }

  // --- FOR USER ONLY ---
  else {
    // Check if user is subscribed to required channels
    const isSubscribed = await checkUserSubscribed(userId);

    // Send subscription requirement message
    if (!isSubscribed) return mandatoryMembershipMsg(chatId);

    // send a post to the user
    const postId = Number(text);

    if (!isNaN(postId)) {
      sendPost(chatId, savedPosts[postId] || { content: "Afsuski post topilmadi! 😔", type: "text" })
    }

    // premium membership
    else if (text === "Premium a'zolik ✨") {
      const premiumMembershipMsg = "*Premium a'zolik ✨*\n\nPremium a'zolik - Maxsus premium postlarni olish uchun yaratilingan a'zolik turidir. Hurmatli foydalanuvchi siz premium a'zolikka ega bo'lish orqali botimizning barcha hususiyatlaridan foydalanishingiz mumkin!\n\nPremium a'zolikka ega bo'lish uchun admin bilan bog'laning. ☺️"
      bot.sendMessage(chatId, premiumMembershipMsg, premiumMembershipInlineKeyboards);
    }

    // contact
    else if (text === "Bog'lanish ☎️") {
      const contactMsg = "*Bog'lanish ☎️*\n\nBiz bilan tezkor bog'lanish uchun rasmiy adminimiz yoki bot orqali bog'lanishingiz mumkin! ☺️"
      bot.sendMessage(chatId, contactMsg, contactInlineKeyboards);
    }
  }
});



// ---- CALLBACKS ----

bot.on("callback_query", async (query) => {

  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;

  // --- HELPERS ---
  const checkdata = (data) => query.data === data;
  const updateAdminState = (state) => currentAdminState[chatId] = state;
  const formatMsg = (title, description) => `*${title}*\n\n${description}`;
  const sendMsg = (title, description, back = true) => {
    bot.sendMessage(chatId, formatMsg(title, description), back ? backKeyboard : { parse_mode: "Markdown" });
  }

  // --- FOR ADMIN ONLY ---
  if (isAdmin(chatId)) {
    //  --- Post ---

    // add new post
    if (checkdata("add_post")) {
      const title = "Yangi post qo'shish ⏬";
      const description = "Yaxshi, endi esa iltimos menga saqlamoqchi bo'lgan postingizni yuboring!";

      sendMsg(title, description);
      updateAdminState("awaiting_post");
    }

    // edit post
    else if (checkdata("edit_post")) {
      const title = "Postni tahrirlash 📝";
      const description = "Yaxshi, endi esa iltimos menga tahrirlamoqchi bo'lgan postingizning ID raqamini yuboring!";

      sendMsg(title, description);
      updateAdminState("awaiting_edit_post_id");
    }

    // search post
    else if (checkdata("search_post")) {
      const title = "Postni qidirish 🔍";
      const description = "Yaxshi, endi esa iltimos menga qidirmoqchi bo'lgan postingizning ID raqamini yuboring!";

      sendMsg(title, description);
      updateAdminState("awaiting_search_post_id");
    }

    // --- Admin ---

    // add admin
    else if (checkdata("add_admin")) {
      const title = "Admin qo'shish ⏬";
      const description = "Yaxshi, endi esa iltimos menga admin qilmoqchi bo'lgan foydalanuvchining ID raqamini yuboring!";

      sendMsg(title, description);
      updateAdminState("awaiting_admin_id");
    }

    // delete admin
    else if (checkdata("delete_admin")) {
      const title = "Adminni o'chirish 🗑";
      const description = "Yaxshi, endi esa iltimos menga o'chirmoqchi bo'lgan adminning ID raqamini yuboring!";

      sendMsg(title, description);
      updateAdminState("awaiting_delete_admin_id");
    }

    // --- Security ---

    // send posts data to admin
    else if (checkdata("posts_data")) {
      const title = "Postlar ma'lumoti 📮";
      const postsData = Object.keys(savedPosts);
      const maxPosts = Math.ceil(postsData.length / 10);

      // send posts data
      if (maxPosts > 0) {
        for (let index = 0; index < maxPosts; index++) {
          const posts = {};

          // splitting 10 posts in each iteration
          const slicedPosts = postsData.slice(index * 10, (index + 1) * 10);
          slicedPosts.forEach((postId) => posts[postId] = savedPosts[postId]);

          // msg data
          const subTitle = `*Postlar ${index * 10 + 1} - ${(index + 1) * 10}*\n\n`;
          const description = "```JavaScript const posts = " + JSON.stringify(posts) + "```";

          // send msg to admin
          sendMsg(title, subTitle + description, false);
        }
      } else {
        sendMsg(title, "Hech qanday postlar ma'lumoti topilmadi!");
      }
    }

    // send admins data to admin
    else if (checkdata("admins_data")) {
      const title = "Adminlar ma'lumoti 👥";
      const description = "```JavaScript const admins = " + JSON.stringify(admins) + "```";

      // send msg to admin
      sendMsg(title, description, false);
    }

    // --- Sponsor channels ---

    // send sponsor channels information to adminx
    else if (checkdata("channels_data")) {
      let description = "";
      const title = "Kanallar ma'lumoti 📮";

      if (sponsoredChannels.length > 0) {
        sponsoredChannels.forEach((channel, index) => {
          description += `${index + 1}. [${channel.name}](https:t.me/${channel.username})`;
        });

        // send msg to admin
        sendMsg(title, description, false);
      } else {
        description = "Hech qanday kanallar ma'lumoti topilmadi!";
        sendMsg(title, description, false);
      }
    }

    // add new channel
    else if (checkdata("add_channel")) {
      const title = "Yangi kanal qo'shish ⏬";
      const description = "Yaxshi, endi esa iltimos menga qo'shmoqchi bo'lgan kanalning ID raqamini yuboring!";

      // 
      sponsoredChannels.forEach((channel, index) => {
        msgBody += `${index + 1}. [${channel.name}](https:t.me/${channel.username})`;
      });

      // send msg to admin
      sendMsg(title, description);
      updateAdminState("awaiting_channel_username");
    }

    // --- Invalid callback message ---
    else {
      const title = "Xatolik ⚠️";
      const description = "Tugmalar bilan bog'liq noma'lum xatolik yuz berdi! Iltimos qayta urinib ko'ring. Agar xatolik takroran yuz bersa iltimos adminga xatolik haqida xabar bering. Rahmat!";
      sendMsg(title, description, false);
    }
  }

  // --- FOR USER ONLY ---
  else {
    const isSubscribed = await checkUserSubscribed(userId);

    // --- Send subscription requirement message ---
    if (isSubscribed) {
      const title = "Muvaffaqiyatli 🎉";
      const description = "Siz bizning barcha kanallarimizga obuna bo'ldingiz. Endi esa botdan foydalanishingiz mumkin. Rahmat! ☺️";

      // send message
      bot.deleteMessage(chatId, msgId);
      sendMsg(title, description, false);
    } else {
      return mandatoryMembershipMsg(chatId, "Barcha kanallarga obuna bo'lmagansiz ❌");
    }
  }
});