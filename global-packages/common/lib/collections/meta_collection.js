MetaCollection = new Mongo.Collection("metaCollection");

// ------------------------------------------------------------------------------------------- //
// -------------------------------------- Schema ---------------------------------------- //
// ------------------------------------------------------------------------------------------- //

Schemas.MetaCollection = new SimpleSchema({
  name: {
    type: String
  },
  standardizedName: {
    type: String
  },
  color: {
    type: String
  },
  createdBy: {
    type: [String]
  },
  createdAtTraining: {
    type: String
  }
});

MetaCollection.attachSchema(Schemas.MetaCollection);
