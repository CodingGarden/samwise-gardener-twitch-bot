// @ts-check
import tmi from 'tmi.js';
import io from 'socket.io-client';
import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';

import config from './config.js';
import { getCommands } from './commands/index.js';
import permissions from './lib/permissions.js';
import { sendMessage } from './lib/youtubeAPI.js';

// @ts-ignore
const twitchClient = new tmi.Client({
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

async function init() {
  const commandsByName = await getCommands();
  async function initTwitchBot() {
    twitchClient.connect().then(() => console.log('Twitch bot listening...'));
    twitchClient.on('message', async (channel, tags, message, self) => {
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
        return twitchClient.say(channel, `@${tags.username} you do not have permission to use the command "${commandName}". 🚨👮 This incident has been reported to the internet police. 👮🚨`);
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
        twitchClient,
        channel,
        args,
      });
    });
  }

  function splitIntoSentences(sentence) {
    const maxLen = 180;
    const words = sentence.split(' ');
    const sentences = [];
    let currentSentence = '';
    
    words.forEach((word, index) => {
      const newSentence = currentSentence + (currentSentence === '' ? '' : ' ') + word;
      
      if (newSentence.length > maxLen) {
        sentences.push(currentSentence);
        currentSentence = word;
      } else if (index === words.length - 1) {
        sentences.push(newSentence);
      } else {
        currentSentence = newSentence;
      }
    });
    
    return sentences;
  }
  
  async function initYouTubeBot() {
    const socket = io(`${config.CG_API_URL}?key=${config.CG_API_KEY}`, {
      upgrade: false,
      transports: ['websocket'],
    });
    const client = feathers();
  
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    client.configure(socketio(socket), {
      timeout: 30_000,
    });
  
    socket.on('connect', () => {
      console.log('YT bot connected...');
    });
  
    const youtubeCommands = client.service('youtube/commands');
    youtubeCommands.on('created', (message) => {
      const content = message.message;
      if (!content.startsWith('!')) return;
      const commandArgs = content.split(' ');
      const commandName = commandArgs.shift().slice(1);
      const commandInfo = commandsByName.get(commandName);
      if (!commandInfo) return;
      if (commandInfo.platforms.youtube) {
        commandInfo.handler({
          youtubeClient: {
            async say(text) {
              try {
                const sentences = splitIntoSentences(text);
                await sentences.reduce(async (promise, part, index) => {
                  await promise;
                  const current = sentences.length > 1 ? ` (${index + 1}/${sentences.length})` : '';
                  await sendMessage(message.live_chat_id, `!info ${current} ${part}`);
                  await new Promise((resolve) => setTimeout(resolve, 300));
                }, Promise.resolve());
              } catch (error) {
                console.error(error.message);
                console.error(error.data);
              }
            }
          }
        })
      }
    });
  }
  
  initTwitchBot();
  initYouTubeBot();  
}

init();