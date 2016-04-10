Router.route("/users", {
  name: "usersList",
  waitOn: function() {
    return Meteor.subscribe("listOfUsers");
  }
});

Router.route("/users/new", {
  name: "userNew"
});

// Part of the route is dynamic, indicated by ':' symbol,
// followed by the name of the property that we want to access
// inside the route() function (e.g. this.params._id)
Router.route("/users/:_id", {
  // render template with user data of this _id
  name: "userShow",
  waitOn: function() {
    return Meteor.subscribe("singleUser", this.params._id);
  },
  data: function() {
    return Meteor.users.findOne({_id: this.params._id});
  }
});

Router.route("/users/:_id/edit", {
  name:"userEdit",
  waitOn: function() {
    return [
      Meteor.subscribe("singleUser", this.params._id),
      Meteor.subscribe("listOfTrainings")
    ];
  },
  data: function() {
    return {
      user: Meteor.users.findOne({_id: this.params._id}),
      roles: Meteor.roles.find()
    };
  }
});


Router.onBeforeAction("dataNotFound", {
  only: "userEdit"
});
