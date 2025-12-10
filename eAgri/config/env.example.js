// Copy this file to eAgri/config/env.js and fill in real values.
// eAgri/config/env.js is gitignored — never commit it.
//
// The backend address is NOT here: it lives in config/apiConfig.js, which is
// committed because it holds no secrets.

const ENV_CONFIG = {
  // https://openweathermap.org/api — free tier is enough for WeatherScreen.
  OPENWEATHER_API_KEY: 'your_openweathermap_api_key',
};

export default ENV_CONFIG;
