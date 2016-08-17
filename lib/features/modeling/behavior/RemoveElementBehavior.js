'use strict';

var inherits = require('inherits');

var drop = require('lodash/array/drop'),
    dropRight = require('lodash/array/dropRight'),
    has = require('lodash/object/has');

var CommandInterceptor = require('diagram-js/lib/command/CommandInterceptor');

function RemoveElementBehavior(eventBus, bpmnRules, modeling) {

  CommandInterceptor.call(this, eventBus);

  /**
   * Combine sequence flows when deleting an element
   * if there is one incoming and one outgoing
   * sequence flow
   */

  function getNewWaypoints(inWays, outWays) {

    var inStraight = inWays.slice(),
        outStraight = outWays.slice(),
        insertIndex = inStraight.length-1,
        // remove last or first waypoint of inConnection or outConnection
        waypoints = dropRight(inStraight, 1).concat(drop(outStraight, 1));

    // get the last two or first two waypoints of inConnection or outConnection
    inStraight = drop(inStraight, inStraight.length - 2);
    outStraight = dropRight(outStraight, outStraight.length - 2);


    if (inStraight[1].x === outStraight[0].x || inStraight[1].y === outStraight[0].y) {
      // straights are identical
    } else {
      // straights are perpendicular
      // calculate the intersections of the straights
      var intersection = {};
      intersection.original = inStraight[1].original;

      if (inStraight[0].x === inStraight[1].x) {
        intersection.x = inStraight[1].x;
      } else if (inStraight[0].y === inStraight[1].y) {
        intersection.y = inStraight[1].y;
      }
      if (outStraight[0].x === outStraight[1].x) {
        intersection.x = outStraight[1].x;
      } else if (outStraight[0].y === outStraight[1].y) {
        intersection.y = outStraight[1].y;
      }

      if (has(intersection, 'x') && has(intersection, 'y')) {
        // insert intersection
        waypoints.splice(insertIndex, 0, intersection);
      }
    }

    return waypoints;
  }


  this.preExecute('shape.delete', function(e) {

    var shape = e.context.shape;

    if (shape.incoming.length == 1 && shape.outgoing.length == 1) {

      var inConnection = shape.incoming[0],
          outConnection = shape.outgoing[0];


      if (bpmnRules.canConnect(inConnection.source, outConnection.target, inConnection)) {

        // get new waypoints
        var newWaypoints = getNewWaypoints(inConnection.waypoints, outConnection.waypoints);

        modeling.reconnectEnd(inConnection, outConnection.target, newWaypoints);
      }

    }
  });
}

inherits(RemoveElementBehavior, CommandInterceptor);

RemoveElementBehavior.$inject = [ 'eventBus', 'bpmnRules', 'modeling' ];

module.exports = RemoveElementBehavior;
