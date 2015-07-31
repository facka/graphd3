var PathType = function (type) {
  this.type = type;

  this.getFormula = function(sx, sy, tx, ty, orientation) {
    return PathType.formulas[this.type](sx,sy,tx,ty, orientation);
  };

};

PathType.LINE = 'line';
PathType.CURVE = 'curve';

PathType.formulas = {
  line:  function(sx, sy, tx, ty, orientation) {
      var deltaX = tx - sx,
          deltaY = ty - sy,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourcePadding = orientation.left ? 17 : 12,
          targetPadding = orientation.right ? 17 : 12,
          sourceX = sx + (sourcePadding * normX),
          sourceY = sy + (sourcePadding * normY),
          targetX = tx - (targetPadding * normX),
          targetY = ty - (targetPadding * normY);
      sourceX = sourceX || 0;
      sourceY = sourceY || 0;
      targetX = targetX || 0;
      targetY = targetY || 0;
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    },
    curve: function(sx, sy, tx, ty, orientation) {
      var dx = tx - sx,
          dy = ty - sy;
      var dr = 2 * Math.sqrt(dx * dx + dy * dy);
      var deltaX = tx - sx,
          deltaY = ty - sy,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.8,
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourcePadding = orientation.left ? 17 : 12,
          targetPadding = orientation.right ? 17 : 12,
          sourceX = sx + (sourcePadding * normX),
          sourceY = sy + (sourcePadding * normY),
          targetX = tx - (targetPadding * normX),
          targetY = ty - (targetPadding * normY);
      return "M" + sx + "," + sy + "A" + dr + "," + dr + " 0 0,0 " + tx + "," + ty;
    }
};