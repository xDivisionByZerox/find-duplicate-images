const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const outputDir = path.resolve(__dirname, '../..', 'dist', 'frontend');

/**
 * 
 * @param {string} name 
 * @returns 
 */
function getCopyDefinition(name) {
  return {
    from: path.resolve(__dirname, name),
    to: path.resolve(outputDir, name),
  }
}

/**
 * @type {import('webpack').WebpackOptionsNormalized}
 */
module.exports = {
  entry: path.resolve(__dirname, 'frontend.ts'),
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'frontend.js',
    path: outputDir,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        getCopyDefinition('images'),
        getCopyDefinition('styles'),
        getCopyDefinition('frontend.html'),
      ],
    }),
  ],
};