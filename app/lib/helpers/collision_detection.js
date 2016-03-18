/**
 * Constrains the dragging of nodes to the SVG viewport, i.e. the drawing surface
 * and also detects colliding nodes.
 * For example, if the user is about to drag a node outside of the SVG canvas, the
 * coordinate is set to the bounding value, taking the node's radius into account.
 * At the bottom, the specified boundary is the position of the avatar icon.
 * @param {Array} coords The current {@code x} and {@code y} coordinates as two-element array.
 * @param {Object} root The root node data object.
 * @param {number} radius The specified radius of the node (i.e. {@code <circle>}).
 * @param {number} width The specified width of the drawing surface.
 * @return {Array}
 */
detectCollision = function(currentId, coords, root, radius, width) {
  var coordinates = coords;

  // We regulate the bounding area of the drawing surface.
  // Borrowed here [as of 2015-10-05]: http://bl.ocks.org/mbostock/1557377
  coordinates[0] = Math.max(radius * 2, Math.min(width - radius * 2, coords[0]));
  coordinates[1] = Math.max(radius * 2, Math.min(root.y, coords[1]));

  // We check for collision with all other identification nodes on the drawing surface.
  // Approach is borrowed from collision detection examples at
  //    http://bl.ocks.org/mbostock/3231298
  //    http://vallandingham.me/building_a_bubble_cloud.html
  // but instead of accessing data with D3 selections we query the 'Identifications' collection.
  Identifications.findCurrentIdentifications(Meteor.userId(), Meteor.user().profile.currentTraining)
    .forEach(function(id) {
      // We don't want to compare the current identification with itself.
      if (currentId !== id._id) {
        // Using the distance equation we find the distance between the nodes.
        var dx = coordinates[0] - id.x,
          dy = coordinates[1] - id.y,
          distance = Math.sqrt(dx * dx + dy * dy),
          padding = radius,
          // We specify the minimum distance between two nodes.
          minDistance = (radius) + padding;
        // Does the current distance drop below the allowed minimum distance?
        if (distance < minDistance) {
          // We scale the distance and displace the coordinates.
          //
          // HEADS UP: If distance is 0 (e.g. when we compare nodes that happen to have same
          // positions), dividing by 0 will result in a NaN error!
          // We handle this error differently at the places we call the 'detectCollision()'
          // function in our app.
          distance = (minDistance - distance) / distance * 0.8;
          coordinates[0] += dx * distance;
          coordinates[1] += dy * distance;
        }
      }
  });

  return coordinates;
}; // end detectCollision()
