const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    alias: {
      '@': './src',
    },
    platforms: ['ios', 'android', 'native', 'web'],
    // Ensure proper Node.js polyfills are not included for React Native
    resolverMainFields: ['react-native', 'browser', 'main'],
    blacklistRE: /(node_modules\/.*\/node_modules\/react-native\/.*)|(node_modules\/react-native\/Libraries\/react-native\/react-native-implementation\.js$)/,
  },
  watchFolders: [],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);