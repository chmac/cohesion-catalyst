DebugMessages = new Mongo.Collection("debugMessages");

// We want the messages documents to expire after 24 hours, i.e. they will be deleted
// automatically from the collection.
// https://themeteorchef.com/recipes/building-an-error-logger/#tmc-defining-a-self-expiring-logs-collection
if (Meteor.isServer) {
  DebugMessages._ensureIndex({"date": 1}, {expireAfterSeconds: 86400});
}

// We set up the rules to allow client write operations to our collection.
// For convenience, all modifications are allowed.
DebugMessages.allow({
  insert: function(userId, doc) {
    return true;
  },
  update: function (userId, doc, fields, modifier) {
    return true;
  },
  remove: function(userId, doc) {
    return true;
  }
});


Meteor.methods({
  clearDebugMessages: function() {
    DebugMessages.remove({});
  }
});
