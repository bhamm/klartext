const path = require('path');

/**
 * Webpack configuration for the Klartext extension
 * 
 * This configuration builds three main components:
 * 1. background - The background script (service worker)
 * 2. content - The content script injected into web pages
 * 3. settings - The extension settings UI
 */
module.exports = {
  mode: 'development',
  devtool: 'source-map',
  experiments: {
    topLevelAwait: true // Enable top-level await in modules
  },
  entry: {
    // Entry points for each component
    background: './src/background/background.ts', // Background service worker
    content: './src/content/index.js',           // Content script (updated to use modular architecture)
    settings: './src/settings/index.ts'          // Settings UI (refactored to modular architecture with TypeScript)
  },
  output: {
    path: path.resolve(__dirname, 'dist'),    // Output to dist directory
    filename: '[name]/[name].js'              // Create separate directories for each entry point
  },
  module: {
    rules: [
      // TypeScript files processing
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      // JavaScript files processing
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']    // Use modern JavaScript features
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],       // File extensions to resolve
    alias: {
      '@': path.resolve(__dirname, 'src')     // Allow imports using @ as src directory
    }
  }
};
