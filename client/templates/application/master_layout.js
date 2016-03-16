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
});

Template.masterLayout.helpers({
  width: function() {
    return Template.instance().availWidth.get() + "px";
  }
});
