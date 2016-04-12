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

/*function getTitle(url) {
    var buff = url.split("/");
    var title = buff[buff.length -2];
    return title.replace(/-/g, " ");
    /*buff = title.split("-");
    title = "";
    for(var i = 0; i < buff.length; i++) 
        title += buff[i][0];
    return title;
}*/

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

var width = $("#vis").width();
var height = 800;
var radius = 15;
var linkDistance = 50;

function buildGraph(selectedCase, nodes, count) {
    // selected case
    // width = $("#vis").width();
    console.log(nodes.length);
    var data = [
        {
            fixed: false,
            radius: 20,
            x: 20,
            y: height/2,
            group: 0,
            color: "#cca300",
            absolute_url: selectedCase.absolute_url,
            html: selectedCase.content,
            citations: count,
            resource_uri: ""
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
            absolute_url: nodes[i].absolute_url,
            html: getContent(nodes[i]),
            opinions_cited: nodes[i].opinions_cited,
            resource_uri: nodes[i].resource_uri,
            pagerank: nodes[i].pagerank,
            citations: 0,
            offset: 0,
        };
        /*if(nodes[i].opinions_cited.length == 0) {
            console.log("no citations");
            continue;
        }*/
        var casesSeen = 0;
        // var maxNodes = 5;
        // var loopCondition;
        // if(maxNodes < nodes[i].opinions_cited.length)
        //     loopCondition = maxNodes;
        // else
        //     loopCondition = nodes[i].opinions_cited.length;
        for(var j = 0, k = 0; j < nodes[i].opinions_cited.length; j++) {
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
    $("#vis").html("");
    
    var ranks = [];
       
    for(var i = 0; i < data.length; i++) {
        // var field = "docId=";
        // $.ajax({
        //     url: "http://52.36.127.109:9000/pagerank",
        //     async: false,
        //     type: "GET",
        //     dataType: "text",
        //     data: field + getId(data[i].resource_uri),
        //     contentType: "text/plain",
        //     success: function(response) {
        //         ranks.push(parseFloat(response));
        //     }
        // });
        ranks[i] = parseFloat(data[i].pagerank);
        console.log(ranks[i]);
    }
    
    var log = d3.scale.log();
    var sqrt = d3.scale.sqrt();
    var linear = d3.scale.linear()
        .domain([d3.min(ranks), d3.max(ranks)])
        .range([15, 30]);
    
    var container = d3.select("#vis").append("svg")
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
            r: function(d, i) {
                var r  = linear(d.pagerank);
                return isNaN(r) ? radius : r;
            },
            fill: function(d) {
                if(d.group != null) {
                    if(d.group == 0)
                        return "#cca300";
                    if(d.group == 1)
                        return "#3366ff";
                }
                return "black";
            },
            class: function(d, i) {
                return "group-" + i;
            }
        });
        //.call(force.drag);

    var label = nodeGroup.append("text")
        .text(function(d, i) {
            return i;
        })
        // .attr("transform", function(d) {
        //     return "translate(0," + -d.radius + ")"
        // })
        .attr({
            visibility: "",
            fill: "white",
            "text-anchor": "middle"
        });
    
    nodeGroup
        .on("click", function(d, i) {
            $("#document").html(d.content);
            console.log(d.content);
        })
        .on("mouseover", function(d, i) {
            //d3.select(this).select("text").attr("visibility", "");
            d3.select(this).select("circle").attr("fill", "red");
        })
        .on("mouseout", function(d, i) {
            //d3.select(this).select("text").attr("visibility", "hidden");
            d3.select(this).select("circle").attr("fill", "black");
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