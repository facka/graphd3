
var Graph = function() {
  var _self = this;
  this.nodes = [];
  this.links = [];
  this.selected_node = null;
  this.selected_link = null;
  this.mousedown_link = null;
  this.mousedown_node = null;
  this.mouseup_node = null;
  this.mouseover_link = null;
  this.mousedown_node = null;
  this.nodeFactory = new NodeFactory(this.nodes);
  this.linkFactory = new LinkFactory(this.links);
  this.config = {};

  this.notifyChange = function() {
    //console.warn('Subsribe to onChange event to be notified of changes in the graph');
    this.listeners.forEach(function(fn) {
      fn();
    });
  };

  this.listeners = [];

  this.getNode = function(id) {
    var node = _self.nodes.filter(function(node) {
      return node.id === id;
    })[0];
    return node;
  };

  this.import = function (jsonGraph) {
    jsonGraph.nodes.forEach(function(node) {
      _self.nodeFactory.createNode(node.id);
    });
    jsonGraph.links.forEach(function(link) {
      var orientation = {
        right: link.right,
        left: link.left
      };

      _self.linkFactory.createLink(_self.getNode(link.source), _self.getNode(link.target), orientation);
    });
    _self.notifyChange();
  };

  this.toJSON = function() {
    var json = {};
    json.nodes = _self.nodes.map(function(node) {
      return {
        id: ''+node.id
      };
    });
    var formattedLinks = _self.links.map(function(link) {
      return {
        id: ''+link.id,
        source: ''+link.source.id,
        target: ''+link.target.id,
        left: link.left,
        right: link.right
      };
    });
    json.links = formattedLinks;

    return json;
  };

  this.reset = function() {
    _self.nodes.length = 0;
    _self.links.length = 0;
    _self.notifyChange();
  };

  this.resetMouseVars = function() {
    this.mousedown_node = null;
    this.mouseup_node = null;
    this.mousedown_link = null;
  };

  this.setMouseDownNode = function(node) {
    this.mousedown_node = node;
  };

  this.selectLink = function (link) {
    if (_self.selected_link && _self.selected_link.id === link.id ) {
      _self.selected_link = null;
    }
    else {
      _self.selected_link = link;
    }
    _self.selected_node = null;
    _self.notifyChange();
  };

  this.selectNode = function (node) {
    if (_self.selected_node && _self.selected_node.id === node.id ) {
      _self.selected_node = null;
    }
    else {
      _self.selected_node = node;
    }
    _self.selected_link = null;
    _self.notifyChange();
  };

  var removeLinks = function(node) {
    var toSplice = _self.links.filter(function(l) {
      return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
      _self.links.splice(_self.links.indexOf(l), 1);
    });
  };

  var removeNode = function (node) {
    _self.nodes.splice(_self.nodes.indexOf(node), 1);
    removeLinks(node);
  };

  var removeLink = function(link) {
    _self.links.splice(_self.links.indexOf(link), 1);
  };

  this.removeSelectedItem = function() {
    if(_self.selected_node) {
      removeNode(_self.selected_node);
    } else if(_self.selected_link) {
      removeLink(_self.selected_link);
    }
    _self.selected_link = null;
    _self.selected_node = null;
    _self.notifyChange();
  };

  this.addNode = function(x,y) {
    var node = _self.nodeFactory.createNode(null,x,y);
    _self.notifyChange();
    return node;
  };

  this.addLink = function(source, target, direction) {
    if (direction !== 'right' && direction !== 'left') {
      direction = 'right';
    }
    var link;
    link = _self.links.filter(function(l) {
      return (l.source === source && l.target === target);
    })[0];

    if(link) {
      link[direction] = true;
    } else {
      var orientation = {
        right: direction === 'right',
        left: direction === 'left'
      };
      _self.linkFactory.createLink(source, target, orientation);
    }

    graph.selected_link = null;
    graph.selected_node = null;
    _self.notifyChange();
  };

  this.onChange = function(cb) {
    _self.listeners.push(cb);
  };

};