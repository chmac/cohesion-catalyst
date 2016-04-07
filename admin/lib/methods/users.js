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

// When the user doc is updated, we detect if there are any changes
// to the 'blocked' field. For a blocked user, we want to update their
// created identification documents
Meteor.users.after.update(function (userId, doc, fieldNames, modifier) {
  if (doc.blocked !== this.previous.blocked) {
    var editState = !doc.blocked;
    Identifications.update({createdBy: doc._id}, {
      $set: {
        editCompleted: editState
      }
    },
    {
      multi: true
    });
  }
});

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
  },


  "users.toggle.blocked": function(id) {

    // Make sure id is a string.
    check(id, String);

    // Only admins have the right to block/unblock a user.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("users.toggle.blocked.not-authorized",
        "Must be admin to block/unblock a user.");
    }

    var user = Meteor.users.findOne(id);
    if(!user) {
      throw new Meteor.Error("users.toggle.blocked.not-found",
        "Cannot find selected user in database.");
    }

    if (!user.blocked) {
      Meteor.users.update(id, {
        $set: {
          blocked: true,
          "services.resume.loginTokens": []
        }
      });
    } else {
      Meteor.users.update(id, {
        $set: {
          blocked: false
        }
      });
    }

    return "OK";
  }

}); // methods()
