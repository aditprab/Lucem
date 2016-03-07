var width = 800;
var height = 500;

var data = [
    {
        radius: 20
    },
    {
        radius: 30
    },
    {
        radius: 40
    },
    {
        radius: 10
    },
    {
        radius: 10
    }
]

var links = [
    {
        source: 0,
        target: 1
    },
    {
        source: 0,
        target: 2
    },
    {
        source: 0,
        target: 3
    },
    {
        source: 0,
        target: 4
    }
]

var container = d3.select("#d3-graph").append("svg")
    .attr({
        width: width,
        height: height
    });
    
var force  = d3.layout.force()
    .size([width, height])
    .linkDistance(width/4)
    .nodes(data)
    .links(links)
    .charge(function(d, i) {
        return d.radius * (-20);
    })
    .start();

var links = container.selectAll(".link")
    .data(links).enter().append("line")
    .style("stroke-width", "1px")
    .style("stroke", "grey");

var node = container.selectAll(".node")
    .data(data).enter().append("circle")
    .attr({
        r: function(d) {
            console.log(d);
            return d.radius;
        },
        fill: "black"
    });
    //.call(force.drag);

force.on("tick", function() {
   node.attr({
       cx: function(d) {
           return d.x;
       },
       cy: function(d) {
           return d.y;
       }
   });
   
   links.attr({
      x1: function(d) {
          return d.source.x;
      },
      y1: function(d) {
          return d.source.y;
      },
      x2: function(d) {
          return d.target.x;
      },
      y2: function(d) {
          return d.target.y;
      }
   }); 
});

    

/*$(document).ready(function() {
    var nodes = new vis.DataSet([
        {
            id: 1,
            label: "Node 1",
            color: "blue",
            x: 300,
            y: 150
            //level: 0
        },
        {
            id: 2,
            label: "Node 2"
        },
        {
            id: 3,
            label: "Node 3",
        },
        {
            id: 4,
            label: "Node 4"
        },
        {
            id: 5,
            label: "Node 5"
        },
        {
            id: 6,
            label: "Node 6"
        },
        {
            id: 7,
            label: "Node 7"
        },
    ]);

    var edges = new vis.DataSet([
        {
            from: 1, 
            to: 2
        },
        {
            from: 1,
            to: 3
        },
        {
            from: 1,
            to: 4
        },
        {
            from: 1,
            to: 5
        },
        {
            from: 1,
            to: 6
        },
        {
            from: 1,
            to: 7
        }
    ])

    var container = document.getElementById("graph");

    var data = {
        nodes: nodes,
        edges: edges
    };

    var options = {
        height: "1200px",
        width: "800px",
        nodes: {
            physics: true,
            fixed: true,
            color: "red",
            shape: "circle",
            //level: 2
        },
        layout: {
            randomSeed: 90760
            //improvedLayout: true
            /*hierarchical: {
                enabled: true,
                direction: "LR"
            }
        },
        interaction: {
            dragView: false,
            zoomView: false
        }
    };

    var graph = new vis.Network(container, data, options);
    graph.fit();
    console.log(graph.getSeed());
});*/
