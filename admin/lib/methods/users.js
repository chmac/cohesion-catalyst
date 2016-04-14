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

// When a user is removed from the DB we want to
// - remove all their created ids
// - remove the links associated with the ids
// - update the trainings collection to remove the user from the 'players' array
Meteor.users.after.remove(function(userId, doc) {
  Identifications.remove({
    createdBy: doc._id
  });
  Links.remove({
    "target.createdBy": doc._id,
    "source.createdBy": doc._id
  });
  Trainings.update({
    _id: doc.profile.currentTraining
  }, {
    $pull: {
      players: doc._id
    }
  });
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
  },

  "user.edit.add.role": function(id, role) {

    // Check arguments
    check(id, String);
    check(role, String);

    // Only admins have the right to edit a user.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("user.edit.add.role.not-authorized",
        "Must be admin to add role to user.");
    }

    Roles.addUsersToRoles(id, role);

    return "OK";
  },

  "user.edit.remove.role": function(id, role) {

    // Check arguments
    check(id, String);
    check(role, String);

    // Only admins have the right to edit a user.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("user.edit.remove.role.not-authorized",
        "Must be admin to add role to user.");
    }

    Roles.removeUsersFromRoles(id, role);

    return "OK";
  },

  "user.edit.change.password": function(doc) {

    // We cannot call 'Accounts.setPassword' from the client.
    if (this.isSimulation) {
      return;
    }
    // Check arguments
    check(doc, Object);
    check(doc._id, String);
    check(doc.password, String);

    // Only admins have the right to edit a user.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("user.edit.change.password.not-authorized",
        "Must be admin to change password.");
    }

    Accounts.setPassword(doc._id, doc.password);
  },

  "user.edit.reset": function(id) {

    // Check arguments
    check(id, String);

    // Only admins have the right to edit a user.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("user.edit.reset.not-authorized",
        "Must be admin to reset user identifications.");
    }

    // Remove all identifications except the avatar at root level.
    Identifications.remove({
      createdBy: id,
      level: {
        $gt: 0
      }
    });

    // Remove all links accordingly.
    Links.remove({
      "target.createdBy": id,
      "source.createdBy": id
    });
  },

  "user.edit.update.data": function(modifier, id) {

    // Check arguments
    check(id, String);
    check(modifier, Object);
    check(modifier.$set, Object);
    check(modifier.$set.profile, Match.Optional(AdminSchemas.UserProfile));
    check(modifier.$set.emails, Match.Optional([Object]));
    var eMails = modifier.$set.emails;
    check(eMails, Match.Optional(Match.Where(function(eMails) {
      _.each(eMails, function (obj) {
        // check() will throw error if there is a problem
        check(obj.address, Match.Optional(String));
        check(obj.verified, Match.Optional(Boolean));
      });
      // We return true if there is no problem
      return true;
    })));

    // Only admins have the right to edit a user.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("user.edit.update.data.not-authorized",
        "Must be admin to edit user data.");
    }

    return Meteor.users.update({_id: id}, modifier);
  },

  "user.create": function(doc) {
    // We run this operation only on server-side
    if (!this.isSimulation) {

      // check arguments
      check(doc, Object);
      check(doc.emails, Match.Optional([Object]));
      var eMails = doc.emails;
      check(eMails, Match.Optional(Match.Where(function(eMails) {
        _.each(eMails, function (obj) {
          // check() will throw error if there is a problem
          check(obj.address, Match.Optional(String));
          check(obj.verified, Match.Optional(Boolean));
        });
        // We return true if there is no problem
        return true;
      })));

      // Only admins have the right to edit a user.
      if (!Roles.userIsInRole(this.userId, "admin")) {
        throw new Meteor.Error("user.add.not-authorized",
          "Must be admin to create a new user account.");
      }

      var newUserId;

      // Is this a normal user?
      if (!doc.role) {
        newUserId = Accounts.createUser({
          username: doc.profile.name + "_" + doc.profile.currentTraining,
          password: "password",
          profile: {
            name: doc.profile.name,
            avatar: doc.profile.avatar || null,
            currentTraining: doc.profile.currentTraining
          }
        });
      } else {
        // Otherwise we create a new admin user
        newUserId = Accounts.createUser({
          username: doc.profile.name,
          profile: {
            name: doc.profile.name
          },
          password: "password"
        });

        Roles.addUsersToRoles(newUserId, doc.role);

        _.each(doc.emails, function(email) {
          Accounts.addEmail(newUserId, email.address, email.verified);
        });
      }

      return newUserId;
    }
  }

}); // methods()
