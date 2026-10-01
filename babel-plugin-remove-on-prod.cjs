/**
 * babel-plugin-remove-on-prod.cjs
 *
 * Strips any node tagged with a leading `// @remove-on-prod` comment
 * when the build runs with NODE_ENV=production. Useful for hiding
 * dev-only `console.log` / debug blocks from production bundles.
 */
module.exports = function () {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    return { visitor: {} };
  }

  const shouldRemove = (path) => {
    const comments = path.node.leadingComments || [];
    return comments.some(c => c.value.includes("@remove-on-prod"));
  };

  return {
    visitor: {
      ExpressionStatement(path) {
        if (shouldRemove(path)) path.remove();
      },
      VariableDeclaration(path) {
        if (shouldRemove(path)) path.remove();
      },
      FunctionDeclaration(path) {
        if (shouldRemove(path)) path.remove();
      },
      IfStatement(path) {
        if (shouldRemove(path)) path.remove();
      },
      ReturnStatement(path) {
        if (shouldRemove(path)) path.remove();
      },
      ObjectProperty(path) {
        if (shouldRemove(path)) path.remove();
      },
    },
  };
};