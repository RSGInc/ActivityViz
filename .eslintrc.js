module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true
  },
  extends: "eslint:recommended",
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    $: "readonly",
    nv: "readonly",
    abmviz_utilities: "readonly",
    d3: "readonly",
    L: "readonly",
    geostats: "readonly",
    VIZI: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {}
};
