Identifications = new Mongo.Collection("identifications");

// ------------------------------------------------------------------------------------------- //
// -------------------------------------- Schema ---------------------------------------- //
// ------------------------------------------------------------------------------------------- //

Schemas.Identifications = new SimpleSchema({
  createdBy: {
    type: String,
    label: "Creator ID"
  },
  trainingId: {
    type: String,
    label: "Trainning ID"
  },
  fixed: {
    type: Boolean
  },
  children: {
    type: [String]
  },
  level: {
    type: Number
  },
  x: {
    type: Number,
    decimal: true
  },
  y: {
    type: Number,
    decimal: true
  },
  name: {
    type: String,
    label: "Name of ID"
  },
  standardizedName: {
    type: String,
    defaultValue: ""
  },
  editCompleted: {
    type: Boolean
  },
  parentId: {
    type: String,
    optional: true
  },
  matchColor: {
    type: String,
    optional: true
  },
  poolMatch: {
    type: Boolean,
    optional: true
  },
  blacklisted: {
    type: Boolean,
    optional: true
  }
});

Identifications.attachSchema(Schemas.Identifications);
