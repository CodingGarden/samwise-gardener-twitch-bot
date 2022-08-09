// @ts-check
import tmi from 'tmi.js';

import config from './config.js';
import { getCommands } from './commands/index.js';
import permissions from './lib/permissions.js';

// @ts-ignore
const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: config.BOT_USERNAME,
    password: config.TWITCH_OAUTH_TOKEN,
  },
  channels: [config.CHANNEL_NAME],
});

const sortedPermissions = Object
  .entries(permissions)
  .sort(([, aValue], [, bValue]) => bValue - aValue);

function getUserLevel(badges) {
  const [, value = permissions.user] = sortedPermissions
    .find(([permission]) => badges[permission]) || [];
  return value;
  // TODO: check if user is follower...
}

function hasPermission(permission, badges) {
  return getUserLevel(badges) >= permission;
}

async function initBot() {
  const commandsByName = await getCommands();
  client.connect();
  client.on('message', async (channel, tags, message, self) => {
    if (self) return;
    if (tags['message-type'] === 'whisper') return;
    if (!message.startsWith('!')) return;
    const commandArgs = message.split(' ');
    const commandName = commandArgs.shift().slice(1);
    const commandInfo = commandsByName.get(commandName);
    if (!commandInfo) return;
    tags.badges = tags.badges || {};
    if (!hasPermission(commandInfo.permission, tags.badges)) {
      // eslint-disable-next-line consistent-return
      return client.say(channel, `@${tags.username} you do not have permission to use the command "${commandName}". 🚨👮 This incident has been reported to the internet police. 👮🚨`);
    }
    const {
      'message-type': messageType,
      'user-id': userId,
      'display-name': displayName,
      username,
    } = tags;
    const name = displayName || username;
    const args = {
      ...tags,
      messageType,
      userId,
      displayName,
      username,
      name,
      commandName,
      commandArgs,
    };
    commandInfo.handler({
      client,
      channel,
      args,
    });
  });
}

initBot();
