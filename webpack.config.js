/* eslint-env node */

module.exports = (env, argv) => ({
  entry: "./js/index.js",
  output: {
    path: __dirname
  },
  optimization: {
    splitChunks: {
      chunks: "all"
    }
  },
  devtool: argv.mode === "production" ? "source-map" : "inline-source-map",
  devServer: {
    host: "0.0.0.0",
    disableHostCheck: true
  }
});
