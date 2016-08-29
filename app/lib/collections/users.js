/**
 * The schema for the 'Meteor.users' collection is defined
 * within the private package coca:common which is shared between
 * this project and the admin app project.
 */

Meteor.users.allow({
  update: function (userId, doc, fields, modifier) {
    // TODO Maybe define more stringent permission rules
    return userId;
  }
});


// ------------------------------------------------------------------------------------------- //
// ----------------------------------------- Methods ----------------------------------------- //
// ------------------------------------------------------------------------------------------- //

Meteor.methods({
  /**
   * Meteor method that gets called from the createAccountForm template.
   * We need to use a method here that in turn calls the 'Accounts.createUser()'
   * function because we use the package 'useraccounts:bootstrap' for the
   * 'bullseye' route which does not allow to create a new account from the client,
   * thus, resulting in a 'signups forbidden' error.
   * @param {Object} userObj - The user data received from the client.
   * cf. https://github.com/meteor-useraccounts/core/issues/96
   * cf. https://forums.meteor.com/t/signups-forbidden-error/21277
   */
  "makeNewUser": function(userObj) {
    // We run this operation only on server-side
    if (!this.isSimulation) {
      // check arguments
      check(userObj, Object);
      var newUserId;
      newUserId = Accounts.createUser(userObj);
      m = {};
      m.date = new Date();
      m.locus = "SERVER: makeNewUser";
      m.info = " user " + userObj.username + " after Accounts.createUser";
      DebugMessages.insert(m);
      return newUserId;
    }
  }
});
