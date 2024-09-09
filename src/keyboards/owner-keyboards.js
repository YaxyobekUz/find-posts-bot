const ownerKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [
      [{ text: "Postlar 📮" }, { text: "Statistika 📊" }],
      [{ text: "Adminlar 👥" }, { text: "Xavfsizlik 🔐" }],
    ],
  },
};

const controlAdminsInlineKeyboards = {
  parse_mode: "Markdown",
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
