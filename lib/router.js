// We configure a global Router option in order to use the specified template as the
// default layout template for all routes.
// cf. https://github.com/iron-meteor/iron-router/blob/devel/Guide.md#layouts [as of 2015-04-21]
Router.configure({
  layoutTemplate: "layout",
  loadingTemplate: "loading"
});

Router.route("/", {
  name: "home"
});

Router.route("/intro", {
  name: "intro"
});

// This function is used in the 'onBeforeAction' hook function in order to
// check if the user is logged in before rendering the templates for a route.
// cf. Greif S., Coleman T.: Discover Meteor. Page 114.
var requireLogin = function() {
  if (!Meteor.user()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    } else {
    this.render("home");
    }
  } else {
    this.next();
  }
};

// We only want to render the templates for logged in users, therefore we need to check the
// current users login status before the routing process runs. Using the 'onBeforeAction' method
// we can add a hook action that tells the router to run this function before the route function.
// cf. https://github.com/iron-meteor/iron-router/blob/devel/Guide.md#using-hooks [as of 2015-05-03]
Router.onBeforeAction(requireLogin);
