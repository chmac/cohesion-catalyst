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

}); // onCreated()
