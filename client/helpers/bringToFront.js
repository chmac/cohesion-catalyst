/**
 * bringToFront.js
 *
 * Helper function to bring the selected element to the front in case of overlapping elements.
 * We can accomplish that by reordering the element in the DOM tree.
 * Hence, we append the current selected element at the end of its parent because
 * with SVG, the last element in the document tree is drawn on top.
 * cf. [as of 2015-10-05] http://bl.ocks.org/alignedleft/9612839
 * cf. [as of 2015-10-05] http://www.adamwadeharris.com/how-to-bring-svg-elements-to-the-front/
 *
 * @param {} selection - The current D3 selection to be moved to the front.
 */
bringToFront = function(selection) {
  console.log(typeof selection);
  if (selection && selection.node()) {
    selection.node().parentNode.appendChild(selection.node());
  }
};
