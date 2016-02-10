var HEIGHT = 1000;
var WIDTH = 1000;
var C_X = WIDTH/2;
var C_Y = HEIGHT/2;
var RADIUS = 30;

var rectHeight = 70;
var rectWidth = 100;
var simRadius = rectWidth * 3;
// var nodeOriginX = C_X + (simRadius * Math.sin(0));
// var nodeOriginY = C_Y - (simRadius * Math.cos(0));

var MAX_Y = HEIGHT/RADIUS;
var MAX_X = WIDTH/RADIUS;

function nodeOriginX(similarity) {
    return C_X + (1 * simRadius) * Math.sin(0);
}

function nodeOriginY(similarity) {
    return C_Y - (1 * simRadius) * Math.cos(0);
}



/*
function xVal(value) {
    return C_X + (value*2*RADIUS);
}

function yVal(value) {
    return C_Y - (value*2*RADIUS);
}

function findRadialX(value) {
    return simRadius * Math.cos(value);
}

function findRadialY(value) {
    return simRadius * Math.sin(value);
}

function findAngleX(x) {
    var angle = Math.acos(x/simRadius);
    console.log(x/simRadius);
    console.log(angle);
    return angle;
}

function findAngleY(y) {
    var angle = Math.asin(y/simRadius);
    return angle;
}
*/

var data2 = [
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.9, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
    {"similarity":0.8, "position":0, "x_side":1, "y_side":1, "radius": RADIUS, "color": "red"},
]

var svgContainer = d3.select(".results")
    .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH);

var svg2 = d3.select(".results_2")
    .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH)

svg2.append("line")
    .attr("x1", 0)
    .attr("y1", HEIGHT/2)
    .attr("x2", WIDTH)
    .attr("y2", HEIGHT/2)
    .attr("stroke", "black")
    .attr("width", 2);
    
svg2.append("line")
    .attr("x1", WIDTH/2)
    .attr("y1", 0)
    .attr("x2", WIDTH/2)
    .attr("y2", HEIGHT)
    .attr("stroke", "black")
    .attr("width", 2);

var rectNode = svg2.selectAll("g")
    .data(data2)
    .enter().append("g");

var rect = rectNode.append("rect").attr({
    x: function(d) {
        return nodeOriginX(d.similarity) - (rectWidth / 2);
    },
    y: function(d) {
        return nodeOriginY(d.similarity) - (rectHeight / 2);
    },
    width: rectWidth,
    height: rectHeight,
    fill: function(d) {
        return d.color;
    },
    stroke: "black",
});

var text = rectNode.append("text").attr({
    x: function(d) {
        return nodeOriginX(d.similarity) - (rectWidth / 2);
    },
    y: function(d) {
        return nodeOriginY(d.similarity) - (rectHeight / 2);
    }})
    .text(function(d) {
        return d.similarity;
    })


text.attr({
    transform: function(d, i) {
        var x = text.node().getBBox().x + (rectWidth/2);
        var y = text.node().getBBox().y + (rectHeight/2);
        return "rotate(" +(i * -30) + "," + x + "," + y + ") translate(" + rectWidth/2 + ")";
    }
});

rect.attr({
    transform: function(d, i) {
        var x = rect.node().getBBox().x + (rectWidth/2);
        var y = rect.node().getBBox().y + (rectHeight/2);
        return "rotate(" +(i * -30) + "," + x + "," + y + ")";
    }
});

rectNode.attr("transform", function(d, i) {
    return "rotate(" + (i * 30) + "," + C_X + "," + C_Y+ ")";
});

// outside circle
svg2.append("circle")
    .attr("cx", C_X)
    .attr("cy", C_Y)
    .attr("r", simRadius)
    .attr("fill", "none")
    .attr("stroke", "black");

// center node
svg2.append("rect")
    .attr("x", C_X - rectWidth/2)
    .attr("y", C_Y - rectHeight/2)
    .attr("height", rectHeight)
    .attr("width", rectWidth)
    .style("fill", "black");






    
    