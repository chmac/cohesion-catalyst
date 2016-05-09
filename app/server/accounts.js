Accounts.onCreateUser(function(options, user) {

  if (options.profile) {
    user.profile = options.profile;
  }

  // Add the new user to the 'players' field (an array) of the current training document.
  if (options.profile.currentTraining) {
    Trainings.update(options.profile.currentTraining, {
      $push: {players: user._id}
    }, function(error, result) {
      if (error) {
        // TODO Improve error handling.
        console.log("Error while updating document. Reason: ", error.reason);
      }
    });
  }

  return user;
});



/**
 * Validates the attempted login.
 * This method is provided by Meteor's account system.
 * cf. http://docs.meteor.com/#/full/accounts_validateloginattempt
 *
 * Here, we check if the account of the user who tries to log in is blocked.
 * @param {Object} attemptInfo - An object containing information about
 * the login attempt (e.g. attemptInfo.user holds the Meteor user object).
 * @return {Boolean} True if attempted login is successful, otherwise a
 * Meteor.Error is thrown for blocked user accounts which aborts the login.
 */
Accounts.validateLoginAttempt(function(attemptInfo) {

  if (!attemptInfo.allowed) {
    return false;
  }

  var user = attemptInfo.user;

  if (user && user.blocked) {
    throw new Meteor.Error("not-allowed", "Cannot login to blocked user account.");
  }

  if (user && Roles.userIsInRole(user._id, "admin")) {
    throw new Meteor.Error("not-allowed", "You are not allowed to login.");
  }

  return true;
});
