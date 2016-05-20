Template.bullseyeIndicator.onCreated(function() {
  var templateInstance = this;
  var currentTraining = Session.get("bullseyeCurrentTraining");
  templateInstance.subscribe("bullseyeIdentifications", currentTraining);
});


// ------------------------------------------------------------------------ //
// bullseyeIdIndicator
// A subtemplate to be included within 'bullseyeIndicator' template
// if value of 'currentView' of bullseye user is 'reflect'.
// ------------------------------------------------------------------------ //
Template.bullseyeIdIndicator.helpers({
  idsCount: function() {
    return Counts.get("identificationsCount");
  },
  startX: function() {
    var startX = Session.get("centerX");
    return startX ? startX - 75 : null;
  },
  startY: function() {
    var startY = Session.get("centerY") + Session.get("playerRadius");
    return startY ? startY - 85 : null;
  }
});


// ------------------------------------------------------------------------ //
// bullseyeMatchIndicator
// A subtemplate to be included within 'bullseyeIndicator' template
// if value of 'currentView' of bullseye user is 'match'.
// ------------------------------------------------------------------------ //
Template.bullseyeMatchIndicator.helpers({
  // matchCount: function() {
  //
  // },
  startX1: function() {
    var startX = Session.get("centerX");
    return startX ? startX : null;
  },
  startY1: function() {
    var startY = Session.get("centerY") + Session.get("playerRadius");
    return startY ? startY - 85 : null;
  },
  startX2: function() {
    var startX = Session.get("centerX") - Session.get("playerRadius");
    return startX ? startX - 85 : null;
  },
  startY2: function() {
    var startY = Session.get("centerY");
    return startY ? startY - 100 : null;
  }
});
