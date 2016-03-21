/**
 * Validates the attempted login.
 * This method is provided by Meteor's account system.
 * cf. http://docs.meteor.com/#/full/accounts_validateloginattempt
 *
 * Here, we check if the user who tries to log in has admin rights.
 * @param {Object} attemptInfo - An object containing information about
 * the login attempt (e.g. attemptInfo.user holds the Meteor user object).
 * @return {Boolean} True if attempted login is successful, otherwise a
 * Meteor.Error is thrown for non-admin users which aborts the login.
 */
Accounts.validateLoginAttempt(function(attemptInfo) {
  var userId = attemptInfo.user._id;
  if (!Roles.userIsInRole(userId, "admin")) {
    throw new Meteor.Error("not-allowed", "You need to have admin rights to login.");
  }
  return true;
});
