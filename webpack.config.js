const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CopyPlugin = require("copy-webpack-plugin");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { HotModuleReplacementPlugin, ProgressPlugin } = require("webpack");
const { webpack } = require("webpack");
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
  devtool: "inline-source-map",
  // devtool: false,
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
    // new BundleAnalyzerPlugin(),
    // new ProgressPlugin(),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: pathResolve("./home.html"),
    }),
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        // { from: "images", to: "images" },
        // { from: "lib", to: "lib" },
        { from: "manifest.json", to: "../" },
        { from: "rules.json", to: "../" }
      ]
    }),
    new MonacoWebpackPlugin({
      languages: ['json', 'typescript']
    })
  ],
  externals: {
    react: "React",
    'react-dom': "ReactDOM",
  }
});
