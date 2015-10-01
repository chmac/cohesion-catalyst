Links = new Mongo.Collection("links");

/**
 * We define permissions for write operations on our collection.
 */
Links.allow({
  insert: function (userId, doc) {
    // The user must be logged in.
    return userId;
  },
  update: function (userId, doc, fields, modifier) {
    // TODO Maybe define more stringent permission rules
    return doc.target.createdBy === userId || doc.source.createdBy === userId;
  },
  remove: function (userId, doc) {
    // TODO Maybe define more stringent permission rules.
    return doc.target.createdBy === userId || doc.source.createdBy === userId;
  }
});

Meteor.methods({
  createLinkForMatch: function(matchId, userId, trainingId) {
    // Insert a document containing the matched ID as 'target' into the 'Links' collection.
    // We specify the informationen needed for the 'source' field in order to meet our
    // subscription rules from the 'myIds' template. The parent node (i.e. source) of a matched ID
    // will always be the root node, which we will access from the 'myIds' template.
    Links.insert({
      source: {
        createdBy: userId,
        trainingId: trainingId
      },
      target: Identifications.findOne({
        "_id": matchId
      })
    }, errorFunc);
  }
});
