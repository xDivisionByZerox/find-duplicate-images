module.exports = {
  entry: './src/frontend/frontend.ts',
  mode: 'production',
  output: {
    path: __dirname + '/dist/frontend',
    filename: 'frontend.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ],
  },
}