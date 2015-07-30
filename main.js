var PathDrawer = function(pathType, svg, graph) {
  var _self = this;

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#000');

  svg.append('svg:defs').append('svg:marker')
      .attr('id', 'start-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 4)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M10,-5L0,0L10,5')
      .attr('fill', '#000');

  this.pathType = pathType || PathDrawer.pathTypes.LINE;

  this.path = svg.append('svg:g').selectAll('path');

  this.getFormula = function(sx, sy, tx, ty, orientation) {
    return PathDrawer.formulas[this.pathType](sx,sy,tx,ty, orientation);
  };

  // line displayed when dragging new nodes
  this.drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

  this.updateDragLine = function (sx,sy,tx,ty, orientation) {
    _self.drag_line.attr('d', function() {
      return _self.getFormula(sx, sy, tx, ty, orientation);
    });
  };

  this.hideDragLine = function()  {
    _self.drag_line.classed('hidden', true)
        .style('marker-end', '');
  };

  this.resetDragLine = function (sx,sy,tx,ty) {
    _self.drag_line.style('marker-end', 'url(#end-arrow)')
                   .classed('hidden', false);
    _self.updateDragLine(sx,sy,tx,ty, {right: false, left: false});
  };

  this.update = function () {
    _self.path.attr('d', function (d) {
      return _self.getFormula(d.source.x, d.source.y, d.target.x, d.target.y, {left: d.left, right: d.right});
    });

    _self.label.attr("x", function(d) {
        return 100;//((d.source.x + d.target.x)/2);
    })
    .attr("y", function(d) {
        return 100;//((d.source.y + d.target.y)/2);
    });
  };

  this.refreshPaths = function() {

    _self.path = _self.path.data(graph.links);

    _self.label = svg.selectAll(".link")
        .append("text")
        .attr("class", "path")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "Black")
        .style("font", "normal 12px Arial")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) {
            return 'd.id';
        });

    function stylePath(path) {
      path.classed('selected', function(d) { return graph.selected_link && d.id === graph.selected_link.id; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });
    }

    // update existing links
    stylePath(_self.path);

    // add new links
    var newPaths = _self.path.enter()
      .append("g")
      .attr("class", "link")
      .append("path")
      .attr("class", "path")
      .on('mouseover', function linkMouseOver(d) {
        graph.mouseover_link = d;
      })
      .on('mouseout', function linkMouseOut(d) {
        graph.mouseover_link = null;
      })
      .on('mousedown', function linkMouseDown(d) {
        graph.selectLink(d);
      });

    stylePath(newPaths);

    // remove old links
    _self.path.exit().remove();
  };

};

PathDrawer.pathTypes = {
  'LINE' : 'line',
  'CURVE' : 'curve'
};

