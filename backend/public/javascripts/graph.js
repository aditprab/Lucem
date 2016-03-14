function getCitations() {
    var url = "http://52.36.127.109:9000/findCitations";
    $.post(url, "")
        .done(function(data) {
            console.log(data);
        });
}

$(document).ready(function() {
       getCitations();
});

var width = 1000;
var height = 800;

var data = [
    // main node
    {
        fixed: false,
        radius: 20,
        x: width/2,
        y: 20,
        group: 0,
        color: "#cca300"     
    },
    // cited by main node
    {
        radius: 30,
        group: 1
    },
    {
        radius: 40,
        group: 1
    },
    {
        radius: 10,
        group: 1
    },
    {
        radius: 10,
        group: 1
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
    },
    {
        radius: 10
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
    },
    {
        radius: 10
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
    },
    {
        radius: 10
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
    },
    {
        radius: 10
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
    },
    {
        source: 1,
        target: 5
    },
    {
        source: 2,
        target: 6
    },
    {
        source: 3,
        target: 7
    },
    {
        source: 4,
        target: 8
    },
    {
        source: 8,
        target: 9 
    },
    {
        source: 8,
        target: 10 
    },
    {
        source: 8,
        target: 11
    },
    {
        source: 8,
        target: 12 
    },
    {
        source: 8,
        target: 13
    },
    {
        source: 5,
        target: 14 
    },
    {
        source: 5,
        target: 15 
    },
    {
        source: 5,
        target: 16
    },
    {
        source: 5,
        target: 17 
    },
    {
        source: 5,
        target: 18
    },
    {
        source: 6,
        target: 19 
    },
    {
        source: 6,
        target: 20 
    },
    {
        source: 6,
        target: 21
    },
    {
        source: 6,
        target: 22 
    },
    {
        source: 6,
        target: 23
    },
    {
        source: 7,
        target: 24 
    },
    {
        source: 7,
        target: 25 
    },
    {
        source: 7,
        target: 26
    },
    {
        source: 7,
        target: 27 
    },
    {
        source: 7,
        target: 28
    }
]

var container = d3.select("#d3-graph").append("svg")
    .attr({
        width: width,
        height: height
    });
    
var force  = d3.layout.force()
    .size([width, height])
    .linkDistance(100)
    .nodes(data)
    .links(links)
    .charge(function(d, i) {
        if(d.radius == 5)
            return 500;
        return (i == 0) ? -1000 : d.radius * -20;
    })
    .start();

var links = container.selectAll(".link")
    .data(links).enter().append("line")
    .style("stroke-width", "1px")
    .style("stroke", "grey");

var nodeGroup = container.selectAll("g")
    .data(data).enter().append("g");

var node = nodeGroup.append("circle")
    .attr({
        r: function(d) {
            console.log(d);
            return d.radius;
        },
        fill: function(d) {
            if(d.group != null) {
                if(d.group == 0)
                    return "#cca300";
                if(d.group == 1)
                    return "#3366ff";
            }
            return "black";
        }
    });
    // .call(force.drag);

var label = nodeGroup.append("text")
    .text("Sample title")
    .attr("transform", function(d) {
        return "translate(0," + -d.radius + ")"
    });

force.on("tick", function() {
   nodeGroup.attr({
       /*cx: function(d) {
           return d.x;
       },
       cy: function(d) {
           return d.y;
       }*/
       transform: function(d) {
           return "translate(" + [d.x, d.y] + ")";
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
