Template.masterLayout.onCreated(function() {
  var templateInstance = this;
  templateInstance.availWidth = new ReactiveVar(null);
});

Template.masterLayout.onRendered(function() {
  var templateInstance = this;
  templateInstance.availWidth.set(
    document.documentElement.clientWidth - $("#admin-aside").width()
  );

  $(window).resize(function () {
    templateInstance.availWidth.set(
      document.documentElement.clientWidth - $("#admin-aside").width()
    );
  });

  $("#layout-context .ui.sidebar").sidebar({
    context:$("#layout-context"),
    dimPage: false,
    onHide: function() {
      var newWidth = templateInstance.availWidth.get() + $("#admin-aside").width();
      templateInstance.availWidth.set(newWidth);
      $("#admin-aside").removeClass("aside-in");
      $("#admin-aside").addClass("aside-off");
    },
    onVisible: function() {
      var newWidth = templateInstance.availWidth.get() - $("#admin-aside").width();
      templateInstance.availWidth.set(newWidth);
      $("#admin-aside").removeClass("aside-off");
      $("#admin-aside").addClass("aside-in");
    }
  });
});

Template.masterLayout.helpers({
  width: function() {
    return Template.instance().availWidth.get() + "px";
  }
});
