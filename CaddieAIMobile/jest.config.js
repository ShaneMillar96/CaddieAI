module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@rnmapbox/maps/setup-jest'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@rnmapbox)/)',
  ],
};
