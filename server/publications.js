Meteor.publish("listOfUsers", function() {
  return Meteor.users.find();
});

Meteor.publish("singleUser", function(id) {
  // check(id, String);
  return Meteor.users.find(id);
});

Meteor.publish("trainings", function() {
  return Trainings.find();
});
