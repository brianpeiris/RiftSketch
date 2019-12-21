module.exports = {
  env: {
    browser: true,
    es6: true
  },
  plugins: ["prettier"],
  extends: ["prettier", "eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "prettier/prettier": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
};
