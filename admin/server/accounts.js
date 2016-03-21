// http://docs.meteor.com/#/full/accounts_validateloginattempt
Accounts.validateLoginAttempt(function(attemptInfo) {
  var userId = attemptInfo.user._id;
  if (!Roles.userIsInRole(userId, "admin")) {
    throw new Meteor.Error("not-allowed", "You need to have admin rights to login.");
  }
  return true;
});
