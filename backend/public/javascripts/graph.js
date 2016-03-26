function getCitations() {
    var url = "http://52.36.127.109:9000/findCitations";
    $.post(url, "")
        .done(function(data) {
            console.log(data);
        });
}

function testGraph() {
    var url = "/testGraph";
    $.post(url, "")
        .done(function(data) {
            var obj = JSON.parse(data);
            console.log(obj);
            buildGraph(obj.documents, obj.initial_count);
        });
}

function getTitle(url) {
    var buff = url.split("/");
    var title = buff[buff.length -2];
    return title.replace(/-/g, " ");
    /*buff = title.split("-");
    title = "";
    for(var i = 0; i < buff.length; i++) 
        title += buff[i][0];
    return title;*/
}

function getId(uri) {
    var buff = uri.split("/");
    return buff[buff.length - 2];
}

function getContent(node) {
    /*if(node.html_with_citations != "")
        return node.html_with_citations;
    else if(node.html_lawbox != "")
        return node.html_lawbox;
    else if(node.html_columbia != "")
        return node.html_columbia;
    else if(node.html != "")
        return node.html;
    else
        return node.plain_text;*/
    return node.html;
}

// Code snippet taken from https://bl.ocks.org/mbostock/3231298
function collide(node, label) {
  var r = node.radius + label[0][0].getBBox().width,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - r,
      ny2 = node.y + r;
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x,
          y = node.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r = node.radius + quad.point.radius;
      if (l < r) {
        l = (l - r) / l * .5;
        node.x -= x *= l;
        node.y -= y *= l;
        quad.point.x += x;
        quad.point.y += y;
      }
    }
    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
  };
}
// End code snippet

$(document).ready(function() {
    //testGraph();
    //buildGraph();
});

var width = $("#d3-graph").width();
var height = 800;
var radius = 15;
var linkDistance = 50;

function buildGraph(selectedCase, nodes, count) {
    // selected case
    width = $("#d3-graph").width();
    console.log(nodes.length);
    var data = [
        {
            fixed: false,
            radius: 20,
            x: 20,
            y: height/2,
            group: 0,
            color: "#cca300",
            title: selectedCase.title,
            html: selectedCase.content,
            citations: count
        }
    ];
    var links = [];
    // add inital links to selected case
    for(var i = 0; i < count; i++) {
        var link = {
            source: 0,
            target: i + 1
        };
        console.log(link);
        links.push(link);
    }
    // add nodes to data, add remaining links
    var pad = count;
    for(var i = 0; i < nodes.length; i++) {
        var node = {
            fixed: false,
            x: 2 * 40 * ((i / count) + 1),
            y: i,
            radius: radius,
            title: getTitle(nodes[i].absolute_url),
            html: getContent(nodes[i]),
            opinions_cited: nodes[i].opinions_cited,
            doc_id: getId(nodes[i].resource_uri),
            citations: 0,
            offset: 0,
        };
        /*if(nodes[i].opinions_cited.length == 0) {
            console.log("no citations");
            continue;
        }*/
        var casesSeen = 0;
        var maxNodes = 5;
        var loopCondition;
        if(maxNodes < nodes[i].opinions_cited.length)
            loopCondition = maxNodes;
        else
            loopCondition = nodes[i].opinions_cited.length;
        for(var j = 0, k = 0; j < loopCondition; j++) {
            if(pad + k < nodes.length) {
                //console.log(nodes[i].opinions_cited[j]);
                if(nodes[i].opinions_cited[j] == nodes[pad + k].resource_uri) {
                    var link = {
                        source: i+1,
                        target: pad + k + 1
                    };
                    console.log(link);
                    links.push(link);
                    casesSeen++;
                    k++;
                }
                else {
                    console.log("not found");
                }
            }
        }
        node.citations = casesSeen;
        node.offset = pad;
        data.push(node);
        pad += casesSeen;
        //console.log(pad + count);
        //console.log(node);
    }
    console.log(data);
    console.log(links);
    $("#d3-graph").html("");
    var container = d3.select("#d3-graph").append("svg")
        .attr({
            width: width,
            height: height
        });
        
    var force  = d3.layout.force()
        .size([width, height])
        .linkDistance(linkDistance)
        .nodes(data)
        .links(links)
        .charge(function(d, i) {
            return -1000;
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
                /*$.ajax({
                    url: "http://52.36.127.109:9000/pagerank",
                    type: "GET",
                    dataType: "text",
                    data: d.doc_id,
                    contentType: "text/plain",
                    success: function(response) {
                        console.log(response);
                        return d.radius;
                    }
                });*/         
                //console.log(d);
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
        //.call(force.drag);

    var label = nodeGroup.append("text")
        .text(function(d, i) {
            return d.title + " " + i;
        })
        .attr("transform", function(d) {
            return "translate(0," + -d.radius + ")"
        })
        .attr("visibility", "hidden");
    
    nodeGroup
        .on("click", function(d, i) {
            $("#document").html(d.content);
            console.log(d.content);
        })
        .on("mouseover", function(d, i) {
            d3.select(this).select("text").attr("visibility", "");
        })
        .on("mouseout", function(d, i) {
            d3.select(this).select("text").attr("visibility", "hidden");
        });
    
    force.on("tick", function() {
        // Code snippet from https://bl.ocks.org/mbostock/3231298
        var q = d3.geom.quadtree(data),
        i = 0,
        n = data.length;

        while (++i < n) q.visit(collide(data[i], d3.select(label[0][i])));
        // End code snippet
        
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
    return data;
}

    

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
