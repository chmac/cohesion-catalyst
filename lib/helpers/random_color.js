/**
 * random_color.js
 *
 * Helper function to assign random color to elements.
 * CSS classes with specified color values are located at 'colors.css.'
 */

pickRandomColorClass = function() {
  var colorClasses = [];

  for (var i = 1; i < 7; i++) {
    colorClasses.push("c" + i);
  }

  // We use the 'sample()' function of the 'Underscore' library which returns a random item from
  // the 'colorClasses' array.
  return _.sample(colorClasses);
 };
