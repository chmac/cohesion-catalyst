Template.bullseyeIndicator.onCreated(function() {
  var templateInstance = this;
  var currentTraining = Session.get("bullseyeCurrentTraining");
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
    var startX = Session.get("centerX") - Session.get("playerRadius");
    return startX ? startX - 85 : null;
  },
  startY: function() {
    var startY = Session.get("centerY");
    return startY ? startY - 100 : null;
  }
});


// ------------------------------------------------------------------------ //
// bullseyeMatchIndicator
// A subtemplate to be included within 'bullseyeIndicator' template
// if value of 'currentView' of bullseye user is 'match'.
// ------------------------------------------------------------------------ //
Template.bullseyeMatchIndicator.onCreated(function() {
  var templateInstance = this;
  // We set the initial value of the circle's fill color.
  templateInstance.randomColor = new ReactiveVar("c1");
  templateInstance.fillLevel = new ReactiveVar(0);
}); // onCreated

Template.bullseyeMatchIndicator.onRendered(function() {
  var templateInstance = this;
  // We schedule to change the fill color randomly every 30s.
  templateInstance.intervalHandle = Meteor.setInterval(function() {
    templateInstance.randomColor.set(pickRandomColorClass());
  }, 30000);
}); // onRendered

Template.bullseyeMatchIndicator.onDestroyed(function() {
  var templateInstance = this;
  Meteor.clearInterval(templateInstance.intervalHandle);
}); // onDestroyed

Template.bullseyeMatchIndicator.helpers({
  matchCount: function() {
    return Session.get("countMatches") && Session.get("countMatches");
  },
  startX1: function() {
    var startX = Session.get("centerX") + Session.get("playerRadius");
    // var startX = Session.get("centerX") + Session.get("canvasSize") * 0.5;
    return startX ? startX - 75 : null;
  },
  startY1: function() {
    var startY = Session.get("centerY");
    // return startY ? startY - 85 : null;
    return startY ? startY - 100 : null;
  },
  startX2: function() {
    var startX = Session.get("centerX") - Session.get("playerRadius");
    return startX ? startX - 85 : null;
  },
  startY2: function() {
    var startY = Session.get("centerY");
    return startY ? startY - 100 : null;
  },
  randomColor: function() {
    return Template.instance().randomColor.get();
  },
  cohesionLevel: function() {
    // Based on the number of players of the current training,
    // we calculate the cohesion level by counting the documents
    // in the MetaCollection that are matched by (i.e. created by)
    // all current players.
    var tally = Meteor.users.find({
      "profile.currentTraining": Session.get("bullseyeCurrentTraining")
    }).fetch().length;

    var cohesionLevel =  MetaCollection.find({
      createdBy: {
        $size: tally
      },
      createdAtTraining: Session.get("bullseyeCurrentTraining")
    }, {
      fields: {
        createdBy: 1
      }
    }).fetch().length;

    Template.instance().fillLevel.set(cohesionLevel);

    return cohesionLevel;
  },
  fillLevel: function() {
    var fillLevel = Template.instance().fillLevel.get() * 12.5;

    if (fillLevel > 100) {
      fillLevel = 100;
    }

    return fillLevel;
  }
});
