import axios from 'axios';
import config from '../config.js';

let tokenInfo = null;

async function getAccessToken() {
  const {
    data,
  } = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: config.GOOGLE_CLIENT_ID,
    client_secret: config.GOOGLE_CLIENT_SECRET,
    refresh_token: config.YOUTUBE_BOT_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  data.expires_time = Date.now() + ((data.expires_in - 1) * 1000);
  return data;
}

export async function sendMessage(liveChatId, messageText) {
  if (!tokenInfo || tokenInfo.expires_time < Date.now()) {
    tokenInfo = await getAccessToken();
  }
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      access_token: tokenInfo.access_token,
    });
    const {
      data,
    } = await axios.post(`https://www.googleapis.com/youtube/v3/liveChat/messages?${params}`, {
      snippet: {
        type: 'textMessageEvent',
        liveChatId,
        textMessageDetails: {
          messageText,
        },
      },
    });
    return data;
  } catch (error) {
    error.data = error.response ? error.response.data : {};
    throw error;
  }
}
