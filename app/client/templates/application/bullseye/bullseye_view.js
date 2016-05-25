Template.bullseyeView.onCreated(function() {
  var templateInstance = this;
  templateInstance.bullseyeSize = new ReactiveVar(null);
});

Template.bullseyeView.onRendered(function() {
  var templateInstance = this;
  templateInstance.bullseyeSize.set(document.documentElement.clientHeight);

  $(window).resize(function () {
    templateInstance.bullseyeSize.set(document.documentElement.clientHeight);
  });
});

Template.bullseyeView.helpers({
  size: function() {
    return Template.instance().bullseyeSize.get() + "px";
  }
});