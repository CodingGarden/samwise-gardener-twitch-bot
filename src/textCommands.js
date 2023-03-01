import permissions from './lib/permissions.js';

export default [{
  name: 'ping',
  aliases: [],
  message: 'pong',
  platforms: {
    youtube: true,
  },
}].map((command) => {
  command.handler = ({
    twitchClient,
    youtubeClient,
    channel,
  }) => {
    if (twitchClient) {
      twitchClient.say(channel, command.message);
    }
    if (youtubeClient) {
      youtubeClient.say(command.message);
    }
  };
  return command;
});
