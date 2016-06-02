Template.header.events({
  "click #admin-logout": function(event, template) {
    event.preventDefault();
    AccountsTemplates.logout();
  },
  "click #sidebar-toggle": function(event, template) {
    event.preventDefault();
    $(".ui.sidebar").sidebar("toggle");
  }
});
