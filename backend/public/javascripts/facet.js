//showScatterPlot(topCases);

function getYear(date) {
    return parseInt(date.split("/")[2]);
}

function showScatterPlot(data) {
    console.log(data);
	var margins = {
        	"left": 40,
            	"right": 30,
            	"top": 30,
            	"bottom": 30
    	};

    var width = $("#vis").width();
    var height = 350;
    var radius = 15;

	var conservative = "#d62728";
	var liberal = "#1f77b4";
	var unspecified = "#ff7f0e";

	var svg = d3.select("#vis").append("svg").attr("width", width).attr("height", height).append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");


	var x = d3.scale.linear()
        .domain(d3.extent(data, function (d) {
            return getYear(d.date);
    }))

	.range([0, width - margins.left - margins.right]);

	//var y = d3.scale.linear()
        //.domain(d3.extent(data, function (d) {
        //return d.rating;
    //}))

	var y = d3.scale.linear().domain([0, 10])

	.range([height - margins.top - margins.bottom, 0]);

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + y.range()[0] + ")");
    svg.append("g").attr("class", "y axis");

	 svg.append("text")
        .attr("fill", "#414241")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height - 35)
        .text("Year Case was decided");

	var xAxis = d3.svg.axis().scale(x).orient("bottom").tickPadding(2);
    	//var yAxis = d3.svg.axis().scale(y).orient("left").tickPadding(2);

	//svg.selectAll("g.y.axis").call(yAxis);
    	svg.selectAll("g.x.axis").call(xAxis);

	// var node = svg.selectAll("g.node").data(data, function (d) {
    //     return d.caseID;
    // });

     var node = svg.selectAll("g.node").data(data);

	 var nodeGroup = node.enter().append("g")
        .attr("class", "node")
        .attr('transform', function (d, i) {
            var random = Math.floor((Math.random() * 10) + 1);
            var year = getYear(d.date);
            $(this).data("graph", {
                    x: x(year),
                    y: y(random),
                    radius: radius
            });
            $(this).mouseenter(nodeHandler);
            $(this).mouseleave(nodeLeave);
            return "translate(" + x(year) + "," + y(random) + ")";
        })

	nodeGroup.append("circle")
       .attr({
           r: function (d) {
	            return radius;
            },
            class: function(d, i) {
                $(this).data("docInfo", {
                    title: getTitle(d.absolute_url),
                    content: d.html,
                    citations: cleanCitations(d.opinions_cited),
                    id: getId(d.resource_uri),
                    caseCite: d.caseCite,
                    date: d.date,
                    issue: d.issue,
                    respondent: d.respondent,
                    chiefJustice: d.chiefJustice,
                    issueArea: d.issueArea,
                    petitioner: d.petitioner
                });
                return "group-" + i;
            }
       })
        .attr("class", "dot")
            .style("fill", function (d) {
                if(d.decisionType == 1)
                {
                    return conservative;
                }

                if(d.decisionType == 2)
                {
                    return liberal;
                }

                if(d.decisionType == 3)
                {
                    return unspecified;
                }
        });

	nodeGroup.append("text")
        .style("text-anchor", "middle")
        .attr("dy", -10)
        .text(function (d) {

	return d.caseID;
    });


	return data;

}
