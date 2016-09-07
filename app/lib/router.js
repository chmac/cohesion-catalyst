// We configure a global Router option in order to use the specified template as the
// default layout template for all routes.
// cf. https://github.com/iron-meteor/iron-router/blob/devel/Guide.md#layouts [as of 2015-04-21]
Router.configure({
  layoutTemplate: "layout",
  loadingTemplate: "loading",
  notFoundTemplate: "notFound",
  waitOn: function() {
    return [
      Meteor.subscribe("avatars"),
      Meteor.subscribe("trainings")
    ];
  }
});

Router.route("/", {
  name: "home"
});

Router.route("/smile", {
  name: "intro"
});

Router.route("/reflect", {
  name: "myIds",
  waitOn: function() {
    if (Meteor.user() && !Roles.userIsInRole(Meteor.userId(),"view-bullseye")) {
      return [
        Meteor.subscribe("myIdentificationsAndLinks", Meteor.user().profile.currentTraining),
        Meteor.subscribe("globalMetaIdentifications", Meteor.user().profile.currentTraining)
      ];
    }
  }
});

Router.route("/match", {
  name: "idPool",
  waitOn: function() {
    if (Meteor.user() && !Roles.userIsInRole(Meteor.userId(), "view-bullseye")) {
      return [
        Meteor.subscribe("globalMetaIdentifications", Meteor.user().profile.currentTraining),
        Meteor.subscribe("poolIdentifications", Meteor.user().profile.currentTraining)
      ];
    }
  }
});

Router.route("/explore", {
  name: "idNetwork",
  waitOn: function() {
    if (Meteor.user() && !Roles.userIsInRole(Meteor.userId(), "view-bullseye")) {
      return [
        Meteor.subscribe("globalMetaIdentifications", Meteor.user().profile.currentTraining),
        Meteor.subscribe("currentPlayers", Meteor.user().profile.currentTraining),
        Meteor.subscribe("poolIdentifications", Meteor.user().profile.currentTraining)
      ];
    }
  }
});


Router.route("/bullseye", {
  name: "bullseye",
  template: "bullseyeView",
  layoutTemplate: "bullseyeLayout",
  onBeforeAction: function() {
    if (!Meteor.userId()) {
      if (Meteor.loggingIn()) {
        this.render("loading");
      } else {
        this.render("bullseyeLogin");
      }
    } else {
      if (!Roles.userIsInRole(Meteor.userId(),"view-bullseye")) {
        Router.go("home");
      }
      this.next();
    }
  },
  subscriptions: function() {
    if (Session.get("bullseyeCurrentTraining")) {
      return [
        Meteor.subscribe("currentPlayers", Session.get("bullseyeCurrentTraining")),
        Meteor.subscribe("globalMetaIdentifications", Session.get("bullseyeCurrentTraining")),
        Meteor.subscribe("bullseyeIdentifications", Session.get("bullseyeCurrentTraining"))
      ];
    }
  }
});


// This function is used in the 'onBeforeAction' hook function in order to
// check if the user is logged in before rendering the templates for a route.
// cf. Greif S., Coleman T.: Discover Meteor. Page 114.
var requireLogin = function() {
  if (!Meteor.userId()) {
    if (Meteor.loggingIn()) {
      this.render("loading");
    } else {
      this.render("home");
    }
  } else {
    if (Roles.userIsInRole(Meteor.userId(),"view-bullseye")) {
      Router.go("bullseye");
    }
    this.next();
  }
};

// We only want to render the templates for logged in users, therefore we need to check the
// current users login status before the routing process runs. Using the 'onBeforeAction' method
// we can add a hook action that tells the router to run this function before the route function.
// cf. https://github.com/iron-meteor/iron-router/blob/devel/Guide.md#using-hooks [as of 2015-05-03]
Router.onBeforeAction(requireLogin, {
  except: ["bullseye"]
});
