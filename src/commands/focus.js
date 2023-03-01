import permissions from '../lib/permissions.js';

const commands = {
  focusStart: 'focus-start',
  focusPause: 'focus-pause',
  focusResume: 'focus-resume',
  focusEnd: 'focus-end',
};

const state = {
  focused: false,
  paused: false,
  indefinite: false,
  endTime: null,
  msRemaining: 0,
};

let updateInterval = null;
const updateMs = 60 * 1000;

function updateStateSendMessage(client, channel) {
  if (state.focused && !state.paused) {
    state.msRemaining = state.endTime - Date.now();
    const minutes = Math.ceil(state.msRemaining / 1000 / 60);
    if (state.indefinite || minutes > 0) {
      client.say(channel, `!info 🧘 CJ is in focus mode right now and is not responding to chat. ${getStatusMessage()}`);
    } else {
      state.focused = false;
      state.paused = false;
      state.endTime = null;
      state.msRemaining = 0;
      client.say(channel, '🛑🧘 Focus mode ended.');
      clearInterval(updateInterval);
    }
  }
}

function getStatusMessage() {
  if (state.indefinite) return '';
  return `⏳ Focus mode will end in about ${state.minutes} minute${state.minutes > 1 ? 's' : ''}.`;
}

export default {
  name: commands.focusStart,
  permission: permissions.broadcaster,
  aliases: [commands.focusPause, commands.focusResume, commands.focusEnd],
  platforms: {
    twitch: true,
  },
  async handler({
    twitchClient,
    args: {
      commandName,
      commandArgs,
    },
    channel,
  }) {
    if (commandName === commands.focusStart && !state.focused && !state.paused) {
      const [minutes] = commandArgs;
      state.focused = true;
      if (minutes) {
        state.endTime = Date.now() + (1000 * 60 * minutes);
      } else {
        state.indefinite = true;
      }
      twitchClient.say(channel, `🧘 Focus mode started. ${getStatusMessage()}`);
      updateInterval = setInterval(() => {
        updateStateSendMessage(twitchClient, channel);
      }, updateMs);
    } else if (commandName === commands.focusPause && state.focused && !state.paused) {
      state.paused = true;
      state.msRemaining = state.endTime - Date.now();
      twitchClient.say(channel, '⏸🧘 Focus mode paused.');
      clearInterval(updateInterval);
    } else if (commandName === commands.focusResume && state.focused && state.paused) {
      state.paused = false;
      state.endTime = Date.now() + state.msRemaining;
      const minutes = Math.ceil(state.msRemaining / 1000 / 60);
      twitchClient.say(channel, `▶️🧘 Focus mode resumed. ${getStatusMessage()}`);
      updateInterval = setInterval(() => {
        updateStateSendMessage(twitchClient, channel);
      }, updateMs);
    } else if (commandName === commands.focusEnd && state.focused && !state.paused) {
      state.focused = false;
      state.paused = false;
      state.endTime = null;
      state.indefinite = false;
      state.msRemaining = 0;
      twitchClient.say(channel, '🛑🧘 Focus mode ended.');
      clearInterval(updateInterval);
    }
  },
};