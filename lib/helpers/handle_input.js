// Helper function to remove whitespace before and after an input value.
// cf. http://blog.benmcmahen.com/post/41741539120/building-a-customized-accounts-ui-for-meteor
trimInput = function(input) {
  return input.replace(/^\s*|\s*$/g, "");
};


standardizeInput = function(input) {
  return trimInput(input).toLowerCase();
};
