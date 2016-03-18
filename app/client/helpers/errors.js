// Create a collection to store errors.
//
// We just need a local (client-only) collection since errors are only
// relevant to the current session. In order to make the 'Errors' collection
// only exist in the browser we create the collection inside the 'client/'
// directory and we set the name of the collection to 'null'.
// The local collection is a reactive data source, so it is possible to
// show error messages reactively.
// cf. Greif S., Coleman T.: Discover Meteor. Pages 145-146.
Errors = new Mongo.Collection(null);

throwError = function(message) {
  Errors.insert({
    message: message
  });
};
