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

module.exports = { ownerKeyboards };
