var NodeFactory = function(store) {
  var count = 0;

  this.createNode = function(id, x,y) {
    var node = new Node(id || count++, x,y);
    store.push(node);
    return node;
  };
};

var LinkFactory = function(store) {
  var count = 0;

  this.createLink = function(source, target) {

    // add link to graph (update if exists)
    // NB: links are strictly source < target; arrows separately specified by booleans
    var direction;
    if(source.id < target.id) {
      direction = 'right';
    } else {
      var aux = source;
      source = target;
      target = aux;
      direction = 'left';
    }

    var link;
    link = store.filter(function(l) {
      return (l.source === source && l.target === target);
    })[0];

    if(link) {
      link[direction] = true;
    } else {
      var orientation = {
        right: direction === 'right',
        left: direction === 'left'
      };
      store.push(new Link(count++, source, target, orientation));
    }

  };
};