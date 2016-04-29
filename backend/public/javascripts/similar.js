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

var width = $("#vis").width();
var height = $("#vis").height();
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

var ticks = [];

function buildSimVis(selectedCase, nodes) {
    console.log(nodes);
    var data = [{
        fixed: true,
        x: width/2,
        y: height/2,
        radius: radius,
        absolute_url: selectedCase.absolute_url,
        content: selectedCase.content,
        resource_uri: ""
    }];
    var links = [];
    for(var i = 0; i < nodes.length; i++) {
        var node = {
            radius: radius,
            html: nodes[i].html,
            absolute_url: nodes[i].absolute_url,
            resource_uri: nodes[i].resource_uri,
            opinions_cited: nodes[i].opinions_cited,
            score: nodes[i].score,
            date: nodes[i].date,
            issue: nodes[i].issue,
            respondent: nodes[i].respondent,
            chiefJustice: nodes[i].chiefJustice,
            issueArea: nodes[i].issueArea,
            petitioner: nodes[i].petitioner
        };
        var link = {
            source: 0,
            target: i + 1,
            distance: linkDistance
        };
        link.distance += (scale(node.score) * (radius + 10));
        if(ticks.length == 0 || !ticks.find(function(value) { return scale(value.score) == scale(node.score) } ))
            ticks.push(node);
        data.push(node);
        links.push(link);
    }

    console.log(data);
    console.log(links);
    console.log(ticks);

     var container = d3.select("#vis").append("svg")
        .attr({
            width: "100%",
            height: "100%"
        });

    var force  = d3.layout.force()
        .size([width, height])
        .linkDistance(function(d) {
            return d.distance;
        })
        .nodes(data)
        .links(links)
        .start();

    /*var links = container.selectAll(".link")
        .data(links).enter().append("line")
        .style("stroke-width", "1px")
        .style("stroke", "grey");*/

    var tickMark = container.selectAll(".tick")
        .data(ticks).enter().append("circle")
            .attr({
                class: function(d) {
                    return "tick-group-" + scale(d.score);
                },
                cx: width/2,
                cy: height/2,
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
            class: function(d, i) {
                $(this).data("docInfo", {
                    title: getTitle(d.absolute_url),
                    content: d.html,
                    citations: cleanCitations(d.opinions_cited),
                    id: getId(d.resource_uri),
                    caseCite: d.caseCite,
                    date: d.data,
                    issue: d.issue,
                    respondent: d.respondent,
                    chiefJustice: d.chiefJustice,
                    issueArea: d.issueArea,
                    petitioner: d.petitioner
                });
                return "group-" + i;
            },
            r: function(d) {
                return d.radius;
            },
            fill: "black"
        });
        //.call(force.drag);

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

    force.on("tick", function() {
        // Code snippet from https://bl.ocks.org/mbostock/3231298
        var q = d3.geom.quadtree(data),
        i = 0,
        n = data.length;

        while (++i < n) q.visit(collide(data[i]));
        // End code snippet
        nodeGroup.attr({
            transform: function(d, i) {
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
                return "translate(" + [d.x, d.y] + ")";
            }
        });
        tickMark.attr({
            r: function(d) {
                return distanceBetween(d, data[0]);
            }
        })
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
