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
Template.bullseyeMatchIndicator.helpers({
  matchCount: function() {
    var sum = 0;
    var matches = MetaCollection.find({
      $nor: [
        {
          createdBy: {
            $exists: false
          }
        }, {
          createdBy: {
            $size: 0
          }
        }, {
          createdBy: {
            $size: 1
          }
        }
      ],
      createdAtTraining: Session.get("bullseyeCurrentTraining")
    }, {
      fields: {
        createdBy: 1
      }
    });

    matches.forEach(function(m) {
      sum += calculateMatches(m.createdBy.length);
    });
    return sum;
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
  }
});


/**
 * Calculates the number of matches for one identification.
 *
 * @param {Number} n - The number of users with common identifications
 */
function calculateMatches(n) {
  if (isNaN(n)) {
    return;
  }
  if (n <= 0) {
    return;
  }
  return n * (n - 1) / 2;
}
