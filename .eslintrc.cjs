module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true
  },
  parserOptions: { 
    sourceType: "module",
    ecmaVersion: 2020
  },
  plugins: ["prettier"],
  extends: ["prettier", "eslint:recommended"],
  rules: {
    "prettier/prettier": "error",
  }
};
