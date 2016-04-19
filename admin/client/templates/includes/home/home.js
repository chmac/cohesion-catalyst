Template.home.helpers({
  usersCount: function() {
    return Meteor.users.find().count();
  },
  trainingsCount: function() {
    return Trainings.find().count();
  },
  idsCount: function() {
    return Identifications.find().count();
  }
});
