var HEIGHT = 1000;
var WIDTH = 1000;
var C_X = WIDTH/2;
var C_Y = HEIGHT/2;
var RADIUS = 70;
var angle = 120;

var rectHeight = 150;
var rectWidth = 150;
var diameterSums = [];
var angles = [];
var guideRadius = [];

var MAX_Y = HEIGHT/RADIUS;
var MAX_X = WIDTH/RADIUS;

var citedColor = "#b3b3b3";
var precColor = "#f2f2f2";

// rectangle function
function nodeOriginX(similarity) {
    return C_X + ((1-similarity) * 10) * rectWidth * Math.sin(0);
}

function nodeOriginY(similarity) {
    return C_Y - ((1-similarity) * 10) * rectWidth * Math.cos(0);
}

// circle function 
function circleNodeX(similarity) {
    return C_X + ((1-similarity) * 10) * 2*RADIUS * Math.sin(0);
}

function circleNodeY(similarity) {
    return C_Y - ((1-similarity) * 10) * 2*RADIUS * Math.cos(0);
}

function xCord(key) {
    return C_X + diameterSums[key].radius * Math.sin(0);
}

function yCord(key) {
    return C_Y - diameterSums[key].radius * Math.cos(0);
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
    {"title": "Anders v. California", "similarity":0.9, "importance": 4, "color": "red", "status": "cited"},
    {"title": "Anders v. California", "similarity":0.9, "importance": 10, "color": "red", "status": "cited"},
    {"title": "Anders v. California", "similarity":0.9, "importance": 8, "color": "red", "status": "precedential"},
];

var rScale = d3.scale.log()
    .domain([1,10])
    .range([0,1]); 

function encode(similarity, status) {
    return similarity.toString();
}

function findMaxRadius(key) {
    
}

function decode(key) {
    var vals = key.split(":");
    return {
        "similarity": vals[0],
        "status": vals[1]
    };
}

function calcRadius() {
    var obj;
    for(var i = 0; i < data2.length; i++) {
        var key = encode(data2[i].similarity, data2[i].status);
        if(diameterSums[key] == null) {
            obj = diameterSums[key] = {};
            obj.radius = 2*radius(data2[i].importance);
            obj.count = 1;
            obj.nodes = [];
            obj.nodes.push(data2[i]);
        }
        else {
            obj = diameterSums[key];
            obj.radius += 2*radius(data2[i].importance);
            obj.count++;
            obj.nodes.push(data2[i]);
        }
    }
    for(var key in diameterSums) {
        // var unused = diameterSums[key].radius/(diameterSums[key].count * 2);
        obj = diameterSums[key];
        var circ = obj.radius;
        var spacer = 0;
        obj.radius = (obj.radius + 2.5*RADIUS) / Math.PI;
        guideRadius.push(diameterSums[key].radius);
        var spacerRadius = (circ)/(2 * obj.nodes.length + 1);
        console.log(circ* Math.PI);
        console.log((circ * Math.PI) - circ);
        spacer = (180 * spacerRadius) / (obj.radius * Math.PI);
        for(var i = 0; i < obj.nodes.length; i++) {
            if(i == 0) {
                obj.nodes[i].offset = ((180 * RADIUS) / (obj.radius * Math.PI)) + 1;
                // obj.nodes[i].offset = spacer;
            }
            else
                obj.nodes[i].offset = ((180 * RADIUS) / (obj.radius * Math.PI)) + 1;
                //obj.nodes[i].offset = ((180 * RADIUS) / (obj.radius * Math.PI)) +  obj.nodes[i-1].offset + spacer;
                //obj.nodes[i].offset = spacer;
        }
    } 
}

function radius(importance) {
    return rScale(importance)*RADIUS;
}

/*
    {"title": "Anders v. California", "similarity":0.7, "importance": 2, "color": "red", "status": "precedential"},
    {"title": "Anders v. California", "similarity":0.7, "importance": 2, "color": "red", "status": "precedential"},
    {"title": "Anders v. California", "similarity":0.7, "importance": 2, "color": "red", "status": "cited"},
    {"title": "Anders v. California", "similarity":0.7, "importance": 2, "color": "red", "status": "precedential"},
    {"title": "Anders v. California", "similarity":0.7, "importance": 1, "color": "red", "status": "precedential"},
    {"title": "Anders v. California", "similarity":0.7, "importance": 2, "color": "red", "status": "cited"},
    {"title": "Anders v. California", "similarity":0.7, "importance": 1, "color": "red", "status": "precedential"},
    {"title": "Anders v. California", "similarity":0.7, "importance": 1, "color": "red", "status": "cited"}
*/

var circles = [1, 2, 3, 4, 5];

calcRadius();
console.log(diameterSums);

var svgContainer = d3.select(".results")
    .append("svg")
    .attr({
        height: HEIGHT,
        width: WIDTH,
    });

