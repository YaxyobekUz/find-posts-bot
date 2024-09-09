const userKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [[{ text: "Premium a'zolik ✨" }, { text: "Bog'lanish ☎️" }]],
  },
};

const premiumMembershipInlineKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [{ text: "A'zo bo'lish ⭐️", url: "https://t.me/mryaxyobek" }],
      [{ text: "Ba'tafsil ma'lumot 📄", url: "https://t.me/mryaxyobek" }],
    ],
  },
};

const contactInlineKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [{ text: "Admin 👤", url: "https://t.me/mryaxyobek" }],
      [{ text: "Bot 🤖", url: "https://t.me/mryaxyobek" }],
    ],
  },
};

module.exports = { userKeyboards, premiumMembershipInlineKeyboards, contactInlineKeyboards };