PathDrawer.formulas = {
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
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
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

var CircleDrawer = function (svg, graph, pathDrawer) {
  var _self = this;
  this.circle = svg.append('svg:g').selectAll('g');

  this.update = function() {
    _self.circle.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  };

  this.refreshCircles = function() {
    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    _self.circle = _self.circle.data(graph.nodes, function(d) { return d.id; });

    // update existing nodes (selected visual states)
    _self.circle.selectAll('circle')
      .style('fill', function(d) {
        if (!graph.selected_node) {
            return colors(d.id);
        }
        return (d.id === graph.selected_node.id) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
      });

    // add new nodes
    var g = _self.circle.enter().append('svg:g');

    g.append('svg:circle')
      .attr('class', 'node')
      .attr('r', 12)
      .style('fill', function(d) {
        if (!graph.selected_node) {
            return colors(d.id);
        }
        return (d.id === graph.selected_node.id) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
      })
      .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
      .on('mouseover', function nodeMouseOver(d) {
        graph.mouseover_node = d;
        if(!graph.mousedown_node || d.id === graph.mousedown_node.id || !d3.event.ctrlKey) return;
        // enlarge target node
        d3.select(this).attr('transform', 'scale(1.1)');
      })
      .on('mouseout', function nodeMouseOut(d) {
        graph.mouseover_node = null;
        if(!graph.mousedown_node || d.id === graph.mousedown_node.id) return;

        // unenlarge target node
        d3.select(this).attr('transform', '');
      })
      .on('click', function nodeClick(d) {
        graph.selectNode(d);
        d3.event.stopPropagation();
      })
      .on("dblclick", function(d) { d.fixed = !d.fixed; })
      .on('mousedown', function nodeMouseDown(d) {
        graph.setMouseDownNode(d);
        if(d3.event.ctrlKey) {
          pathDrawer.resetDragLine(d.x,d.y,d.x,d.y);
        }
      })
      .on('mouseup', function nodeMouseUp(d) {
        if(!graph.mousedown_node || !d3.event.ctrlKey) return;

        // needed by FF
        pathDrawer.hideDragLine();

        // check for drag-to-self
        graph.mouseup_node = d;
        if(graph.mouseup_node.id === graph.mousedown_node.id) {
          graph.resetMouseVars();
          return;
        }

        // unenlarge target node
        d3.select(this).attr('transform', '');

        graph.addLink(graph.mousedown_node, graph.mouseup_node);
        graph.mousedown_node = null;

        d3.event.stopPropagation();
      });

    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d) { return d.id; });

    // remove old nodes
    _self.circle.exit().remove();
  };

  this.disableDrag = function() {
    _self.circle
        .on('mousedown.drag', null)
        .on('touchstart.drag', null);
  };

  this.enableDrag = function(force) {
    _self.circle.call(force.drag);
  };

};

var ForceFactory = function(viewerSize, graph) {

  return d3.layout.force()
    .nodes(graph.nodes)
    .links(graph.links)
    .size([viewerSize.width, viewerSize.height])
    .linkDistance(150)
    .charge(-500);
};

var GraphViewer = function(width, height, graph) {

  var _self = this;

  this.graph = graph;

  this.colors = d3.scale.category10();

  this.svg = d3.select('#graph').append('svg');

  this.svg.attr('width', width);
  this.svg.attr('height', height);
  this.svg.attr('class', 'graph-viewer');

  this.pathDrawer = new PathDrawer(PathDrawer.pathTypes.LINE, this.svg, this.graph);
  this.circleDrawer = new CircleDrawer(this.svg, this.graph, this.pathDrawer);

  this.force = ForceFactory({width: width, height: height}, this.graph);
  this.force.on('tick', function () {
    _self.pathDrawer.update();
    _self.circleDrawer.update();
  });

  this.circleDrawer.enableDrag(this.force);

  _self.restart = function restart() {

    _self.pathDrawer.refreshPaths();
    _self.circleDrawer.refreshCircles(this.force);
    // set the graph in motion
    _self.force.start();

  };

  this.graph.onChange(_self.restart);

  function mousedown() {
    // prevent I-bar on drag
    //d3.event.preventDefault();

    // because :active only works in WebKit?
    _self.svg.classed('active', true);

    if(d3.event.ctrlKey || _self.graph.mousedown_node || _self.graph.mouseover_link ) return;

    // insert new node at point
    var point = d3.mouse(this);

    _self.graph.addNode(point[0], point[1]);

    _self.circleDrawer.enableDrag(_self.force);
  }

  function mousemove() {
    if (!_self.graph.mousedown_node) return;

    if (d3.event.ctrlKey) {
      var sx = _self.graph.mousedown_node.x,
          sy = _self.graph.mousedown_node.y,
          tx = d3.mouse(this)[0],
          ty = d3.mouse(this)[1];

      _self.pathDrawer.updateDragLine(sx, sy, tx, ty, {right: true, left: false});

      //_self.restart();
    }
  }

  function mouseup() {
    if(_self.graph.mousedown_node) {
      _self.pathDrawer.hideDragLine();

      if (d3.event.ctrlKey) {
        var point = d3.mouse(this);
        var node = _self.graph.addNode(point[0], point[1]);
        _self.graph.addLink(_self.graph.mousedown_node, node);
      }
    }

    // because :active only works in WebKit?
    _self.svg.classed('active', false);

    // clear mouse event vars
    _self.graph.resetMouseVars();

  }

  // only respond once per keydown
  var lastKeyDown = -1;

  function keydown() {
    d3.event.preventDefault();

    if(lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    // ctrl
    if(d3.event.keyCode === 17) {
      _self.circleDrawer.disableDrag();
      _self.svg.classed('ctrl', true);
    }

    if(!_self.graph.selected_node && !_self.graph.selected_link) return;
    switch(d3.event.keyCode) {
      case 8: // backspace
      case 46: // delete
        _self.graph.removeSelectedItem();
        //_self.restart();
        break;
      case 66: // B
        if(_self.graph.selected_link) {
          // set link direction to both left and right
          _self.graph.selected_link.left = true;
          _self.graph.selected_link.right = true;
        }
        _self.restart();
        break;
      case 76: // L
        if(_self.graph.selected_link) {
          // set link direction to left only
          _self.graph.selected_link.left = true;
          _self.graph.selected_link.right = false;
        }
        _self.restart();
        break;
      case 82: // R
        if(_self.graph.selected_link) {
          // set link direction to right only
          _self.graph.selected_link.left = false;
          _self.graph.selected_link.right = true;
        }
        _self.restart();
        break;
    }
  }

  function keyup() {
    lastKeyDown = -1;

    // ctrl
    if(d3.event.keyCode === 17) {
      _self.circleDrawer.enableDrag(_self.force);
      _self.pathDrawer.hideDragLine();
      _self.svg.classed('ctrl', false);
    }
  }

  _self.svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);

  d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);

  //_self.svg.call(d3.behavior.zoom().on("zoom", _self.restart)) ;
  this.restart();
};

