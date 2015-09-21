
Template.idNetwork.onCreated(function() {
  var currentUser,
    currentTrainingId;

  currentUser = Meteor.user();
  currentTrainingId = currentUser.profile.currentTraining;
  // console.log("created template idNetwork");
  // Meteor.call("testCall", "p1");
  // console.log("continuing in client template after testCall...");
  this.subscribe("networkIdentifications", currentTrainingId);
});

Template.idNetwork.helpers({
  ids: function() {
    // MetaCollection.find( {createdBy : {$exists:true}, $where:"this.createdBy.length>1"} )
    return MetaCollection.find({
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
      ]
    });
  }
});
