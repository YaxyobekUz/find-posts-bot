const adminKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [[{ text: "Postlar 📮", }, { text: "Statistika 📊" },],],
  },
};

const controlPostsInlineKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    remove_keyboard: true,
    resize_keyboard: true,
    one_time_keyboard: false,
    inline_keyboard: [
      [{ text: "Postni qidirish", callback_data: "search_post" }],
      [{ text: "Yangi post qo'shish", callback_data: "add_post" }],
      [{ text: "Postni tahrirlash", callback_data: "edit_post" }],
    ],
  },
};

module.exports = { adminKeyboards, controlPostsInlineKeyboards };
