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
  endTime: null,
  msRemaining: 0,
};

let updateInterval = null;
const updateMs = 60 * 1000;

function updateStateSendMessage(client, channel) {
  if (state.focused && !state.paused) {
    state.msRemaining = state.endTime - Date.now();
    const minutes = Math.ceil(state.msRemaining / 1000 / 60);
    if (minutes > 0) {
      client.say(channel, `🧘 CJ is in focus mode right now and is not responding to chat. ⏳ Focus mode will end in about ${minutes} minute${minutes > 1 ? 's' : ''}.`);
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

export default {
  name: commands.focusStart,
  permission: permissions.broadcaster,
  aliases: [commands.focusPause, commands.focusResume, commands.focusEnd],
  async handler({
    client,
    args: {
      commandName,
      commandArgs,
    },
    channel,
  }) {
    if (commandName === commands.focusStart && !state.focused && !state.paused) {
      const [minutes] = commandArgs;
      state.focused = true;
      state.endTime = Date.now() + (1000 * 60 * minutes);
      client.say(channel, `🧘 Focus mode started. ⏳ Focus mode will end in ${minutes} minutes.`);
      updateInterval = setInterval(() => {
        updateStateSendMessage(client, channel);
      }, updateMs);
    } else if (commandName === commands.focusPause && state.focused && !state.paused) {
      state.paused = true;
      state.msRemaining = state.endTime - Date.now();
      client.say(channel, '⏸🧘 Focus mode paused.');
      clearInterval(updateInterval);
    } else if (commandName === commands.focusResume && state.focused && state.paused) {
      state.paused = false;
      state.endTime = Date.now() + state.msRemaining;
      const minutes = Math.ceil(state.msRemaining / 1000 / 60);
      client.say(channel, `▶️🧘 Focus mode resumed. ⏳ Focus mode will end in about ${minutes} minute${minutes > 1 ? 's' : ''}.`);
      updateInterval = setInterval(() => {
        updateStateSendMessage(client, channel);
      }, updateMs);
    } else if (commandName === commands.focusEnd && state.focused && !state.paused) {
      state.focused = false;
      state.paused = false;
      state.endTime = null;
      state.msRemaining = 0;
      client.say(channel, '🛑🧘 Focus mode ended.');
      clearInterval(updateInterval);
    }
  },
};