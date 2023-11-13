module.exports = api => {
  const isTest = api.env('test');
  return {
    presets: ['@deephaven/babel-preset'],
    babelrcRoots: ['.', 'plugins/*/src/js'],
    ignore: [
      !isTest ? /\.test.(tsx?|jsx?)$/ : false,
      !isTest ? '**/__mocks__/*' : false,
      '**/*.scss',
    ].filter(Boolean),
  };
};
