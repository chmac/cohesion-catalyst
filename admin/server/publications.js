Meteor.publish("listOfUsers", function() {
  return Meteor.users.find();
});

Meteor.publish("singleUser", function(id) {
  check(id, String);
  return Meteor.users.find({_id: id});
});

Meteor.publish("listOfTrainings", function() {
  return Trainings.find();
});

// The 'Meteor.roles' collection is provided by the 'alanning:roles' package,
// but it is not automatically published to the client.
// Here, we make it available to every client and no subscription is required.
// cf. https://atmospherejs.com/alanning/roles#changes-to-default-meteor-behavior
Meteor.publish(null, function (){
  return Meteor.roles.find({});
});
