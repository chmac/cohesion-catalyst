(function() {

Meteor.publish(null, function() {
  return DebugMessages.find({});
});

// The 'Meteor.roles' collection is provided by the 'alanning:roles' package,
// but it is not automatically published to the client.
// Here, we make it available to every client and no subscription is required.
// cf. https://atmospherejs.com/alanning/roles#changes-to-default-meteor-behavior
Meteor.publish(null, function (){
  return Meteor.roles.find({});
});

Meteor.publish("userWithRoles", function() {
    return Meteor.users.find({
      _id: this.userId
    }, {
      fields: {
        roles: 1
      }
    });
});

Meteor.publish("avatars", function() {
  return Avatars.find();
});

Meteor.publish("trainings", function() {
  return Trainings.find();
});

// The publication 'globalMetaIdentifications' consists of all the documents that represent
// identifications created by the users. Since the 'Identifications' collection may consist of
// multiple documents with the same name but from different creators we populate a separate
// collection called 'MetaCollection' with normalized data retrieved from the 'Identifications'
// collection.
// We also want the result set to be reactive so we observe the 'Identifications' documents
// that come and go in order to update the 'MetaCollection'.
// HEADS UP: See @router.js which routes are subscribing to this data. The returned cursor from
// this publication is NOT filtered in order to match the template specific data!
// Instead, filtering is defined on template level (e.g. for the 'ID pool' we filter the dataset
// to contain only identification documents created by others, so that a user can select matching IDs
// from this pool of identifications).
Meteor.publish("globalMetaIdentifications", function(currentTraining) {
  var subscription = this,
    currentUserId = this.userId;

  if (!currentUserId) {
    return subscription.ready();
  }

  // for debugging purposes
  // var currentUserName = Meteor.users.findOne({_id: currentUserId}).profile.name;
  // console.log("*************** Cient - " + currentUserName + " - subscribes ***************");

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
    editCompleted: true,
    $or: [
      {
        blacklisted: {
          $exists: false
        }
      }, {
        blacklisted: false
      }
    ]
  }).observe({
    added: function(doc) {
      Meteor.call("addMetaDoc", doc, errorFunc);
    },
    removed: function(doc) {
      Meteor.call("deleteMetaDoc", doc, errorFunc);
    },
    changed: function(newDoc, oldDoc){
      // console.log("SERVER -- Observe changed: from ", oldDoc, " to ", newDoc);
    }
  });

  // We stop observing when a client stopps/closes the subscription.
  // Therefore we call the 'stop()' method of the query handle object.
  // NOTE Keeping the console.log() for debugging purposes
  subscription.onStop(function() {
    // console.log("*************** Client - " + currentUserName + " - has unsubscribed. *****************");
    queryHandle.stop();
  });

  return MetaCollection.find({createdAtTraining: currentTraining});
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

  Meteor.call("writeLog", moment(), {
    trainingID: currentTraining,
    userID: currentUserId,
    username: Meteor.users.findOne({_id: currentUserId}).profile.name,
    action: "SUBSCRIBED",
    target: "myIdentificationsAndLinks"
  });

  this.onStop(function() {
    // We need to check if user still exists since the user may be removed by
    // the admin.
    var user = Meteor.users.findOne({_id: currentUserId});
    if (user) {
      Meteor.call("writeLog", moment(), {
        trainingID: currentTraining,
        userID: currentUserId,
        username: user.profile.name,
        action: "UNSUBSCRIBED",
        target: "myIdentificationsAndLinks"
      });
    }
  });

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


// The publication 'poolIdentifications' consists of a subset of documents that represent
// identifications created by the current user in order to retrieve data needed for calculating
// matching IDs from the pool of identifications.
Meteor.publish("poolIdentifications", function(currentTraining) {
  var subscription = this,
    currentUserId = this.userId;

  if (!currentUserId) {
    return subscription.ready();
  }

  Meteor.call("writeLog", moment(), {
    trainingID: currentTraining,
    userID: currentUserId,
    username: Meteor.users.findOne({_id: currentUserId}).profile.name,
    action: "SUBSCRIBED",
    target: "poolIdentifications"
  });

  this.onStop(function() {
    // We need to check if user still exists since the user may be removed by
    // the admin.
    var user = Meteor.users.findOne({_id: currentUserId});
    if (user) {
      Meteor.call("writeLog", moment(), {
        trainingID: currentTraining,
        userID: currentUserId,
        username: user.profile.name,
        action: "UNSUBSCRIBED",
        target:"poolIdentifications"
      });
    }
  });

  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  return Identifications.find({
      createdBy: currentUserId,
      trainingId: currentTraining
    }, {
      fields: {
        createdBy: 1,
        trainingId: 1,
        level: 1,
        x: 1,
        y: 1,
        name: 1
      }
    });
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

  Meteor.call("writeLog", moment(), {
    trainingID: currentTraining,
    userID: currentUserId,
    username: Meteor.users.findOne({_id: currentUserId}).profile.name,
    action: "SUBSCRIBED",
    target: "networkIdentifications"
  });

  this.onStop(function() {
    // We need to check if user still exists since the user may be removed by
    // the admin.
    var user = Meteor.users.findOne({_id: currentUserId});
    if (user) {
      Meteor.call("writeLog", moment(), {
        trainingID: currentTraining,
        userID: currentUserId,
        username: user.profile.name,
        action: "UNSUBSCRIBED",
        target: "networkIdentifications"
      });
    }
  });

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
      ],
      createdAtTraining: currentTraining
    })
  ];
});


Meteor.publish("currentPlayers", function(currentTraining) {
  var currentUserId = this.userId;
  // Validate the incoming data from the client and make sure 'currentTraining' is a string.
  // The 'check(value, pattern)' function is provided by the 'check' package.
  check(currentTraining, String);

  if (!currentUserId) {
    return this.ready();
  }

  var userData =  Meteor.users.find({
    "profile.currentTraining": currentTraining
  }, {
    fields: {
      profile: 1,
      status: 1
    }
  });

  if (userData) {
    return userData;
  }
});

// We use the tmeasday:publish-counts package which gives us Counts.publish
Meteor.publish("bullseyeIdentifications", function(currentTraining) {
  var subscription = this;

  check(currentTraining, String);

  var handle = Counts.publish(subscription, "identificationsCount",
    Identifications.find({
      trainingId: currentTraining,
      level: {
        $gt: 0
      },
      editCompleted: true,
      $or: [
        {
          blacklisted: {
            $exists: false
          }
        }, {
          blacklisted: false
        }
      ]
    }));

  subscription.onStop(function() {
    handle.stop();
  });
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
