// Schemas used with 'aldeed:autoform' packages

AdminSchemas = {};

AdminSchemas.ChangePassword = new SimpleSchema({
  _id: {
    type: String
  },
  password: {
    type: String,
    min: 6
  }
});

AdminSchemas.UserProfile = new SimpleSchema({
  name: {
    type: String
  },
  avatar: {
    type: String,
    optional: true
  },
  currentTraining: {
    type: String,
    optional: true
  }
});

AdminSchemas.UserData = new SimpleSchema({
  username: {
    type: String,
    // For accounts-password, either emails or username is required, but not both. It is OK to make this
    // optional here because the accounts-password package does its own validation.
    // Third-party login packages may not require either.
    optional: true
  },
  profile: {
    type: AdminSchemas.UserProfile,
    optional: true
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
  role: {
    type: String,
    optional: true,
    allowedValues: ["admin"],
    label: "Role"
  }
});