svgContainer.append("rect")
    .attr({
        x:0,
        y:0,
        height: HEIGHT,
        width: WIDTH/2,
        fill: precColor
    })

svgContainer.append("rect")
    .attr({
        x: WIDTH/2,
        y: 0,
        height: HEIGHT,
        width: WIDTH/2,
        fill: citedColor
    })

svgContainer.append("line")
    .attr("x1", 0)
    .attr("y1", HEIGHT/2)
    .attr("x2", WIDTH)
    .attr("y2", HEIGHT/2)
    .attr("stroke", "black")
    .attr("width", 2);
    
svgContainer.append("line")
    .attr("x1", WIDTH/2)
    .attr("y1", 0)
    .attr("x2", WIDTH/2)
    .attr("y2", HEIGHT)
    .attr("stroke", "black")
    .attr("width", 2);
    

// outside circle
svgContainer.selectAll("circle")
    .data(guideRadius).enter().append("circle").attr({
        cx: C_X,
        cy: C_Y,
        r: function(d, i) {
            if(i == 0)
                return d;
            else
                return d + guideRadius[i-1];
                //return d;
        },
        stroke: "black",
        fill: "none"
});

// center node
svgContainer.append("circle")
    .attr("cx", C_X )
    .attr("cy", C_Y)
    .attr("r", RADIUS)
    .style("fill", "black");

// rectangular nodes
/*           
var rectNode = svgContainer.selectAll("g")
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

/*
rect.on("mouseover", function() {
    return rect.attr("fill", "black");
});


var text = rectNode.append("text")
    .attr({
        x: function(d) {
            return nodeOriginX(d.similarity) - (rectWidth / 2);
        },
        y: function(d) {
            return nodeOriginY(d.similarity) - (rectHeight / 2);
        }})
    .text(function(d) {
        return d.title;
    })


text.attr({
    transform: function(d, i) {
        var x = nodeOriginX(d.similarity);
        var y = nodeOriginY(d.similarity);
        return "rotate(" +(i * -30) + "," + x + "," + y + ") translate(" + 0 + "," + rectHeight/2 + ")";
    }
});

rect.attr({
    transform: function(d, i) {
        var x = nodeOriginX(d.similarity);
        var y = nodeOriginY(d.similarity);
        return "rotate(" +(i * -30) + "," + x + "," + y + ")";
    }
});

rectNode.attr("transform", function(d, i) {
    return "rotate(" + (i * 30) + "," + C_X + "," + C_Y+ ")";
});
*/

// circular nodes

var createGroups = function(data) {
    return svgContainer.selectAll("g")
    .data(data)
    .enter().append("g");
}

var createCircles = function(group) {
    group.append("circle")
    .attr({
        cx: function(d) {
            return xCord(encode(d.similarity, d.status));
        },
        cy: function(d) {
            return yCord(encode(d.similarity, d.status));
        },
        r: function(d) {
            //console.log(rScale(d.importance) * RADIUS);
            return rScale(d.importance) * RADIUS;
            return RADIUS;
        },
        fill: function(d) {
            return d.color;
        },
        stroke: "black"
    });
}

var addText = function(group) {
    return group.append("text")
    .attr({
        x: function(d) {
            return circleNodeX(d.similarity);
        },
        y: function(d) {
            return circleNodeY(d.similarity);
        }})
    .text(function(d) {
        return d.title + " " + d.status;
    });
}
    
var adjustText = function(text) {
    text.attr({
        transform: function(d, i) {
            var x = circleNodeX(d.similarity);
            var y = circleNodeY(d.similarity);
            if(d.status == "precedential")
                return "rotate(" +(((i+1) * -angle) + 180) % 360 + "," + x + "," + y + ") translate(" + -RADIUS + "," + 0 + ")";
            else
                return "rotate(" +((i+1) * -angle) % 180 + "," + x + "," + y + ") translate(" + -RADIUS + "," + 0 + ")";
            
        }
    });
}

var adjustCircles = function(node) {
    node.attr("transform", function(d, i) {
    var key = encode(d.similarity, d.status);
    if(d.status == "precedential")
        //return "rotate(" + (((i+1) * angles[key]) + 180) % 360 + "," + C_X + "," + C_Y+ ")";
        return "rotate(" + -(i * 180/diameterSums[key].nodes.length + d.offset) + "," + C_X + "," + C_Y+ ")";
    else
        return "rotate(" + (i * 180/diameterSums[key].nodes.length + d.offset) + "," + C_X + "," + C_Y+ ")";
    });
}

var placeNodes = function() {
    for(key in diameterSums) {
        var obj = diameterSums[key];
        var nodes = createGroups(obj.nodes);
        console.log("Creating circles");
        createCircles(nodes);
        //adjustText(addText(nodes)); 
        adjustCircles(nodes);
    }
}();