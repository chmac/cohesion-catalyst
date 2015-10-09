Identifications = new Mongo.Collection("identifications");

// ------------------------------------------------------------------------------------------- //
// -------------------------------------- Permissions ---------------------------------------- //
// ------------------------------------------------------------------------------------------- //

// We set up the rules to allow client write operations to our collection.
Identifications.allow({
  insert: function (userId, doc) {
    // The user must be logged in to add a the document to the collection.
    return userId;
  },
  update: function (userId, doc, fields, modifier) {
    // The user may only change own documents.
    return doc.createdBy === userId;
  },
  remove: function (userId, doc) {
    // The user may only remove own documents.
    return doc.createdBy === userId;
  },
  // We want to fetch only the fields that are actually used.
  fetch: ['createdBy']
});


// ------------------------------------------------------------------------------------------- //
// ---------------------------------------- Queries ------------------------------------------ //
// ------------------------------------------------------------------------------------------- //

Identifications.findRoot = function(currentUserId, currentTrainingId) {
  return Identifications.find({
    createdBy: currentUserId,
    trainingId: currentTrainingId,
    level: 0
  });
};

Identifications.findMyIdentifications = function(currentUserId, currentTrainingId) {
  return Identifications.find({
    createdBy: currentUserId,
    trainingId: currentTrainingId
  });
};

Identifications.findOneById = function(id) {
  return Identifications.findOne({_id: id});
};


// ------------------------------------------------------------------------------------------- //
// ----------------------------------------- Methods ----------------------------------------- //
// ------------------------------------------------------------------------------------------- //

Meteor.methods({
  testFun: function() {
    var root = Identifications.findRoot(Meteor.userId(), Meteor.user().profile.currentTraining).fetch()[0];
    if (this.isSimulation) {
      console.log("CLIENT", root);
    } else {
      console.log("SERVER", root);
    }
  },

  /**
   * Meteor method for....
   * @param {Object} rootProperties
   */
  insertRoot: function(rootProperties) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    var defaultProperties = {
      createdBy: currentUser._id,
      trainingId: currentTrainingId,
      fixed: true,
      children: []
    };

    var root = _.extend(defaultProperties, rootProperties);
    var rootId = Identifications.insert(root);
        console.log("root", root);

    return {
      _id: rootId
    };
  },


  /**
   * Meteor method for....
   * @param {Object} idProperties
   */
  insertIdentification: function(idProperties) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    // var root =  Identifications.findRoot(currentUser._id, currentTrainingId).fetch()[0];
    // console.log("root", root);

  // TODO check parent

    var defaultProperties = {
      createdBy: currentUser._id,
      trainingId: currentTrainingId,
      fixed: true,
      children: []
    };

    var identification = _.extend(defaultProperties, idProperties);
    var identificationId = Identifications.insert(identification);

    var source = Identifications.findOneById(identification.parentId);
    var target = Identifications.findOneById(identificationId);

    // We push the newly inserted identification to its parent 'children' array.
    Identifications.update(source._id, {
      $push: {
        children: identificationId
      }
    }, errorFunc);

    // We create a new link object to connect the 'source' and 'target'
    // identificatios and add it to our 'Links' collection.
    var link = {
      source: source,
      target: target
    };
    Links.insert(link, errorFunc);

    // We find all the links which have the parent node as 'source' and update each of which
    // to contain the correct children values.
    Links.find({
      "source._id": identification.parentId
    }).forEach(function(link) {
      Links.update(link._id, {
        $addToSet: {
          "source.children": identificationId,
        }
      }, errorFunc);
    });

    return {
      _id: identificationId
    };

  },


  /**
   * Meteor method for....
   * @param {}
   */
  insertIdentificationWithRandomPosition: function(idProperties) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    var parent =  Identifications.findOne({
      createdBy: currentUser._id,
      trainingId: currentTrainingId,
      level: 0
    });

  // TODO check parent

    var defaultProperties = {
      createdBy: currentUser._id,
      trainingId: currentTrainingId,
      fixed: true,
      children: []
    };

    var identification = _.extend(defaultProperties, idProperties);
  },


  // For the user who matched this ID we create a new document in the 'Identifications' collection.
  createIdForMatch: function(matchObj) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    var myMatchId = Identifications.insert(matchObj, errorFunc);
    console.log("Method createIdForMatch called - inserted document with _id: ", myMatchId);

    // Call the method 'createLinkForMatch()' - @see links.js.
    Meteor.call("createLinkForMatch", myMatchId, currentUser._id, currentTrainingId, errorFunc);
    return myMatchId;
  },
  // Each document of the 'Identifications' collection which was not created by the
  // current user and which matches the passed text (i.e. name of the identification)
  // will be updated with the current users '_id' which is added to a
  // 'matchedBy' array.
  addIdMatch: function(idText) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    Identifications.update({
      createdBy: {$ne: currentUser._id},
      trainingId: currentTrainingId,
      editCompleted: true,
      name: idText
    }, {
      $addToSet: {
        matchedBy: currentUser._id,
      }
    }, {
      multi: true
    }, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });
  },
  // If a user removes a matched ID, we remove the users '_id' from the
  // 'matchedBy' array in all relevant documents.
  deleteIdMatch: function(idText) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    Identifications.update({
      createdBy: {$ne: currentUser._id},
      trainingId: currentTrainingId,
      editCompleted: true,
      name: idText
    }, {
      $pull: {
        matchedBy: currentUser._id,
      }
    }, {
      multi: true
    }, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });
  }
});
