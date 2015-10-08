Identifications = new Mongo.Collection("identifications");

/**
 * We define permissions for write operations on our collection.
 */
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

Meteor.methods({
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
