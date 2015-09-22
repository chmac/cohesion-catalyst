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
Meteor.publish("ownIdentificationsAndLinks", function(currentTraining) {
  var currentUserId = this.userId;
  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  if (!currentUserId) {
    return this.ready();
  }

  return [
    Identifications.find({createdBy: currentUserId, trainingId: currentTraining}),
    Links.find({
      "source.createdBy": currentUserId,
      "source.trainingId": currentTraining,
      "target.createdBy": currentUserId,
      "target.trainingId": currentTraining
    })
  ];
});

Meteor.publish("otherIdentifications", function(currentTraining) {
  var currentUserId = this.userId;
  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  if (!currentUserId) {
    return this.ready();
  }

  return [
    Identifications.find({
      createdBy: {$ne: currentUserId},
      trainingId: currentTraining,
      editCompleted: true,
      matchedBy: {$nin: [currentUserId]}
    })
  ];
});

function stdErrorFunc(error, result) {
  if (error) {
    return console.log(error.reason);
  }
};

Meteor.publish("poolIdentifications", function(currentTraining) {
  var self = this,
    currentUserId = self.userId,
    // We use this flag to watch out for documents from the initial subscription
    // that should not affect the 'added()' callback.
    initializing = true;

  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  if (!currentUserId) {
    return self.ready();
  }

  var handle = Identifications.find({
    trainingId: currentTraining,
    level: {
      $gt: 0
    },
    editCompleted: true
  }).observe({
    added: function(doc) {
      // if (!initializing) {
      //   console.log("initializing ", initializing);
      //   return;
      // }
      console.log("observe poolIDs added");
      Meteor.call("addMetaInfo", doc, stdErrorFunc);
    // }
    },
    changed: function(oldDoc, newDoc) {
      // Meteor.call("deleteMetaInfo", oldDoc, stdErrorFunc);
      Meteor.call("addMetaInfo", newDoc, stdErrorFunc);
    },
    removed: function(doc) {
      Meteor.call("deleteMetaInfo", doc, stdErrorFunc);
    }
  });

  initializing = false;

  // Whenever the client subscription is closed we want to stop observing.
  // Therefore, we call the 'stop()' method of the query handle object.
  self.onStop(function() {
    handle.stop();
  });

  return [
    MetaCollection.find({
      createdBy: {$nin: [currentUserId]}
    })
  ];
});

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
