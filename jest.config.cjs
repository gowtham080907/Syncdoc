const isExperimentalEsm =
  process.execArgv.some((arg) => arg.includes('experimental-vm-modules')) ||
  (process.env.NODE_OPTIONS && process.env.NODE_OPTIONS.includes('experimental-vm-modules'));

module.exports = {
  testEnvironment: 'node',
  transform: isExperimentalEsm
    ? {}
    : {
        '^.+\\.(js|jsx|mjs)$': ['babel-jest', { configFile: require.resolve('./babel.config.cjs') }]
      },
  transformIgnorePatterns: [
    '/node_modules/(?!(yjs|lib0)/)'
  ]
};
