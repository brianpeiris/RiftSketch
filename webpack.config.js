module.exports = {
  entry: "./js/index.js",
  output: {
    path: "./",
    filename: "bundle.js"
  },
	module: {
		loaders: [
			{ test: /\.(eot|ttf|woff|woff2|svg)$/, loader: "url-loader" }
		]
	}
};
