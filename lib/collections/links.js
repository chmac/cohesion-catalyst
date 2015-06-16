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
    return userId;
  },
  remove: function (userId, doc) {
    // TODO Maybe define more stringent permission rules.
    return doc.target.createdBy === userId || doc.source.createdBy === userId;
  }
});
