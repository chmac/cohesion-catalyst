Meteor.publish("avatars", function() {
  return Avatars.find();
});

Meteor.publish("trainings", function() {
  // TODO: Add filter for trainings which are out of date
  return Trainings.find();
});

// We want to retrieve documents which were created by the currently logged-in user
// in order to only publish data from the server that belongs to the current user.
Meteor.publish("ownIdentifications", function() {
  var currentUserId = this.userId;
  // TODO Add condition to show only identification documents of the current training
  return Identifications.find({createdBy: currentUserId});
});

Meteor.publish("otherIdentifications", function() {
  //TODO
});

Meteor.publish("links", function() {
  return Links.find();
});
