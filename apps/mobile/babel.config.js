module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // expo-router requires this for file-based routing
      require.resolve('expo-router/babel'),
    ],
  };
};
