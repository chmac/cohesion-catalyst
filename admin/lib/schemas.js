// Schemas used with 'aldeed:autoform' packages

AdminSchemas = {};

AdminSchemas.ChangePassword = new SimpleSchema({
  _id: {
    type: String
  },
  password: {
    type: String
  }
});
