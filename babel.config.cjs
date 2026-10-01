module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
  plugins: [
    ...(process.env.NODE_ENV === "production"
      ? ["./babel-plugin-remove-on-prod.cjs"]
      : []),
  ],
};
