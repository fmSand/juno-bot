export const imDadTrigger = {
  match: (message) => ["I'm ", "Im ", "im ", "i'm "].some((w) => message.content.startsWith(w)),

  run: (message) => {
    const split = message.content.split(" ");
    const name = split[1] ? split[1][0].toUpperCase() + split[1].slice(1) : "stranger";

    return message.reply(`Hi, ${name}. I'm Troll Bot!`);
  },
};
