Template.bullseyeView.onCreated(function() {
  var templateInstance = this;
  templateInstance.bullseyeSize = new ReactiveVar(null);
  Session.setDefault("countIds", 0);
  Session.setDefault("countMatches", 0);

  // We track the number of identifications and also of matches
  // in order to set our Session variables which control template
  // rendering.
  templateInstance.autorun(function() {
    var currentTraining = Session.get("bullseyeCurrentTraining");

    if (currentTraining) {
      templateInstance.subscribe("bullseyeIdentifications", currentTraining);
      Session.set("countIds", Counts.get("identificationsCount"));

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
      Session.set("countMatches", sum);
    }
  });
}); // onCreated


Template.bullseyeView.onRendered(function() {
  var templateInstance = this;
  templateInstance.bullseyeSize.set(document.documentElement.clientHeight);

  $(window).resize(function () {
    templateInstance.bullseyeSize.set(document.documentElement.clientHeight);
  });
}); // onRendered


Template.bullseyeView.helpers({
  size: function() {
    return Template.instance().bullseyeSize.get() + "px";
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
