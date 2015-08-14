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
