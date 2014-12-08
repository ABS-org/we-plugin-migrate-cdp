module.exports = function generateRandonUserName(username) {
  if(!username || typeof username !== 'string') {
    return crypto.randomBytes(8).toString('hex');
  }

  var userNomeNew = username.toString().split('@')[0];
  userNomeNew += crypto.randomBytes(3).toString('hex');
  return userNomeNew;
}
