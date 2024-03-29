const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const smp = new SpeedMeasurePlugin();
const pathResolve = p => path.resolve(__dirname, p);
const useSmp = false;
const wrapConfig = useSmp ? smp.wrap : (x) => x;
module.exports = wrapConfig({
  cache: {
    type: "filesystem",
  },
  entry: {
    main: "./src/index.tsx",
    bg: "./src/background.ts",
  },
  // devtool: "inline-source-map",
  devtool: false,
  output: {
    path: pathResolve("build/src"),
    filename: "[name].js",
  },
  optimization: {
    splitChunks: {}
  },
  // 执行顺序是数组从右往左
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react", "@babel/preset-env"],
          },
          options: {
            cacheDirectory: true,
            cacheCompression: true
          }
        },
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          process.env.NODE_ENV == 'development' ? { loader: 'style-loader' } : MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                config: pathResolve("postcss.config.js"),
              }
            }
          }],
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: pathResolve("./home.html"),
    }),
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "images", to: "../images" },
        { from: "manifest.json", to: "../" },
        // { from: "lib", to: "lib" },
      ]
    }),
    new MonacoWebpackPlugin({
      languages: ['json']
    })
  ],
  externals: {
    react: "React",
    'react-dom': "ReactDOM",
  }
});
