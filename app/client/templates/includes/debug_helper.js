Template.debugHelper.events({
  "click #debug-helper-close-btn": function(event, template) {
    event.preventDefault();
    Session.set("debugHelperVisible", false);
  },
  "click #debug-helper-clear-btn": function(event, template) {
    Meteor.call("clearDebugMessages");
  }
});

Template.debugHelper.helpers({
  messages: function() {
    return DebugMessages.find();
  },
  formattedDate: function(timestamp) {
    return moment(timestamp).format("MMM D YYYY, HH:mm:ss");
  },
  getUsername: function(args) {
    return args[0] && args[0].user ? args[0].user.username : "not available";
  },
  status: function() {
    return Meteor.status();
  },
  failedToConnect: function() {
    return Meteor.status().status === "failed";
  },
  labelClass: function() {
    var status = Meteor.status();
    if (status.status === "connected") {
      return "label-success";
    } else if (status.status === "connecting") {
      return "label-info";
    } else if (status.status === "failed") {
      return "label-danger";
    } else if (status.status === "waiting") {
      return "label-warning";
    } else {
      return "label-default";
    }
  }
});
