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
  if (!attemptInfo.allowed) {
    return false;
  }
  var userId = attemptInfo.user._id;
  if (!Roles.userIsInRole(userId, "admin")) {
    throw new Meteor.Error("not-allowed", "You need to have admin rights to login.");
  }
  return true;
});


Accounts.onCreateUser(function(options, user) {

  if (options.profile) {
    user.profile = options.profile;
  }

  // Add the new user to the 'players' field (an array) of the current training document.
  if (options.profile.currentTraining) {
    Trainings.update(options.profile.currentTraining, {
      $push: {players: user._id}
    });
  }

  return user;
});
