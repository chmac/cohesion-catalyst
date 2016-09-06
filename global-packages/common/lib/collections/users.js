// We define and attach a schema to the Meteor.users collection in order to
// make the collection editable via the admin dashboard.
// The following schema is borrowed from the 'Collection2' example provided at
// [as of 2015-12-14] https://github.com/aldeed/meteor-collection2
Schemas.UserProfile = new SimpleSchema({
  name: {
    type: String
  },
  avatar: {
    type: String,
    optional: true
  },
  presentationMode: {
    type: String,
    optional: true
  },
  currentTraining: {
    type: String,
    optional: true
  },
  currentView: {
    type: String,
    optional: true
  },
  autoMode: {
    type: Boolean,
    optional: true
  },
  reflectTrigger: {
    type: Number,
    optional: true
  },
  matchTrigger: {
    type: Number,
    optional: true
  },
  bubbleSpeed: {
    type: Number,
    optional: true
  }
});

Schemas.User = new SimpleSchema({
  username: {
    type: String,
    // For accounts-password, either emails or username is required, but not both. It is OK to make this
    // optional here because the accounts-password package does its own validation.
    // Third-party login packages may not require either.
    optional: true
  },
  profile: {
    type: Schemas.UserProfile,
    optional: true
  },
  // We add `roles` to our schema because we use the 'meteor-roles' package.
  // We specify [String] as type since we do not use role groups.
  // If this changes in the future, we have to specify the type as 'Object'.
  roles: {
    type: [String],
    optional: true
  },
  blocked : {
    type: Boolean,
    optional: true
  },
  // We add 'status' to our schema because we use the 'mizzao:user-status' package.
  status: {
    type: Object,
    optional: true,
    blackbox: true
  },
  emails: {
    type: Array,
    // For accounts-password, either emails or username is required, but not both. It is OK to make this
    // optional here because the accounts-password package does its own validation.
    // Third-party login packages may not require either.
    optional: true
  },
  "emails.$": {
    type: Object,
    optional:true
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional:true
  },
  "emails.$.verified": {
    type: Boolean,
    optional:true
  },
  createdAt: {
    type: Date
  },
  // We add the services field to our schema (needed when using any of the accounts packages).
  services: {
    type: Object,
    optional: true,
    blackbox: true
  },
  // In order to avoid an 'Exception in setInterval callback' from Meteor
  heartbeat: {
      type: Date,
      optional: true
  }
});

Meteor.users.attachSchema(Schemas.User);
