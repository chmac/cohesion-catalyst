Links = new Mongo.Collection("links");

createLink = function(identification) {
  var source,
    target
    ;

  source = Identifications.findOne({_id: identification.parentId});
  target = identification;
  
  if (source) {
    Links.insert({
      source: source,
      target: target
    });
  }
};
