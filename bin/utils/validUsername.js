module.exports = function validUsername(username){
  var restrictedUsernames = [
    'logout',
    'login',
    'auth',
    'api',
    'account',
    'user'
  ];

  if (restrictedUsernames.indexOf(username) >= 0) {
    return false;
  }

  if(username.indexOf('@') > -1 ) {
    return false;
  } else {
    return true;
  }

  // if(usernameRegex.test(username)){
  //   return true;
  // }

  return false;
}