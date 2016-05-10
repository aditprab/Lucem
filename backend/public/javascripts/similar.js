/*var data = "1178943,104997,104710,104491,104108,103981,103561,103301,102604,102189,105149,104010,105074";

$(document).ready(function() {
    var url = "http://52.36.127.109:9000/getDocuments";
    $.ajax({
        url: url,
        type: "POST",
        dataType: "text",
        data: data,
        contentType: "text/plain",
        success: function(response) {
            var obj = JSON.parse(response);
            console.log(obj.documents);
            buildSimVis(obj.documents);
        }
    });
});*/

var radius = 30;
var linkDistance = 100;

// Code snippet taken from https://bl.ocks.org/mbostock/3231298
function collide(node) {
  var r = node.radius,
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

function distanceBetween(n1, n2) {
    var diff1 = Math.pow(n1.x - n2.x, 2);
    var diff2 = Math.pow(n1.y - n2.y, 2);
    return Math.floor(Math.sqrt(Math.abs(diff1 + diff2)));
}

var scale = d3.scale.quantize()
    .domain([0,1])
    .range([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

/*for(var i = 0; i < 10; i++) {
    console.log(scale(parseFloat((i + 1)/10)));
}*/

function getTickRadius(nodes) {
    var circ = 0;
    for(var i = 0; i < nodes.length; i++) {
        circ += 2 * nodes[i].radius + 50;
    }
    return circ/(2 * Math.PI);
}

function buildSimVis(selectedCase, nodes) {
    var width = $("#vis").width();
    var height = $("#vis").height();
    // console.log(nodes);
    var initial = selectedCase;
    var ranks = [];
    console.log(initial.pagerank);

    $.extend(initial, {
        fixed: true,
        radius: 20,
        x: width/2,
        y: height/2,
        distance: 0,
        score: 1
    });
    var data = [initial];
    var links = [];
    var ticks = [];
    var placements = []
    for(var i = 0; i < 10; i++)
        placements.push([]);
    console.log(placements);
    for(var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        $.extend(node, {
          radius: radius,
          x: width/2,
          distance: height/2,
          // fixed: true,
          // x: 0,
          // y: 0
        });
        var link = {
            source: 0,
            target: i + 1,
            distance: linkDistance
        };
        link.distance = (scale(node.score) * radius * 3); //(scale(node.score) * ((width)/20)) + (scale(node.score) * 30);
        node.distance = link.distance;
        console.log(node.distance);
        placements[scale(node.score)].push(node);
        // if(ticks.length == 0 || !ticks.find(function(value) { return scale(value.score) == scale(node.score) } ))
        //     ticks.push(node);
        data.push(node);
        links.push(link);
    }

    console.log(placements);
    // console.log(data);
    // console.log(links);
    // console.log(ticks);

    for(var i = 0; i < data.length; i++) {
        ranks[i] = parseFloat(data[i].pagerank);
    }

    var linear = d3.scale.linear()
        .domain([d3.min(ranks), d3.max(ranks)])
        .range([15, 30]);

    for(i = 0; i < data.length; i++) {
        var r  = linear(node.pagerank);
        node.radius = isNaN(r) ? 15 : r;
    }

    for(var i = 0; i < placements.length; i++) {
        if(placements[i].length != 0)
            ticks.push(getTickRadius(placements[i]));
    }

    console.log(ticks);

    var minX, minY, maxX, maxY;
    var maxDistance = 0;
    data.forEach(function(d, i) {
      if(d.distance > maxDistance)
          maxDistance = d.distance + height/2;
      // if(i == 0) {
      //     minX = parseInt(d.x);
      //     minY = parseInt(d.y);
      //     maxX = 0;
      //     maxY = 0;
      // }
      // if(d.x < minX)
      //     minX = parseInt(d.x) - 30;
      // else if(d.x > maxX)
      //     maxX = parseInt(d.x) + 30;
      // if(d.y < minY)
      //     minY = parseInt(d.y) - 30;
      // else if(d.y > maxY)
      //     maxY = parseInt(d.y) + 30;
    });
    console.log(maxDistance);
    var container = d3.select("#vis").append("svg")
        .attr({
            width: "100%",
            height: "100%",
            viewBox: (width/2 - maxDistance) + " " + ((height/2 - maxDistance) * 0.7) + " " + (maxDistance * 2) + " " + (maxDistance * 1.8),
        });

    var n = nodes.length;
    data.forEach(function(d, i) {
        // d.x = 396;
        // d.y = 0;
        if(i % 4 == 0) {
            d.x = d.distance + width/2;
            d.y = height/2;
            d.fixed = true;
        }
        else if(i % 4 == 1) {
            d.x = width/2;
            d.y = height/2 + d.distance;
        }
        else if(i % 4 == 2) {
            d.x = width/2 - d.distance;
            d.y = height/2;
        }
        else {
            d.x = width/2;
            d.y = height/2;
        }
    });

    for(var i = 0; i < data.length; i++) {
        console.log(data[i].x + ", " + data[i].y);
    }

    var force  = d3.layout.force()
        .size([width, height])
        .linkDistance(function(d) {
            return d.distance;
        })
        .linkStrength(1)
        .charge(function(d, i) {
            if(i == 0)
                return 0;
            else
                return -30;
        })
        .nodes(data)
        .links(links)
        .friction(0.1)
        // .gravity(0);
        // .start();

    /*var links = container.selectAll(".link")
        .data(links).enter().append("line")
        .style("stroke-width", "1px")
        .style("stroke", "grey");*/

    var tickMark = container.selectAll(".tick")
        .data(placements).enter().append("circle")
            .attr({
                // class: function(d) {
                //     return "tick-group-" + scale(d.score);
                // },
                cx: width/2,
                cy: height/2,
                r: function(d) {
                    if(d.length != 0)
                      return d[0].distance;
                },
                fill: "none",
                stroke: "black"
            });

    var nodeGroup = container.selectAll("g")
        .data(data).enter().append("g")
        .attr("class", function(d) {
            $(this).mouseenter(nodeHandler);
            $(this).mouseleave(nodeLeave);
            return "node";
        });

    var node = nodeGroup.append("circle")
        .attr({
            cx: width/2,
            cy: function(d) {
                return height/2 - d.distance;
            },
            transform: function(d, i) {
                var numNodes = i != 0 ? placements[scale(d.score)].length : 1;
                return "rotate(" + ((360/numNodes * i) + (45 * scale(d.score))) + "," + width/2 + "," + height/2 + ")"
            },
            class: function(d, i) {
                $(this).data("docInfo", {
                    title: getTitle(d.absolute_url),
                    content: d.html,
                    currentDoc: d,
                    citations: cleanCitations(d.opinions_cited),
                    id: getId(d.resource_uri),
                    caseCite: d.caseCite,
                    date: d.date,
                    issue: d.issue,
                    respondent: d.respondent,
                    chiefJustice: d.chiefJustice,
                    issueArea: d.issueArea,
                    petitioner: d.petitioner,
                    landmark: d.landmark
                });
                return "group-" + i;
            },
            r: function(d) {
                return d.radius;
            },
            fill: function(d) {
                if(d.landmark != "null")
                  return "rgb(215,0,0)";
                return "black";
            }
        });
        // .call(force.drag);

    /*var label = nodeGroup.append("text")
        .text(function(d, i) {
            return d.title + " " + i;
        })
        .attr("transform", function(d) {
            return "translate(0," + -d.radius + ")"
        })
        .attr("visibility", "hidden");*/

    var minX;
    var minY;
    var maxX;
    var maxY;


    force.on("tick", function(d, i) {
        // Code snippet from https://bl.ocks.org/mbostock/3231298
        var q = d3.geom.quadtree(data),
        i = 0,
        n = data.length;

        while (++i < n) q.visit(collide(data[i]));
        // End code snippet
        var top = 0;
        var bottom = 0;
        nodeGroup.attr({
            transform: function(d, i) {
                // if(d.y > height/2 && top < 5)
                //     top++;
                // else if(d.y > height/2) {
                //     d.y *= 2;
                //     bottom++;
                // }
                // else
                //     bottom++;
                // console.log(top + ", " + bottom);
                $(this).data("graph", {
                    x: d.x,
                    y: d.y,
                    radius: d.radius
                });
                if(i == 0) {
                    minX = parseInt(d.x);
                    minY = parseInt(d.y);
                    maxX = 0;
                    maxY = 0;
                }
                if(d.x < minX)
                    minX = parseInt(d.x) - 30;
                else if(d.x > maxX)
                    maxX = parseInt(d.x) + 30;
                if(d.y < minY)
                    minY = parseInt(d.y) - 30;
                else if(d.y > maxY)
                    maxY = parseInt(d.y) + 30;
                container.attr("viewBox", (minX * 1) + " " + (minY * 1.1) + " " + ((maxX * 1.1) - (minX)) + " " + ((maxY * 1.6) - (minY)));
                if(i == 0)
                    return "translate(" + [width/2, height/2] + ")";
                return "translate(" + [d.x, d.y] + ")";
            }
        });
        var maxR = 0;
        tickMark.attr({
            r: function(d) {
                return distanceBetween(d, data[0]);
            }
        })
    });

    node.on("click", function(d) {
        console.log(scale(d.score));
    });

    // node.on("mouseover", function(d) {
    //     var group = ".tick-group-" + scale(d.score);
    //     $(group).css("stroke", "red");
    // });
    //
    // node.on("mouseout", function(d) {
    //     var group = ".tick-group-" + scale(d.score);
    //     $(group).css("stroke", "black");
    // });
}
