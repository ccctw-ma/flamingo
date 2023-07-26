const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const pathResolve = p => path.resolve(__dirname, p);
module.exports = {
  entry: "./src/index.tsx",
  // devtool: "inline-source-map",
  output: {
    path: pathResolve("build/src"),
    filename: "main.js",
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
        },
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: pathResolve("./src/html/index.html"),
    }),
    new CleanWebpackPlugin(),
    // new CopyPlugin({
    //   patterns: [
    //     { from: "images", to: "images" },
    //     { from: "lib", to: "lib" },
    //     "manifest.json",
    //   ]
    // })
  ],
  externals: {
    react: "React",
    'react-dom': "ReactDOM",
  }
};
