(function() {
Meteor.publish("avatars", function() {
  return Avatars.find();
});

Meteor.publish("trainings", function() {
  // TODO: Add filter for trainings which are out of date
  return Trainings.find();
});

// We want to retrieve documents which were created by the currently logged-in user
// in order to only publish data from the server that belongs to the current user.
// Since we also want to constrain the transmitted the documents to data of the current
// training the user is attending, we pick the data depending on the 'currentTraining'
// parameter which is specified when we subscribe to this publication client-side.
// The id of 'currentTraining' is stored in the user's profile on account creation or
// login, respectively.
Meteor.publish("myIdentificationsAndLinks", function(currentTraining) {
  var currentUserId = this.userId;
  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  if (!currentUserId) {
    return this.ready();
  }

  return [
    Identifications.findCurrentIdentifications(currentUserId, currentTraining),
    Links.find({
      "source.createdBy": currentUserId,
      "source.trainingId": currentTraining,
      "target.createdBy": currentUserId,
      "target.trainingId": currentTraining
    })
  ];
});

// The publication 'poolIdentifications' consists of documents that represent
// identifications created by others so that the current user can select matching IDs
// from this pool of identifications. Since the 'Identifications' collection may consist of
// multiple documents with the same name but from different creators we populate a separate
// collection called 'MetaCollection' with normalized data retrieved from the 'Identifications'
// collection.
// We also want the result set to be reactive so we observe the 'Identifications' documents
// that come and go in order to update the 'MetaCollection'.
Meteor.publish("poolIdentifications", function(currentTraining) {
  var subscription = this,
    currentUserId = this.userId;

  if (!currentUserId) {
    return subscription.ready();
  }

  // for debugging purposes
  var currentUserName = Meteor.users.findOne({_id: currentUserId}).profile.name;
  console.log("*************** Cient - " + currentUserName + " - subscribes ***************");

  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);


  // We define the query to only take into account the documents in question, which means that
  // we filter for documents where the 'level' field is 'greater than '0' thus excluding the
  // avatar/smiley entries. We also only want to use documents belonging to the current training and
  // where the 'editCompleted' field  is 'true'.
  var queryHandle = Identifications.find({
    trainingId: currentTraining,
    level: {
      $gt: 0
    },
    editCompleted: true
  }).observe({
    added: function(doc) {
      Meteor.call("addMetaDoc", doc, errorFunc);
    },
    removed: function(doc) {
      Meteor.call("deleteMetaDoc", doc, errorFunc);
    },
    changed: function(newDoc, oldDoc){
      console.log("SERVER -- Observe changed: from ", oldDoc, " to ", newDoc);
    }
  });

  // HEADS UP: We want to continue observing regardless of the client stopping/closing
  // the subscription - therefore we do not call the 'stop()' method of the query handle object.
  // NOTE Keeping the console.log() for debugging purposes
  subscription.onStop(function() {
    console.log("*************** Client - " + currentUserName + " - has unsubscribed. *****************");
    //queryHandle.stop();
  });

  return [
    MetaCollection.find({createdBy: {$nin: [currentUserId]}}),
    Identifications.find({
      createdBy: currentUserId,
      trainingId: currentTraining
    }, {
      fields: {
        createdBy: 1,
        trainingId: 1,
        level: 1,
        x: 1,
        y: 1
      }
    })
  ];
});


// Define the publication named 'networkIdentifications'.
// The resulting record set includes documents of the 'MetaCollection'
// where the 'createdBy' field (which is an array) consists of at least two entries,
// thus representing a minimum of two affiliates.
Meteor.publish("networkIdentifications", function(currentTraining) {
  var currentUserId = this.userId;
  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  if (!currentUserId) {
    return this.ready();
  }
  // MetaCollection.find( {createdBy : {$exists:true}, $where:"this.createdBy.length>1"} )
  return [
    MetaCollection.find({
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
    })
  ];
});


Meteor.publish("links", function(currentTraining) {
  var currentUserId = this.userId;
  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);
  return Links.find({
    // TODO
  });
});

}()); // end function closure
