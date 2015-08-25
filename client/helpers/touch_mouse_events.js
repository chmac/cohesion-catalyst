/**
 * Handle desired touch and mouse events for D3 based app
 * in a consistent manner, including long-click and long-drag
 * 
 * Usage: 
 *
 *   touchMouseEvents(target, container, options)
 *
 *   target: any D3-selection of HTML/SVG elements
 *
 *           Example: d3.select("#ids-vis")
 *
 *
 *   container: the container-type DOM element used to determine 
 *              mouse/touch positions. Positions will be calculated
 *              in the coordinate system of that container (canvas, svg, g).
 *              This is the same argument that you would pass to d3.mouse() or d3.touches().
 *
 *              Example: d3.select("#ids-vis").node()
 *
 *   
 *   options:   an object defining one or more event callbacks as well 
 *              as other options. almost all callbacks will receive 
 *              two parameters (x,y) that reflect the mouse/touch position
 *              relative to the specified container; the *drag*
 *              callbacks will receive four parameters (x,y,deltaX,deltaY)
 *              with deltaX and deltaY being the position relative to that
 *              from the previous call to the same callback.
 *
 *              Available low-level listeners (no interpretation of drag or long-press)
 *              "down":         mouse/touch is pressed down
 *              "up":           mouse/touch is released
 *
 *              Available higher-level listeners:
 *              "move":         mouse/touch is moving, but not dragging, across the target
 *              "longDown":     mouse/touch is pressed down in the same position for a longer time
 *              "click":        mouse/touch pressed and released in the same position
 *              "longClick":    mouse/touch is pressed for a longer time and released in the same position
 *              "dragMove":     mouse/touch is moving during a normal drag operation
 *              "longDragMove": mouse/touch is moving during a drag operation after a long press
 *              "dragEnd":      end of a normal drag operation (mouse/touch is released)
 *              "longDragEnd":  end of a long-press drag operation (mouse/touch is released)
 *
 *              Available further options:
 *
 *              "test":          if set to true, dummy event callbacks will be created that
 *                               produce console output for testing/debugging
 *              "longPressTime": after how many miliseconds does a press become a "long" press?
 *              "posTolerance":  by how many pixels must two mouse positions differ before we 
 *                               consider them two different positions? This is used to 
 *                               distinguish between clicking and dragging.
 * 
 *              Example options object: 
 *
 *              { 
 *                 "longPressTime": 500,                      // half a second for a long press
 *                 "longDown": function(x,y) { 
 *                   console.log("pressed for a long time, at x="+x+", y="+y);
 *                 },
 *                 "dragMove": function(x,y,deltaX,deltaY) { 
 *                   d3.event.preventDefault();               
 *                   console.log("dragged yet another ("+deltaX+","+deltaY") pixels");
 *                 },  
 *                 "longDragMove": function(x,y,deltaX,deltaY) { 
 *                   d3.event.preventDefault();               
 *                   console.log("dragged after a long press, yet another ("+deltaX+","+deltaY") pixels");
 *                 },  
 *                 "test": true,                              // for all other events, produce console output 
 *              }
 *
 */

/** 
  *  module returns function 
  *  NOTE that the definition below is GLOBAL
  *  because only globally declared functions will be readable in other JS files!
  *  see: http://stackoverflow.com/questions/16166509/in-which-order-meteor-include-my-js-files
  **/
