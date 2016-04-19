Router.route("/identifications", {
  name: "idsList",
  waitOn: function() {
    return [
      Meteor.subscribe("listOfIdentifications"),
      Meteor.subscribe("listOfUsers")
    ];
  }
});
