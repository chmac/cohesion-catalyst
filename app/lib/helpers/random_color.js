/**
 * random_color.js
 *
 * Helper function to assign random color to elements.
 * CSS classes with specified color values are located at 'colors.css.'
 */
var colorClasses = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9"];
var previousColor;
pickRandomColorClass = function() {
  // We use the 'sample()' function of the 'Underscore' library which
  // returns a random item from the 'colorClasses' array.
  var color = _.sample(colorClasses);
  if (color === previousColor) {
    return pickRandomColorClass();
  }
  previousColor = color;
  return color;
 };
