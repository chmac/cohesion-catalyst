
// ------------------------------------------------------------------------ //
// idIsMatchedCell
// A subtemplate to be included within 'idsList' template.
// (include via 'tmpl' option in 'TabularTables.Identifications')
// ------------------------------------------------------------------------ //
Template.idIsMatchedCell.helpers({
  isPoolMatch: function(id) {
    var idDoc = Identifications.findOne({_id: id});
    return idDoc && idDoc.poolMatch;
  }
});

// ------------------------------------------------------------------------ //
// idBlacklistCell
// A subtemplate to be included within 'idsList' template.
// (include via 'tmpl' option in 'TabularTables.Identifications')
// ------------------------------------------------------------------------ //
Template.idBlacklistCell.helpers({
  isBlacklisted: function() {
    return this.blacklisted;
  }
});

Template.idBlacklistCell.events({
  "click .id-blacklist-button": function(event, template) {
    Meteor.call("id.blacklist", this, function(error, result) {
      // error identification
      if (error) {
        switch(error.error) {
          case "id.blacklist.not-authorized":
            sAlert.error("You need to have admin rights to blacklist data.");
            break;
          case "id.blacklist.not-allowed":
            sAlert.error("It is not possible to remove this flag. You need to un-block the creator first.");
            break;
          default:
            sAlert.error("An unexpected error occured: ", error.reason);
        }
      } else {
        // success
        sAlert.success("Identification record has successfully been updated.");
      }
    });
  }
});

// ------------------------------------------------------------------------ //
// idCreatedByNameCell
// A subtemplate to be included within 'idsList' template.
// (include via 'tmpl' option in 'TabularTables.Identifications')
// ------------------------------------------------------------------------ //
Template.idCreatedByNameCell.helpers({
  createdByName: function(id) {
    var user = Meteor.users.findOne(id);
    return user && user.profile.name;
  }
});

// ------------------------------------------------------------------------ //
// idCreatedByBlockCell
// A subtemplate to be included within 'idsList' template.
// (include via 'tmpl' option in 'TabularTables.Identifications')
// ------------------------------------------------------------------------ //
Template.idCreatedByBlockCell.events({
  "click .user-block-button": function(event, template) {
    Meteor.call("users.toggle.blocked", this.createdBy, function(error, result) {
      // error identification
      if (error) {
        switch(error.error) {
          case "users.toggle.blocked.not-authorized":
            sAlert.error("You need to have admin rights to block or unblock a user.");
            break;
          case "users.toggle.blocked.not-found":
            sAlert.error("This user record does not exist.");
            break;
          default:
            sAlert.error("An unexpected error occured: ", error.reason);
        }
      } else {
        // successfully blocked user
        sAlert.success("User record has successfully been updated.");
      }
    });
  }
});

// ------------------------------------------------------------------------ //
// idTrainingDateCell
// A subtemplate to be included within 'idsList' template.
// (include via 'tmpl' option in 'TabularTables.Identifications')
// ------------------------------------------------------------------------ //
Template.idTrainingDateCell.helpers({
  trainingDate: function(id) {
    var training = Trainings.findOne(id);
    return training && moment(training.date).format("MMM D YYYY, HH:mm");
  }
});
