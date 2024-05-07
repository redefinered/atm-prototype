import axios from 'axios';

export const getToken = async () => {
  const qs = require('qs');
  let data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  let config = {
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  };

  return (await axios.request(config)).data;
};
