Router.route("/bullseye", {
  name: "bullseye",
  waitOn: function() {
    return Meteor.subscribe("bullseyeUser");
  },
  data: function() {
    return {
      bullseyeUser: Meteor.users.findOne({roles: {$in: ["view-bullseye"]}})
    };
  }
});
