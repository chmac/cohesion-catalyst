Meteor.publish("avatars", function() {
  return Avatars.find();
});

Meteor.publish("trainings", function() {
  // TODO: Add filter for trainings which are out of date
  return Trainings.find();
});

// We want to retrieve documents which were created by the currently logged-in user
// in order to only publish data from the server that belongs to the current user.
// Since we also want to constrain the transmitted the documents to data of the current
// training the user is attending, we pick the data depending on the 'currentTraining'
// parameter which is specified when we subscribe to this publication client-side.
// The id of 'currentTraining' is stored in the user's profile on account creation or
// login, respectively.
Meteor.publish("ownIdentificationsAndLinks", function(currentTraining) {
  var currentUserId = this.userId;

  if (!currentUserId) {
    return this.ready();
  }

  return [
    Identifications.find({createdBy: currentUserId, trainingId: currentTraining}),
    Links.find({
      "source.createdBy": currentUserId,
      "source.trainingId": currentTraining,
      "target.createdBy": currentUserId,
      "target.trainingId": currentTraining
    })
  ];
});

Meteor.publish("otherIdentifications", function(currentTraining) {
  var currentUserId = this.userId;

  if (!currentUserId) {
    return this.ready();
  }

  return [
    Identifications.find({
      createdBy: {$ne: currentUserId},
      trainingId: currentTraining,
      editCompleted: true
    })
  ];
});

Meteor.publish("links", function(currentTraining) {
  var currentUserId = this.userId;
  return Links.find({
    // TODO
  });
});