touchMouseEvents = function() {

  // is touch supported by browser?
  var hasTouch = function() {
    return "ontouchstart" in window;
  };

  // get mouse / touch pos
  var getCurrentPos = function(container) {
    var pos = hasTouch()? d3.touches(container)[0] : d3.mouse(container);
    pos[0]=Math.round(pos[0]);
    pos[1]=Math.round(pos[1]);
    return pos;
  };

  var events = function(d3target, container, cfg) {

    // some default values
    cfg = cfg || {};
    cfg.longPressTime = cfg.longPressTime || 1000; // miliseconds
    cfg.posTolerance  = cfg.posTolerance  || 5;    // pixels

    // test mode: assign debugging functions to all possible events
    if(cfg.test) {
      cfg.down        = cfg.down || function(x,y) { console.log("down pos=("+x+","+y+")"); };
      cfg.up          = cfg.up || function(x,y) { console.log("up pos=("+x+","+y+")"); };
      cfg.click       = cfg.click || function(x,y) { console.log("click pos=("+x+","+y+")"); };
      cfg.longDown    = cfg.longDown || function(x,y) { console.log("longDown pos=("+x+","+y+")"); };
      cfg.longClick   = cfg.longClick || function(x,y) { console.log("longClick pos=("+x+","+y+")"); };
      cfg.move        = cfg.move ||function(x,y,dx,dy) { console.log("move pos=("+x+","+y+")"); };
      cfg.dragMove    = cfg.dragMove || function(x,y,dx,dy) { console.log("dragMove pos=("+x+","+y+"), delta=("+dx+","+dy+")"); };
      cfg.dragEnd     = cfg.dragEnd || function(x,y,dx,dy) { console.log("dragEnd pos=("+x+","+y+"), delta=("+dx+","+dy+")");  };
      cfg.longDragMove= cfg.longDragMove || function(x,y,dx,dy) { console.log("longDragMove pos=("+x+","+y+"), delta=("+dx+","+dy+")"); };
      cfg.longDragEnd = cfg.longDragEnd || function(x,y,dx,dy) { console.log("longDragEnd pos=("+x+","+y+"), delta=("+dx+","+dy+")"); };
    }

    // which mode are we in?
    // TODO: this can go wrong, if the mouse is already pressed when the function is called
    var mode = "UP";

    // track where the mouse/finger has gone down initially
    var downPos;

    // track the previous know position during drag operations
    var lastDragPos;

    // remember the timeout callback for long press
    var longDownTimeoutCallback = undefined;

    // mouse/finger down can be the beginning of a click, a drag, or a long click
    var down = function() {

      downPos = getCurrentPos(container);
      mode = "DOWN";

      // callback for "mouse/finger down"
      cfg.down && cfg.down(downPos[0], downPos[1]);

      // set up timeout so in a few miliseconds this turns into a long click
      if(cfg.longDown) {
        longDownTimeoutCallback = setTimeout(checkLongPress, cfg.longPressTime);
      }

    };

    // some time after clicking down, trigger long click if mouse did not move
    var checkLongPress = function() {

      // check if we have changed mode in the meantime
      if(mode != "DOWN") {
        if(cfg.test)
          console.log("this was not a long press");
        return;
      };

      // change mode to "LONG" and trigger callback
      mode = "LONG";
      cfg.longDown && cfg.longDown(downPos[0], downPos[1]);
    };

    /** this event listener is called whenever the mouse/touch is moving */
    var move = function() {

      var pos = getCurrentPos(container);

      if(mode == "UP") {

        // mouse is not pressed, so this is just a "move" event
        cfg.move && cfg.move(pos[0],pos[1]);
        return;

      } 

      // moving with the mouse down, but not yet in dragging mode?
      if(mode == "DOWN" || mode == "LONG") {

        // check tolerance from initial position
        if(Math.abs(pos[0]-downPos[0])>cfg.posTolerance ||
           Math.abs(pos[1]-downPos[1])>cfg.posTolerance   ) {

          // the mouse moved, so this can no longer become a "long press"
          if(longDownTimeoutCallback) {
            clearTimeout(longDownTimeoutCallback);
            longDownTimeoutCallback = undefined;
          };

          // drag start starts in initial "button down" position
          lastDragPos = downPos;

          // start dragging mode
          mode = mode=="LONG"? "LONGDRAG" : "DRAG"; 

        } else {

          // mouse moved within same-pixel tolerance value
          if(cfg.test) {
            console.log("moving within pixel tolerance...");
          };

        }; // pixel tolerance 

      }; // if mode DOWN or LONG

      // in dragging mode, calculate delta and trigger respective events
      if(mode == "DRAG" || mode == "LONGDRAG") {

        // calculate delta position from last known position
        var deltaPos = [ pos[0]-lastDragPos[0],
                         pos[1]-lastDragPos[1] ];

        // current positions is stored as last known position
        lastDragPos = pos;

        // trigger callbacks
        if(mode == "DRAG") {
          cfg.dragMove && cfg.dragMove(pos[0],pos[1], deltaPos[0],deltaPos[1]);
        } else if(mode == "LONGDRAG") {
          cfg.longDragMove(pos[0],pos[1], deltaPos[0],deltaPos[1]);
        };

      }; // if mode DRAG or LONGDRAG

    }; // move

    /** this event listener is called whenever the mouse/touch is released */
    var up = function(event) {

      // current mouse pos
      var pos = getCurrentPos(container);

      // reset mode, remember previous mode
      var prevMode = mode;
      mode = "UP";

      // trigger "up" callback
      cfg.up && cfg.up(pos[0],pos[1]);

      // trigger "click" or long click" callback
      if(prevMode == "DOWN") {
         cfg.click && cfg.click(pos[0],pos[1]);
         return;
      } else if(prevMode == "LONG") {
        cfg.longClick && cfg.longClick(pos[0],pos[1]);
        return;
      };

      // calculate delta position from last known position
      var deltaPos = [ pos[0]-lastDragPos[0],
                       pos[1]-lastDragPos[1] ];

      // trigger "drag end" callback
      if(prevMode == "DRAG") {
         cfg.dragEnd && cfg.dragEnd(pos[0],pos[1],deltaPos[0],deltaPos[1]);
      } else if(prevMode == "LONGDRAG") {
         cfg.longDragEnd && cfg.longDragEnd(pos[0],pos[1],deltaPos[0],deltaPos[1]);
      } 

    }; // up()

    // now hook up the basic mouse/touch events
    if(hasTouch()) {
      d3target.on("touchstart", down);
      d3target.on("touchmove", move);
      d3target.on("touchend",   up);
    } else {
      d3target.on("mousedown", down);
      d3target.on("mousemove", move);
      d3target.on("mouseup",   up);
    };

  }; // events()
 
  // module returns events function
  return events;

} (); //  module
