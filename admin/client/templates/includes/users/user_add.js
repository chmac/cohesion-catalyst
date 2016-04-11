Template.userNew.helpers({
  isUserType: function(fieldName, formId, keyword) {
    var type = keyword.hash.value ? keyword.hash.value : "";
    return AutoForm.getFieldValue(fieldName, formId) === type;
  }
});
