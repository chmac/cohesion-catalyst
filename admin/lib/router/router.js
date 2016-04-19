Router.configure({
  layoutTemplate: "masterLayout",
  loadingTemplate: "loading",
  notFoundTemplate: "notFound"
});

Router.route("/", {
  name: "home",
  waitOn: function() {
    return [
      Meteor.subscribe("listOfUsers"),
      Meteor.subscribe("listOfTrainings"),
      Meteor.subscribe("listOfIdentifications")
    ];
  }
});

var requireAdminRights = function() {
  if (!Roles.userIsInRole(Meteor.userId(), "admin")) {
    this.layout("masterLayout");
    this.render("noAdmin");
  } else {
    this.next();
  }
};

Router.onBeforeAction(requireAdminRights, {
  except: ["home"]
});
