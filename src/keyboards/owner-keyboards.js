const parse_mode = "Markdown";

const ownerKeyboards = {
  parse_mode,
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [
      [{ text: "Postlar 📮" }, { text: "Statistika 📊" }],
      [{ text: "Adminlar 👥" }, { text: "Xavfsizlik 🔐" }],
      [{ text: "Homiy kanallar 📣" }, { text: "Sozlamalar ⚙️" }],
    ],
  },
};

const controlAdminsInlineKeyboards = {
  parse_mode,
  reply_markup: {
    remove_keyboard: true,
    resize_keyboard: true,
    one_time_keyboard: false,
    inline_keyboard: [
      [{ text: "Admin qo'shish ⏬", callback_data: "add_admin" }],
      [{ text: "Adminni o'chirish 🗑", callback_data: "delete_admin" }],
    ],
  },
};

module.exports = { ownerKeyboards, controlAdminsInlineKeyboards };
