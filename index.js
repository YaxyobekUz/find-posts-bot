require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const { backKeyboard } = require("./src/keyboards/global-keyboards");
const { ownerKeyboards, controlAdminsInlineKeyboards } = require("./src/keyboards/owner-keyboards");
const { controlPostsInlineKeyboards, adminKeyboards, } = require("./src/keyboards/admin-keyboards");
const { userKeyboards, premiumMembershipInlineKeyboards, contactInlineKeyboards, } = require("./src/keyboards/user-keyboards");

let savedPosts = {};
let ownerPassword = 1234;
let currentAdminState = {};
let admins = [{ id: 298444246, type: "owner" }];

// --- Helper Functions ---

const isAdmin = (id) => admins.find((admin) => admin.id === id);
const isOwner = (id) => admins.find((admin) => admin.id === id && admin.type === "owner");
const sendPost = (chatId, post) => {
  const options = { caption: post.caption || "" };

  // send post by type 
  switch (post.type) {
    case "text": return bot.sendMessage(chatId, post.content,);
    case "photo": return bot.sendPhoto(chatId, post.content, options);
    case "document": return bot.sendDocument(chatId, post.content, options);
    case "video": return bot.sendVideo(chatId, post.content, options);
    case "sticker": return bot.sendSticker(chatId, post.content);
    case "animation": return bot.sendAnimation(chatId, post.content, options);
  }
};
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

// --- Bot Listeners ---

bot.onText(/\/start/, (msg) => {
  // chat id (user id)
  const chatId = msg.chat.id;

  // greeting messages
  const userGreeting = `Assalomu alaykum ☺️\nXush kelibsiz, hurmatli *foydalanuvchi!*`;
  const adminGreeting = `Assalomu alaykum ☺️\nXush kelibsiz, hurmatli *${isOwner(chatId) ? 'ega' : 'admin'}!*`;

  // send a greeting message to the admin
  if (isAdmin(chatId)) {
    setupAdminKeyboards(chatId, adminGreeting);
  }
  // send a greeting message to the user
  else {
    bot.sendMessage(chatId, userGreeting, userKeyboards);
  }
});

// message
bot.on("message", (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;
  const isBack = text === "◀️ Bekor qilish"

  // for admin
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

    // send control posts message
    else if (text === "Adminlar 👥") {
      const adminsList = adminsDataToText(admins);

      const msg = `*Adminlarni boshqarish 👥*\n\n*Mavjud adminlar*\n${adminsList}\nQuyidagi tugmalar orqali adminlarni oson boshqaring!\nEndi nima qilamiz?`
      bot.sendMessage(chatId, msg, controlAdminsInlineKeyboards);
    }

    // cancel the action
    else if (currentAdminState[chatId] && isBack) {
      handleBack(chatId);
    }
  }

  // for user
  else {
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

// callback
bot.on("callback_query", (query) => {
  // chat id (user id)
  const chatId = query.message.chat.id;

  if (!isAdmin(chatId)) return bot.sendMessage(chatId, "Siz admin emassiz!");

  switch (query.data) {
    // for post
    case "add_post":
      bot.sendMessage(chatId, "Iltimos, menga postni yuboring!", backKeyboard);
      currentAdminState[chatId] = "awaiting_post";
      break;
    case "edit_post":
      bot.sendMessage(chatId, "Tahrirlamoqchi bo'lgan postingizning ID raqamini kiriting!", backKeyboard);
      currentAdminState[chatId] = "awaiting_edit_post_id";
      break;
    case "search_post":
      bot.sendMessage(chatId, "Qidirmoqchi bo'lgan postingizning ID raqamini kiriting!", backKeyboard);
      currentAdminState[chatId] = "awaiting_search_post_id";
      break;

    // for admins
    case "add_admin":
      bot.sendMessage(chatId, "Admin qilmoqchi bo'lgan foydalanuvchining ID raqamini kiriting!", backKeyboard);
      currentAdminState[chatId] = "awaiting_admin_id";
      break;
    case "delete_admin":
      bot.sendMessage(chatId, "O'chirmoqchi bo'lgan adminning ID raqamini kiriting!", backKeyboard);
      currentAdminState[chatId] = "awaiting_delete_admin_id";
      break;
  }
});