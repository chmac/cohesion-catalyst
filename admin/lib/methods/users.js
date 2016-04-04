// ------------------------------------------------------------------------ //
// Collection hooks
// ------------------------------------------------------------------------ //

// Before a user is removed from the DB we logout this user.
// cf. http://stackoverflow.com/questions/20515989/how-can-i-log-out-a-user-from-the-server-in-meteor-js
// cf. http://stackoverflow.com/questions/31419541/meteorjs-force-logout-of-client-when-user-record-deleted
Meteor.users.before.remove(function(userId, doc) {
  Meteor.users.update(doc._id, {
    $set: {
      "services.resume.loginTokens": []
    }
  });
});
// When a user is removed from the DB we want to remove all their created ids.
Meteor.users.after.remove(function(userId, doc) {
  Identifications.remove({createdBy: doc._id});
});

// TODO add collection hook after (before?) updating 'blocked' users

// ------------------------------------------------------------------------ //
// Methods
// ------------------------------------------------------------------------ //
Meteor.methods({

  "users.remove": function(id) {

    // Make sure id is a string.
    check(id, String);

    // Only admins have the right to remove a user.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("users.remove.not-authorized",
        "Must be admin to remove a user.");
    }

    // Prevent admin user from deleting itself.
    if (this.userId == id) {
      throw new Meteor.Error("users.remove.not-allowed",
        "Cannot delete your own user account.");
    }

    return Meteor.users.remove(id);

  }

});
