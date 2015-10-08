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
detectCollision = function(coords, root, radius, width) {
  var coordinates = coords;

  // We regulate the bounding area of the drawing surface.
  // Borrowed here [as of 2015-10-05]: http://bl.ocks.org/mbostock/1557377
  coordinates[0] = Math.max(radius, Math.min(width - radius, coords[0]));
  coordinates[1] = Math.max(radius * 2, Math.min(root.y, coords[1]));

  // We check for collision with all other nodes on the drawing surface.
  // Approach is borrowed from collision detection examples at
  // http://bl.ocks.org/mbostock/3231298
  // http://vallandingham.me/building_a_bubble_cloud.html
  // TODO replace we find-operation in DB
  // d3.selectAll("g.node").each(function(d, i) {
  //   // We don't want to compare a node with itself so make sure to apply
  //   // the comparison just for ID nodes in the selection which currently are not
  //   // dragged or randomly positioned as matched IDs (Note that at this point a
  //   // matched ID doesn't have its x or y coordinates yet because we are in the middle
  //   // of determining it - hence the check of 'd.x').
  //   if (d.x && !d3.select(this).classed("dragging")) {
  //     // Using the distance equation we find the distance between the nodes.
  //     var dx = coordinates[0] - d.x,
  //       dy = coordinates[1] - d.y,
  //       distance = Math.sqrt(dx * dx + dy * dy),
  //       padding = radius,
  //       // We specify the minimum distance between two nodes.
  //       minDistance = (radius * 2) + padding;
  //       // Drops the current distance below the allowed minimum distance?
  //       if (distance < minDistance) {
  //         console.log(d.name);
  //         // We scale the distance and displace the coordinates.
  //         distance = (minDistance - distance) / distance * 0.8;
  //           coordinates[0] += dx * distance;
  //           coordinates[1] += dy * distance;
  //         }
  //   }
  // });




    Identifications.find({
      createdBy: Meteor.userId(),
      trainingId: Meteor.user().profile.currentTraining,
      x: {
        $exists: true
      }
    }).forEach(function(id) {
      console.log("foreach", d3.selectAll("#gid" + id._id));
      // TODO Investigate!!!! This does not work!!!!!!!!
      // if (!d3.select("#gid" + id._id).classed("dragging")) {
        // Using the distance equation we find the distance between the nodes.
        var dx = coordinates[0] - id.x,
          dy = coordinates[1] - id.y,
          distance = Math.sqrt(dx * dx + dy * dy),
          padding = radius,
          // We specify the minimum distance between two nodes.
          minDistance = (radius * 2) + padding;
        // Drops the current distance below the allowed minimum distance?
        if (distance < minDistance) {
          console.log(id.name);
          // We scale the distance and displace the coordinates.
          distance = (minDistance - distance) / distance * 0.8;
          coordinates[0] += dx * distance;
          coordinates[1] += dy * distance;
        }
      // }
    });

  return coordinates;
}; // end detectCollision()