var colors = d3.scale.category10();

var graph = new Graph();

var graphViewer = new GraphViewer(600, 400, graph);

d3.select('#clearButton').on('click', graph.reset);

d3.select('#importInput').on('change', function() {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var jsonFile = this.files[0];
    var filereader = new window.FileReader();

    graph.reset();

    filereader.onload = function(){
      var fileContent = filereader.result;
      var jsonGraph;
      try{
        jsonGraph = JSON.parse(fileContent);
      }catch(err){
        window.alert("Error importing graph. \nError message: " + err.message);
        return;
      }

      graph.import(jsonGraph);
      graphViewer.circleDrawer.enableDrag(graphViewer.force);
    };
    filereader.readAsText(jsonFile);
    this.value = null;
  } else {
    alert("Update your browser to support file management");
  }

});
d3.select('#importButton').on('click', function() {
  //d3.select('#importInput')[0].click();
  document.getElementById("importInput").click();
});
d3.select('#exportButton').on('click', function() {
  var json = graph.toJSON();
  var blob = new Blob([JSON.stringify(json)], {type: "text/plain;charset=utf-8"});
  saveAs(blob, 'export.json');
});
d3.select('#changeLinkType').on('click', function () {
  if (graphViewer.pathDrawer.pathType === PathDrawer.pathTypes.LINE) {
    graphViewer.pathDrawer.pathType = PathDrawer.pathTypes.CURVE;
    this.textContent = 'Directed links';
  }
  else {
    graphViewer.pathDrawer.pathType = PathDrawer.pathTypes.LINE;
    this.textContent = 'Curved links';
  }
  graphViewer.restart();
});

graph.onChange(function() {

  var value  = '';

  if (graph.selected_node) {
    value = 'Node: ' + graph.selected_node.id;
  }
  if (graph.selected_link) {
    value = 'Link: ' + graph.selected_link.id;
  }

  document.getElementById('selectedItem').textContent = value;
});

