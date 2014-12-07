var regExp = /\(([^)]+)\)/;

/**
 * Parse state code from CDP drupal state
 * @param  {string} string state with code like (SP)
 * @return {[string]}        like SP
 */
module.exports = function(string) {
  if(!string) return null;
  var matches = regExp.exec(string);
  return matches[1];
}
