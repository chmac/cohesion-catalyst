/**
 * forceNetwork.js
 *
 *
 */

forceLayoutNetwork = function() {
  // We create a margin object following the D3 margin convention.
  // cf. http://bl.ocks.org/mbostock/3019563
  var margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };

  var width = 788,
    height = 1044,
    avatarSize = 150,
    outerRadius,
    allData,
    linksData = [],
    bubblesData = [],
    playerData = [],

    drawingSurface,

    linksContainer,
    bubblesContainer,
    playersContainer,

    link,
    bubble,
    bubbleGroup,
    player,

    force
    ;

  function networkVis(selection, data) {
    // selection.each(function(data) {
    //
    // });
    // console.log("networkVis ", data);

    // We construct a new force-directed layout
    if (!force) {
      force = d3.layout.force();
    }

    allData = setupData(data);
    console.log(allData);
    drawingSurface = makeDrawingSurface(selection);

    linksContainer = drawingSurface.append("g").attr("id", "links-group");
    bubblesContainer = drawingSurface.append("g").attr("id", "bubbles-group");
    playersContainer = drawingSurface.append("g").attr("id", "players-group");

    makePlayersCircle(allData.players);


    force
      .size([width, height])
      .nodes(allData.networkIds)
      .links(allData.links)
      .gravity(0.8)
      .charge(function(d) {
        return -Math.pow(d.radius * 2, 2.0);
      })
      .friction(0.7)
      .on("tick", updatePositions);

    updateLayout();

  } // networkVis()


  function updateLayout() {
    bubblesData = allData.networkIds;
    linksData = allData.links;

    // force.nodes(bubblesData);
    makeBubbles(bubblesData);

    // force.links(linksData);
    // makeLinks(linksData);

    force.start();
  } // updateLayout()


  networkVis.margin = function(m) {
    if (!arguments.length) {
      return margin;
    }
    margin = m;
    return networkVis;
  };

  networkVis.width = function(w) {
    if (!arguments.length) {
      return width;
    }
    width = w;
    return networkVis;
  };

  networkVis.height = function(h) {
    if (!arguments.length) {
      return height;
    }
    height = h;
    return networkVis;
  };

  networkVis.outerRadius = function() {
    outerRadius = Math.min(networkVis.width(),
      networkVis.height() - networkVis.avatarSize()/2) / 2 - networkVis.avatarSize() / 2;
    return outerRadius;
  };

  networkVis.avatarSize = function(s) {
    if (!arguments.length) {
      return avatarSize;
    }
    avatarSize = s;
    return networkVis;
  };

  networkVis.updateData = function(newData) {
    // force.stop();
    allData = setupData(newData);
    // link.remove();
    bubble.remove();
    // allData.networkIds.push(newData);
    // setupData(allData);
    updateLayout();
  };

  function setupData(data) {
    var theta = 2 * Math.PI / data.players.length;
    var centerX = networkVis.width() / 2;
    var centerY = networkVis.height() / 2;
    var count = _.pluck(data.networkIds, "matchCount");
    var bubbleRadius = d3.scale.sqrt()
      .domain(d3.extent(count))
      .range([networkVis.outerRadius() * 0.1, networkVis.outerRadius() * 0.2]);

    data.players.forEach(function(p, i, players) {
      var x, y;
      x = centerX + networkVis.outerRadius() * Math.cos(i * theta);
      y = centerY + networkVis.outerRadius() * Math.sin(i * theta);
      _.extend(p, {x: x}, {y: y});
    });

    // data.networkIds.forEach(function(n, i, ids) {
    //   var x, y, radius;
    //   x = (Math.random() * (networkVis.width() - networkVis.avatarSize()));
    //   y = (Math.random() * (networkVis.height() - networkVis.avatarSize()));
    //   radius = bubbleRadius(n.matchCount);
    //   _.extend(n, {x: x}, {y: y},{radius: radius});
    // });

    // data.links = processLinksData(data.players, data.networkIds);
    // data.links = processLinksData(data.players, data.networkIds);
    // arrange links data
    // for (var i = 0; i < data.networkIds.length; i++) {
    //   for (var j = 0; j < data.networkIds[i].createdBy.length; j++) {
    //     var creatorId = data.networkIds[i].createdBy[j];
    //     var creator = _.findWhere(data.players, {_id: creatorId});
    //     data.links.push({source:data.networkIds[i], target: creator});
    //   }
    // }
    return data;
  }


  function processLinksData(playerData, networkData) {
    var processedLinks = [];

    for (var i = 0; i < networkData.length; i++) {
      for (var j = 0; j < networkData[i].createdBy.length; j++) {
        var creatorId = networkData[i].createdBy[j];
        var creator = _.findWhere(playerData, {_id: creatorId});
        processedLinks.push({source:networkData[i], target: creator});
      }
    }

    return processedLinks;
  } // processLinksData()

  /**
    * Create the SVG drawing area
    *
    * @param {string} target - The DOM element the visualization will live in.
    *   e.g. '#ids-graph'
    */
  function makeDrawingSurface(target) {
    var container = d3.select(target);
    var margin = networkVis.margin();

    // We define the inner dimensions of the drawing area.
    var width = networkVis.width() - margin.left - margin.right;
    var height = networkVis.height() - margin.top - margin.bottom;

    // remove all existing children of the drawing area
    container.select("svg").remove();
    // We create our outermost <svg> and append it to the existing <div id='ids-graph'>.
    var svgViewport = container.append("svg")
      .attr("id", "network-vis")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin
        .top + margin.bottom))
      .attr("preserveAspectRatio", "xMidYMin meet");

    // We append a <g> element that translates the origin to the top-left
    // corner of the drawing area.
    var canvas = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // We append a <rect> as the 'canvas' to draw on and as target of 'pointer events'.
    canvas.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "drawing-surface");

    // events on background
    touchMouseEvents(canvas, canvas.node(), {
      "test": false,
      "down": function(d,x,y) {
        d3.selectAll("line").style("opacity", 0);
      }
    });

    return canvas;

  } // makeDrawingSurface()


  function makePlayersCircle(playerData) {
    var size = networkVis.avatarSize();

    player = playersContainer.selectAll(".player").data(playerData, function(d, i) {
      return d._id;
    });

    player.exit().remove();

    var playerGroup = player.enter()
      .append("g")
      .attr("id", function(d) {
        // We need to prefix the value that is assigned to the 'id' attribute
        // in order to prevent an invalid 'querySelector' which will be the case
        // if the value happens to start with a numeric character.
        // So we use the prefix 'gid' ('gid' as in 'group identifier').
        return "gid" + d._id;
      })
      .classed("player connectable", true)
      .attr("transform", function(d, i) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    playerGroup.append("use")
      .attr("xlink:href", function(d) {
        var defaultAvatarURL = "/svg/avatars.svg#smiley-smile";
        // var currentAvatar = Avatars.findOne({
        //   type: d.profile.avatar
        // });
        // return currentAvatar && currentAvatar.url || defaultAvatarURL;
        return d.profile.avatar && "/svg/avatars.svg" + d.profile.avatar || defaultAvatarURL;
      })
      .attr("width", size)
      .attr("height", size)
      .attr("transform", "translate(" + (-size / 2) + "," + (-size / 2) + ")");

    playerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate(0," + (size / 2 + 5) + ")")
      .text(function(d) {
        return d.profile.name;
      });

  } // makePlayersCircle()


  function makeBubbles(data) {
    var count = _.pluck(data, "matchCount");
    var bubbleRadius = d3.scale.sqrt()
      .domain(d3.extent(count))
      .range([networkVis.outerRadius() * 0.1, networkVis.outerRadius() * 0.2]);

    bubble = bubblesContainer.selectAll(".id-circle").data(data, function(d) {
      return d._id;
    });

    bubble.exit().remove();

    // bubble = bubble.enter().append("g")
    bubbleGroup = bubble.enter().append("g")
      .classed("id-circle connectable", true)
      .attr("transform", function(d) {
        d.x = (Math.random() * (networkVis.width() - networkVis.avatarSize()));
        d.y = (Math.random() * (networkVis.height() - networkVis.avatarSize()));
        return "translate(" + d.x + "," + d.y + ")";
      })
      .on("mouseover", function(d,x,y) {
        d3.selectAll("line").filter(function(link) {
          return link.source._id !== d._id;
        }).style("opacity", 0);
        d3.selectAll("line").filter(function(link) {
          return link.source._id === d._id;
        }).style("opacity", 1);
        d3.selectAll(".id-circle circle").filter(function(circle) {
          return circle._id !== d._id;
        }).style("opacity", 0.4);
        d3.selectAll(".id-circle circle").filter(function(circle) {
          return circle._id === d._id;
        }).style("opacity", 1);
      });

    // bubble.append("circle")
    bubbleGroup.append("circle")
      .attr("r", 0)
      .attr("class", function(d) {
        return d.color;
      })
      .transition().duration(500).attr("r", function(d) {
        d.radius = bubbleRadius(d.matchCount);
        return d.radius;
      });

    // Append a <foreignObject> to the <g>. The <foreignObject> contains a <p>.
    // bubble.append("foreignObject")
    bubbleGroup.append("foreignObject")
      .attr({
        "class": "foreign-object",
        "width": function(d) {
          return d.radius * 2;
        },
        "height": function(d) {
          return d.radius * 2;
        },
        "transform": function(d) {
          return "scale(0.9) translate(" + (-d.radius) + ", " + (-d.radius) + ")";
        }
      })
      .append("xhtml:p")
      .classed("txt-pool", true)
      .style({
        "width": function(d) {
          return d.radius *  2 + "px";
        },
        "height": function(d) {
          return d.radius *  2 + "px";
        },
        "max-width": function(d) {
          return d.radius  *  2 + "px";
        },
        "max-height": function(d) {
          return  d.radius *  2  + "px";
        },
        "font-size": "1em" // making it inline to override CSS rules
      })
      .text(function(d) {
        return d.name;
      });

    // Call the function to handle touch and mouse events, respectively.
    touchMouseEvents(bubble, drawingSurface.node(), {
    // touchMouseEvents(bubbles, canvas.node(), {
      "test": false,
      "down": function(d,x,y) {
        d3.selectAll("line").filter(function(link) {
          return link.source._id !== d._id;
        }).style("opacity", 0);
        d3.selectAll("line").filter(function(link) {
          return link.source._id === d._id;
        }).style("opacity", 1);
      }
    });
  } // makeBubbles()

  function makeLinks(data) {
    link = linksContainer.selectAll("line.link").data(data, function(d) {
      return d.source._id + "-" + d.target._id;
    });

    link.exit().remove();

    link.enter().insert("line", "g.connectable")
      .attr("class", "link")
      .style("opacity", 0)
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });
  } // makeLinks()


  function updatePositions(event) {
    var damping = 0.1;
    // var centerX = networkVis.width() / 2;
    // var centerY = networkVis.height() / 2;
    //
    // allData.networkIds.forEach(function(datum, i) {
    //   datum.x = datum.x + (centerX - datum.x) * (damping + 0.02) * event.alpha;
    //   datum.y = datum.y + (centerY - datum.y) * (damping + 0.02) * event.alpha;
    // });

    bubble.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

    // link.attr("x1", function(d) {
    //     return d.source.x;
    //   })
    //   .attr("y1", function(d) {
    //     return d.source.y;
    //   })
    //   .attr("x2", function(d) {
    //     return d.target.x;
    //   })
    //   .attr("y2", function(d) {
    //     return d.target.y;
    //   });
  } // updatePositions()


  return networkVis;
};
