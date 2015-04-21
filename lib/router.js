// We configure a global Router option in order to use the specified template as the
// default layout template for all routes.
// cf. https://github.com/iron-meteor/iron-router/blob/devel/Guide.md#layouts [as of 2015-04-21]
Router.configure({
  layoutTemplate: "layout"
});

Router.route("/", {
  name: "home"
});
