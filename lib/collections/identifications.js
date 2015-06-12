Identifications = new Mongo.Collection("identifications");

Meteor.methods({
  "insertIdentification": function(idAttributes) {
    // Check if user is logged-in
    check(this.userId, String);

    var currentUser,
      identification,
      identificationId;

    currentUser = Meteor.user();

    identification = _.extend(idAttributes, {
      createdBy: currentUser._id,
      player: currentUser.username
    });

    identificationId = Identifications.insert(identification);

    Identifications.update(identification.parentId, {
      $push: {children: identificationId}
    });

    createLink(identification);

    return {
      _id: identificationId
    };

  }
});
