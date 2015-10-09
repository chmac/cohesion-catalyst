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
    // Identifications.find({createdBy: currentUserId, trainingId: currentTraining}),
    Identifications.findMyIdentifications(currentUserId, currentTraining),
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

  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  if (!currentUserId) {
    return subscription.ready();
  }

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
      console.log("Publish poolIdentifications observe: added ", doc.name);
      Meteor.call("addMetaDoc", doc, errorFunc);
    // }
    },
    removed: function(doc) {
      console.log("Publish poolIdentifications observe: remove ", doc.name);
      Meteor.call("deleteMetaDoc", doc, errorFunc);
    }
  });

  // Whenever the client subscription is closed we want to stop observing.
  // Therefore, we call the 'stop()' method of the query handle object.
  subscription.onStop(function() {
    console.log("*************** Client has unsubscribed. *****************");
    queryHandle.stop();
  });

  return MetaCollection.find({createdBy: {$nin: [currentUserId]}});
});


Meteor.publish("root", function(currentTraining) {
  var currentUserId = this.userId;
  return Identifications.findRoot(currentUserId, currentTraining);
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
