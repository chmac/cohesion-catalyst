Template.bullseyeLayout.onCreated(function() {
  var templateInstance = this;

    templateInstance.autorun(function() {
      var currentTraining = Trainings.find({
        isCurrentTraining: true
      }, {
        fields: {
          isCurrentTraining: 1
        }
      }).fetch()[0];

      if (currentTraining) {
        Session.set("bullseyeCurrentTraining", currentTraining._id);
      }
    });

  Session.setDefault("moveBubbles", true);
}); // onCreated()

Template.bullseyeLayout.events({
  "click #rotation-toggle": function(event, template) {
    event.preventDefault();
    $("div.bullseye-layout").toggleClass("bullseye-animation");
  },
  "click #bubble-toggle": function(event, template) {
    event.preventDefault();
    if (Session.equals("moveBubbles", true)) {
      Session.set("moveBubbles", false);
    } else {
      Session.set("moveBubbles", true);
    }
  }
});
