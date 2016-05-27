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
      sum += choose(m.createdBy.length, 2);
    });
    return sum;
  },
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


function factorial (n) {
  if (isNaN(n)) {
    return;
  }
  if (n === 0) {
    return 1;
  }
  // recursion
  return n * factorial(n - 1);
}

/**
 * Calculates the binomial coefficient, i.e. the number of ways picking
 * 'k' unordered outcomes from 'n' possibilities (think of lottery '6 out of 49').
 *
 * @param {Number} n - The number of users with common identifications.
 * @param {Number} k - The number of combinations (i.e. k-subsets), which in our case
 * will be 2 since we are looking for pairs (2-subsets).
 * cf. http://mathworld.wolfram.com/BinomialCoefficient.html
 */
function choose (n, k) {
  if (isNaN(n) || isNaN(k)) {
    return;
  }
  if (n <= 0 || k <= 0 || k > n) {
    return;
  }
  return factorial(n) / factorial(k) * factorial(n-k);
}
