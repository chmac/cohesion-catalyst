Accounts.onCreateUser(function(options, user) {
  var message = {};
  message.date = new Date();
  message.locus = "SERVER: Accounts.onCreateUser.";
  message.info = "Creating user: " + user.username;
  DebugMessages.insert(message);

  if (options.profile) {
    user.profile = options.profile;

    // Add the new user to the 'players' field (an array) of the current training document.
    if (options.profile.currentTraining) {
      Trainings.update(options.profile.currentTraining, {
        $push: {players: user._id}
      }, function(error, result) {
        if (error) {
          var message = {};
          message.date = new Date();
          message.locus = "SERVER: Accounts.onCreateUser";
          message.info = "Error while updating training document. Reason: " + error.reason;
          DebugMessages.insert(message);
        }
      });
    }
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
  var message = {};
  message.date = new Date();
  message.locus = "SERVER: Accounts.validateLoginAttempt";
  message.details = attemptInfo;
  DebugMessages.insert(message);

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


/**
 * Called after a login attempt is denied.
 * This method is provided by Meteor's account system.
 * cf. http://docs.meteor.com/api/accounts-multi.html#AccountsCommon-onLoginFailure
 *
 * Here, we create a debug message to inform about possible issues.
 * @param {Object} attemptInfo - An object containing information about the
 * login attempt.
 */
Accounts.onLoginFailure(function(attemptInfo) {
  var message = {};
  message.date = new Date();
  message.locus = "SERVER: Accounts.onLoginFailure";
  message.details = attemptInfo;
  DebugMessages.insert(message);
});
