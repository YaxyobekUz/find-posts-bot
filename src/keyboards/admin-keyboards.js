const adminKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [[{ text: "Postlar 📮", }, { text: "Statistika 📊" },],],
  },
};

const securityInlineKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    resize_keyboard: true,
    inline_keyboard: [
      [{ text: "Postlar ma'lumoti 📮", callback_data: "posts_data" },],
      [{ text: "Adminlar ma'lumoti 👥", callback_data: "admins_data" },],
    ],
  },
};

const controlPostsInlineKeyboards = {
  parse_mode: "Markdown",
  reply_markup: {
    remove_keyboard: true,
    inline_keyboard: [
      [{ text: "Postni qidirish 🔍", callback_data: "search_post" }],
      [{ text: "Yangi post qo'shish ⏬", callback_data: "add_post" }],
      [{ text: "Postni tahrirlash 📝", callback_data: "edit_post" }],
    ],
  },
};

module.exports = { adminKeyboards, controlPostsInlineKeyboards, securityInlineKeyboards };
