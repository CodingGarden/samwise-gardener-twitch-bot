import permissions from './lib/permissions.js';

export default [].map((command) => {
  command.handler = ({
    client,
    channel,
  }) => client.say(channel, command.message);
  return command;
});
