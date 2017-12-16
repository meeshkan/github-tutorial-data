module.exports.handler = function(event, context, callback) {
  require("./dist/index.js").default(event, context, callback);
}
