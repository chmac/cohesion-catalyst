Template.trainingsList.events({
  "click .training-delete-button": function(event, template) {
    event.preventDefault();
    console.log("Delete button clicked of ", this._id);
  }
});
