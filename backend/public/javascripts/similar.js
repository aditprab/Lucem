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
var height = 1024;
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
        radius: radius
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
            respondant: nodes[i].respondant,
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
            width: width,
            height: height
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
        .data(data).enter().append("g");

    var node = nodeGroup.append("circle")
        .attr({
            class: function(d, i) {
                return "node group-" + i;
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
        
    force.on("tick", function() {
        // Code snippet from https://bl.ocks.org/mbostock/3231298
        var q = d3.geom.quadtree(data),
        i = 0,
        n = data.length;

        while (++i < n) q.visit(collide(data[i]));
        // End code snippet
        nodeGroup.attr({
            transform: function(d) {
                return "translate(" + [d.x, d.y] + ")";
            }
        });
        tickMark.attr({
            r: function(d) {
                return distanceBetween(d, data[0]);
            }
        })
    });
    
    node.on("click", function(d, i) {
        console.log(scale(d.score));
        var menu = $("#menu");
        var attrs = $("#menu").find("ul");
        var link = menu.find("a");
        link.data("content", d.html);
        link.data("citations", cleanCitations(d.opinions_cited));
        link.data("id", getId(d.resource_uri));
        menu.find("h3").html(getTitle(d.absolute_url));
        attrs.html("");
        attrs.append($("<li>").html("Date: " + d.date));
        attrs.append($("<li>").html("Issue: " + d.issue));
        attrs.append($("<li>").html("Respondent: " + d.respondent));
        attrs.append($("<li>").html("Chief Justice: " + d.chiefJustice));
        attrs.append($("<li>").html("Issue Area: " + d.issueArea));
        attrs.append($("<li>").html("Petitioner: " + d.petitioner));
        var width = menu.width();
        var height = menu.height();
        $("#menu").css({
            display: "block",
            top: d.y - (height + d.radius),
            left: d.x - width/2
        });
    });
    
    node.on("mouseover", function(d) {
        var group = ".tick-group-" + scale(d.score);
        $(group).css("stroke", "red");
    });
    
    node.on("mouseout", function(d) {
        var group = ".tick-group-" + scale(d.score);
        $(group).css("stroke", "black");
    });
}