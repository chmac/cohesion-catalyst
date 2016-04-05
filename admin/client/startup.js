// We configure the 'sAlert' notification on client startup.
Meteor.startup(function() {
  sAlert.config({
    effect: "scale",
    timeout: 4000,
    offset: "40px"
  });
});
