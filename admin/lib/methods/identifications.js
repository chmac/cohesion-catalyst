Meteor.methods({

  "id.blacklist": function(doc) {

    // Check arguments received from client
    check(doc, Object);
    check(doc._id, String);
    check(doc.createdBy, String);
    check(doc.blacklisted, Match.Optional(Boolean));

    // Only admins have the right to blacklist documents.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("id.blacklist.not-authorized",
        "Must be admin to blacklist data.");
    }

    var user = Meteor.users.findOne({_id: doc.createdBy});

    if (!doc.blacklisted) {
      Identifications.update(doc._id, {
        $set: {
          blacklisted: true
        }
      });
    } else {
      if (user && user.blocked) {
        throw new Meteor.Error("id.blacklist.not-allowed",
          "Cannot undo blacklist identification of blocked user.");
      }
      Identifications.update(doc._id, {
        $set: {
          blacklisted: false
        }
      });
    }


  }

});
