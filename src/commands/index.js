import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';

import textCommands from '../textCommands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const files = fs.readdirSync(__dirname);

let commandsByName = null;
export async function getCommands() {
  if (commandsByName) return commandsByName;
  commandsByName = new Map();
  await Promise.all(files.map(async (fileName) => {
    if (fileName !== 'index.js') {
      const { default: command } = await import(path.join(__dirname, fileName));
      commandsByName.set(command.name, command);
      command.aliases.forEach(alias => commandsByName.set(alias, command));
    }
  }));
  const { data } = await axios.get('https://streamlabs.com/api/v6/6e172f69522914b/cloudbot/commands');
  data.forEach((streamlabsCommand) => {
    if (streamlabsCommand.response) {
      const command = {
        name: streamlabsCommand.command.substring(1),
        aliases: [],
        platforms: {
          youtube: true,
        },
        handler: ({
          youtubeClient,
        }) => {
          youtubeClient.say(streamlabsCommand.response);
        }
      }
      commandsByName.set(command.name, command);
    }
  })
  textCommands.forEach(command => {
    commandsByName.set(command.name, command);
    command.aliases.forEach(alias => commandsByName.set(alias, command));
  });
  return commandsByName;
}


