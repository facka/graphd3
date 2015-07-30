var Node = function(id, x, y) {
  this.id = id;
  this.x = x;
  this.y = y;
};

var Link = function(id, source, target, orientation) {
  orientation = orientation || { right: false, left: false};
  this.id = id;
  this.source = source;
  this.target = target;
  this.right = orientation.right;
  this.left = orientation.left;
};
