const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry:{
    calendarprinter: path.resolve(__dirname, './src/CalendarPrinter.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },  
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      { 
        test: /\.js$/, 
        exclude: /node_modules/, 
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            {
              plugins: [
                '@babel/plugin-proposal-class-properties'
              ]
            }
          ]
        },
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    index: 'index.html',
    compress: true,
    port: 9000,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/calendar.html'),
      filename: path.resolve(__dirname, 'dist/index.html'),
      language: "en",
      title: "Calendar",
      copyrightYear: "2020"
    })
  ]
};