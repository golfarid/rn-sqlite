module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: [
        [
          'module:react-native-builder-bob/babel-preset',
          { modules: 'commonjs' },
        ],
      ],
      plugins: ['@babel/plugin-transform-export-namespace-from'],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
