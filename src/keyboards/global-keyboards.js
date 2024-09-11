const backKeyboard = {
  parse_mode: "Markdown",
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [[{ text: "◀️ Bekor qilish", }]],
    remove_keyboard: true,
  },
};



module.exports = { backKeyboard };
