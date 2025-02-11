module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  // Handle Chrome extension specific features
  assumptions: {
    // Support for class properties
    setPublicClassFields: true,
  },
  // Ignore node_modules except for test files
  ignore: [
    'node_modules/(?!(@testing-library|jest-dom)/)',
  ],
};
