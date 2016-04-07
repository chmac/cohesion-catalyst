// Configurations on client-side startup.
Meteor.startup(function() {

  AutoForm.setDefaultTemplate("semanticUI");
  
  sAlert.config({
    effect: "scale",
    timeout: 4000,
    offset: "40px"
  });
});
