Template.header.events({
  "click #admin-logout": function(event, template) {
    event.preventDefault();
    AccountsTemplates.logout();
  }
});
