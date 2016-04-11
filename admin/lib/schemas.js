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
    type: String,
    min: 5
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
    type: Object
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.$.verified": {
    type: Boolean
  },
  role: {
    type: String,
    optional: true,
    allowedValues: ["admin"],
    label: "Role"
  }
});

AdminSchemas.UserType = new SimpleSchema({
  typeSelect: {
    type: String,
    autoform: {
      type: "select-radio-inline",
      options: function() {
        return [
          {label: "User", value: "normal"},
          {label: "Admin", value: "admin"}
        ];
      }
    },
    label: "Type"
  }
});
