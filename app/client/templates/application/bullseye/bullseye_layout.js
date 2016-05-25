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
  templateInstance.inFullScreen = false; // flag to show when full screen

}); // onCreated()

Template.bullseyeLayout.events({
  "click #fullscreen-toggle": function(event, template) {
    event.preventDefault();
    if (template.inFullScreen === false) {
      makeFullScreen(template); // open to full screen
    } else {
      reset(template);
    }
  },
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

function makeFullScreen(template) {
  var divObj = template.find("div.full-screen");
  // var divObj = template.find("div.bullseye-view");
  if (divObj.requestFullscreen) {
    divObj.requestFullscreen();
  }
  else if (divObj.msRequestFullscreen) {
    divObj.msRequestFullscreen();
  }
  else if (divObj.mozRequestFullScreen) {
    divObj.mozRequestFullScreen();
  }
  else if (divObj.webkitRequestFullscreen) {
    divObj.webkitRequestFullscreen();
  }
  template.inFullScreen = true;
  return;
}

function reset(template) {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
  else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
  else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  }
  else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  }
  template.inFullScreen = false;
  return;
}
