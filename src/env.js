import dotenv from 'dotenv';

dotenv.config();

const {
  TWITCH_OAUTH_TOKEN,
  TWITCH_CLIENT_ID,
  BOT_USERNAME,
  CHANNEL_NAME,
  CHANNEL_ID,
  TEAM_NAME,
  YOUTUBE_BOT_REFRESH_TOKEN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  CG_API_URL,
  CG_API_KEY,
} = process.env;

const env = {
  TWITCH_OAUTH_TOKEN,
  TWITCH_CLIENT_ID,
  BOT_USERNAME,
  CHANNEL_NAME,
  CHANNEL_ID,
  TEAM_NAME,
  YOUTUBE_BOT_REFRESH_TOKEN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  CG_API_URL,
  CG_API_KEY,
};

Object
  .entries(env)
  .forEach(([name, value]) => {
    if (!value) {
      throw new Error(`${name} is not specified in the .env file!`);
    }
  });

export default env;
