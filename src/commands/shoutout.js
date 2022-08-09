import permissions from '../lib/permissions.js';
import * as twitchAPI from '../twitchAPI.js';

export default {
  name: 'shoutout',
  permission: permissions.vip,
  aliases: ['so', 'shout'],
  async handler({ client, args: { name: senderName, commandArgs }, channel }) {
    const [username] = commandArgs;
    if (!username) return;
    try {
      const {
        game_name,
        title,
        broadcaster_name,
        broadcaster_login,
      } = await twitchAPI.getChannelByUsername(username.replace('@', ''));
      const showName = broadcaster_name.match(/\W/) ? broadcaster_login : broadcaster_name;
      client.say(channel, `Checkout @${showName}! https://twitch.tv/${showName} They were last seen streaming - ${title} in ${game_name}`);
    } catch (error) {
      console.log(error);
      client.say(channel, `@${senderName} "${username}" was not found. Are you trying to hack me?`);
    }
  },
};
