/* eslint-env node */

const fs = require("fs");
const path = require("path");
const selfsigned = require("selfsigned");

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
    https: createHTTPSConfig(),
    disableHostCheck: true
  }
});

function createHTTPSConfig() {
  if (fs.existsSync(path.join(__dirname, "certs"))) {
    const key = fs.readFileSync(path.join(__dirname, "certs", "key.pem"));
    const cert = fs.readFileSync(path.join(__dirname, "certs", "cert.pem"));
    return { key, cert };
  } else {
    const pems = selfsigned.generate([{ name: "commonName", value: "localhost" }], { days: 365, algorithm: "sha256" });
    fs.mkdirSync(path.join(__dirname, "certs"));
    fs.writeFileSync(path.join(__dirname, "certs", "cert.pem"), pems.cert);
    fs.writeFileSync(path.join(__dirname, "certs", "key.pem"), pems.private);
    return { key: pems.private, cert: pems.cert };
  }
}
