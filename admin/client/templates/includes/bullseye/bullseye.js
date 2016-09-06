Template.bullseye.onRendered(function() {
  var data = Template.currentData();
  $("#bullseye-automode-toggle").checkbox({
    onChecked: function() {
      Meteor.call("user.bullseye.update.automode", data.bullseyeUser._id, true, function(error, result) {
        if (error) {
          if (error.error === "user.bullseye.update.automode.not-authorized") {
            sAlert.error("You need to have admin rights to set automode.");
          } else {
            sAlert.error("An unexpected error occured: ", error.reason);
          }
        } else {
          sAlert.success("Automode successfully set.");
        }
      });
    },
    onUnchecked: function() {
      if (data && data.bullseyeUser) {
        Meteor.call("user.bullseye.update.automode", data.bullseyeUser._id, false, function(error, result) {
          if (error) {
            if (error.error === "user.bullseye.update.automode.not-authorized") {
              sAlert.error("You need to have admin rights to set automode.");
            } else {
              sAlert.error("An unexpected error occured: ", error.reason);
            }
          } else {
            sAlert.success("Automode successfully set.");
          }
        });
      }
    }
  }); // checkbox
}); // onRendered

Template.bullseye.helpers({
  isChecked: function(id){
    var user = Meteor.users.findOne({_id: id});
    return user && user.profile.autoMode && "checked";
  },
  isAutoMode: function(id) {
    var user = Meteor.users.findOne({_id: id});
    return user && user.profile.autoMode;
  }
});
