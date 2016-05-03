var documents = [];
var states = [];
var maxResults = 10;

function loadingAnimation(insertSelector) {
    console.log(insertSelector);
    $(insertSelector).prepend(
        $('<div/>').append(
            $('<div/>').attr('id', 'loading-inner')
                       .addClass('center-vertical')
        ).attr('id', 'loading')
    );
}

function removeLoadingAnimation() {
    $('#loading').remove();
}

function cleanCitations(citations) {
    var ids = [];
    if(citations == null)
        return null;
    for(var i = 0; i < citations.length; i++) {
        var entries = citations[i].split("/");
        ids.push(entries[entries.length-2]);
    }
    return ids;
}

function cleanCSL(list) {
    if(list.charAt(0) == ',')
        return list.substr(1);
    return list;
}

function getTitle(url) {
    var buff = url.split("/");
    var title = buff[buff.length - 2];
    return title.replace(/-/g, " ");
}

function getId(uri) {
    var buff = uri.split("/");
    return buff[buff.length - 2];
}

function resultHandler() {
    var url = '/document';
    var obj = { 'docID':$(this).data("id") };

    //saveState();

    // add document to history, even if the user doesn't
    // view it, because its part of the rationale/breadcrumb
    // for falling down this rabbit-hole.
    $.ajax({
        type:'POST',
        contentType: 'application/json',
        url: url,
        data: JSON.stringify(obj)
    }).done(function(res) {
        if(res.error != null) {
            alert("hello " + res.error);
        }
    });

    // $("#citations").removeClass(".selected");
    // var title = $(this).find("h3").text();
    // if($("#case-header").css("display") == "none") {
    //     $("#case-header").css({
    //         top: $("#nav-container").css("height"),
    //         display: "block"
    //     });
    // }
    // $("#header-title").html(title);
    // //console.log($(this).data("citations"));
    // // $("#results").toggleClass("loading");
    // $("#citations").data("ids", $(this).data("citations"));
    // $("#citations").data("page", 0);
    // $("#similarity").data("id", $(this).data("id"));
    // $("#view-doc").data("id", $(this).data("id"));
    // $("#facets").data("caseCite", $(this).data("caseCite"));
    // $("#view-doc").data("content", $(this).data("content"));
    // if($("#citations").hasClass("selected"))
    //     $("#citations").removeClass("selected");
    // $("#citations").click();
}

function viewHandler() {
    var html = $(this).data("content");
    var id = $(this).data("id");
    // createModal depends on the inclusion of modal.js and modal.css
    // to function properly
    createModal('95%', '95vh');
    loadingAnimation('#modal-container');
    $.get('/assets/html/document.html', function(data) {
        $('#modal-container').append(data);
        doc_init(id, html, removeLoadingAnimation);
    });
}

function getDocuments(inputIds, documents, currentDepth, targetDepth, selectedCase) {
    var url = "http://52.36.127.109:9000/getDocuments";
    if(currentDepth == targetDepth) {
        $.ajax({
            url: url,
            type: "POST",
            dataType: "text",
            data: inputIds,
            contentType: "text/plain",
            success: function(response) {
                var obj = JSON.parse(response);
                // console.log(response);
                var initialCount = documents.length;
                updateResults(documents);
                $("#pagination").css("display", "block");
                documents = documents.concat(obj.documents);
                console.log(documents);
                // console.log(nodeMap);
                // console.log(initialCount);
                // console.log(nodeMap.length);
                $("#vis").find("svg").remove();
                var nodes = buildGraph(selectedCase, documents, initialCount);
                removeLoadingAnimation();
            },
            error: function(error) {
                updateResults(documents);
                $("#pagination").css("display", "block");
                $("#vis").find("svg").remove();
                var nodes = buildGraph(selectedCase, documents, documents.length);
                removeLoadingAnimation();
            }
        });
    }
    else {
        $.ajax({
            url: url,
            type: "POST",
            dataType: "text",
            data: inputIds,
            contentType: "text/plain",
            success: function(response) {
                var obj = JSON.parse(response);
                documents = documents.concat(obj.documents);
                var data = "";
                console.log(obj.documents);
                for(var i = 0; i < obj.documents.length; i++) {
                    if(i > 0)
                        data += ",";
                    var citations = cleanCitations(obj.documents[i].opinions_cited);
                    console.log(citations.length);
                    var maxNodes = 5;
                    var count = 0;
                    while(count < maxResults) {
                        if(count == citations.length) {
                            data = data.substr(0, data.length - 1);
                            break;
                        }
                        data += citations[count];
                        if(count < maxResults - 1)
                            data += ",";
                        count++;
                    }
                }
                data = cleanCSL(data);
                console.log(data);
                getDocuments(data, documents, currentDepth + 1, targetDepth, selectedCase);
            }
        });
    }
}

function showHeader(result) {
    console.log("HEADER:")
    console.log(result.find(".citations").data());
    if($("#case-header").css("display") == "none") {
        $("#case-header").css({
            top: $("#nav-container").css("height"),
            display: "block"
        });
    }
    $("#header-title").html(result.find(".title").find("h3").text());
    // console.log(result.find(".title").find("h3").text());
    //console.log($(this).data("citations"));
    // $("#results").toggleClass("loading");
    $("#citations").data("ids", result.find(".citations").data("ids"));
    $("#citations").data("page", 0);
    $("#similarity").data("id", result.find(".similarity").data("id"));
    $("#view-doc").data("id", result.find(".title").data("id"));
    $("#facets").data("caseCite", result.find(".facets").data("caseCite"));
    $("#view-doc").data("content", result.find(".title").data("content"));
}

function citationHandler() {
    if($(this).hasClass("selected"))
        return;
    // set up header and positions
    $(".selected").removeClass("selected");
    $("#facet-select").css("display", "none");
    placeVis();
    adjustVis();
    $(this).addClass("selected");
    $("#menu").css("display", "none");

    var data = "";
    var selectedCase = {
        absolute_url: $("#header-title").text() + "/",
        content: $("#view-doc").data("content")
    };
    //var container = event.data.citations[$(this).data("target")];
    var citations = $(this).data("ids");
    var index = $(this).data("page") * maxResults;
    var count = 0;

    // hide buttons if on first or last page
    $("#pagination").find(".prev-button").css("display", "inline");
    $("#pagination").find(".next-button").css("display", "inline");
    if(index == 0)
        $("#pagination").find(".prev-button").css("display", "none");
    if(index + maxResults >= citations.length)
        $("#pagination").find(".next-button").css("display", "none");

    while(count < maxResults && (index + count) < citations.length) {
        data += citations[index + count];
        if(count < maxResults - 1)
            data += ",";
        count++;
    }
    if(citations.length == 0) {
        updateResults("No citations for this case");
        return;
    }
    data = cleanCSL(data);
    console.log(data);
    var documents = [];
    loadingAnimation("#vis");
    getDocuments(data, documents, 1, 2, selectedCase);
}

function similarityHandler() {
    if($(this).hasClass("selected"))
        return;
    $(".selected").removeClass("selected");
    $(this).addClass("selected");
    $("#citations").data("page", 0);
    $("#pagination").css("display", "none");
    $("#menu").css("display", "none");
    $("#facet-select").css("display", "none");
    placeVis();
    adjustVis();
    var url = "http://52.36.127.109:9000/similar";
    var field = "courtId=" + $(this).data("id");
    console.log(field);
    var selectedCase = {
        absolute_url: $("#header-title").text() + "/",
        content: $("#view-doc").data("content")
    };
    loadingAnimation("#vis");
    $.ajax({
        url: url,
        type: "GET",
        dataType: "text",
        data: field,
        contentType: "text/plain",
        success: function(response) {
            var simScores = JSON.parse(response);
            var data = "";
            $("#vis").find("svg").remove();
            for(var i = 0; i < simScores.length; i++) {
                data += simScores[i].courtid[0];
                if(i < simScores.length - 1)
                    data += ",";
            }
            console.log(data);
            if(data == "") {
                updateResults("No similar cases");
                return;
            }
            $.ajax({
                url: "http://52.36.127.109:9000/getDocuments",
                type: "POST",
                dataType: "text",
                data: data,
                contentType: "text/plain",
                success: function(response) {
                    var obj = JSON.parse(response);
                    var docs = obj.documents;
                    for(var i = 0; i < docs.length; i++)
                        docs[i].score = simScores[i].score;
                    console.log(obj.documents);
                    removeLoadingAnimation();
                    buildSimVis(selectedCase, obj.documents);
                    updateResults(docs);
                }
            });
        }
    });
}

function facetHandler() {
    if($(this).hasClass("selected"))
        return;
    $(".selected").removeClass("selected");
    $(this).addClass("selected");
    $("#facet-select").css({
        display: "inherit",
        top: $("#nav-container").css("height")
    });
    $("#results").html("");
    $("#vis").find("svg").html("");
    $("#pagination").css("display", "none");
    $("#menu").css("display", "none");
    placeVis();
    adjustVis();

}

function facetSelectHandler() {
    var checked = $("#facet-select").find("input:checked");
    var url = "http://52.36.127.109:9000/facetSearch"
    var caseCite = "caseCite=" + $("#facets").data("caseCite");
    var facetRequest = "&facetRequest=";
    var data = "";
    if(checked.length == 0)
        return;
    for(var i = 0; i < checked.length; i++) {
        facetRequest += checked[i].value
        if(i < checked.length - 1)
            facetRequest += ",";
    }
    data += caseCite + facetRequest;
    loadingAnimation("#vis");
    $.ajax({
        url: url,
        type: "GET",
        dataType: "text",
        data: data,
        contentType: "text/plain",
        success: function(response) {
            var ids = JSON.parse(response).similarCases;
            var data = "";
            var count = 0;
            var index = 0;
            //console.log(ids);
            // sort ids based on page rank
            while(count < maxResults && (index + count) < ids.length) {
                data += ids[index + count].courtId;
                if(count < maxResults - 1)
                    data += ",";
                count++;
            }
            var url = "http://52.36.127.109:9000/getDocuments";
            $.ajax({
                url: url,
                type: "POST",
                dataType: "text",
                data: data,
                contentType: "text/plain",
                success: function(response) {
                    var docs = JSON.parse(response).documents;
                    //console.log(docs);
                    $("#vis").find("svg").remove();
                    removeLoadingAnimation();
                    showScatterPlot(docs);
                    updateResults(docs);
                },
                error: function(error) {
                    removeLoadingAnimation();
                    $("#vis").find("svg").remove();
                    updateResults("No cases found");
                }
            });
        },
        error: function(error) {
            removeLoadingAnimation();
            $("#vis").find("svg").remove();
            updateResults("No cases found");
        }
    });
}

function pageHandler() {
    var citations = $("#citations");
    var target;
    if($(this).hasClass("prev-button"))
        target = citations.data("page") - 1;
    else
        target = citations.data("page") + 1;
    if(target * maxResults >= citations.data("ids").length || target < 0) {
        console.log("do nothing");
        return;
    }
    citations.data("page", target);
    if(citations.hasClass("selected")) {
        citations.toggleClass("selected");
        citations.click();
        //citations.toggleClass("selected");
    }
    else
       citations.click();
}


function backHandler() {
    if(states.length == 0) {
        console.log("empty");
        return;
    }
    var state = states.pop();
    //$("body").html(state.content);
    $("body").remove();
    $("html").append(state.body);
    $(document).scrollTop(state.scrollPosition);
    console.log(state);
    // var results = $("body").find(".result");
    // for(var i = 0; i < results.length; i++) {
    //     var result = $(results[i]);
    //     result.find(".title").data("content", state.data[i].title);
    //     result.find(".title").data("citations", state.data[i].citation);
    //     result.find(".title").data("id", state.data[i].similarity);
    // }
    // $("#citations").data("ids", state.currentCase.citations);
    // $("#citations").data("page", state.currentCase.citationPage);
    // $("#similarity").data("id", state.currentCase.similarity);
    // $("#view-doc").data("content", state.currentCase.content);
    // attachHandlers();
    // $(".back").click(backHandler);
    // $("#view-doc").click(viewHandler);
    // $("#citations").click(citationHandler);
    // $("#similarity").click(similarityHandler);
    // $("#pagination").find(".glyphicon").click(pageHandler);
    // $("#search").submit(searchHandler);
}

function nodeHandler() {
    $(this).addClass("hovered");
    var caseInfo = $(this).find("circle").data("docInfo");
    var graph = $(this).data("graph");
    var menu = $("#menu");
    var attrs = menu.find("ul");
    var link = menu.find(".title");
    var svg = $("#vis").find("svg");
    var viewbox = svg[0].getAttribute("viewBox").split(" ");
    var leftOffset = parseFloat(viewbox[0]);
    var topOffset = parseFloat(viewbox[1]);
    var viewWidth = parseFloat(viewbox[2]);
    var viewHeight = parseFloat(viewbox[3]);

    console.log(svg.width()/viewWidth);
    console.log(viewHeight/svg.height())

    link.data("content", caseInfo.content);
    link.data("id", caseInfo.id);
    menu.find(".citations").data("ids", caseInfo.citations);
    menu.find(".similarity").data("id", caseInfo.id);
    menu.find(".facets").data("caseCite", caseInfo.caseCite);
    menu.find("h3").html(caseInfo.title);
    attrs.html("");
    attrs.append($("<li>").html("Date: " + (caseInfo.date == "null" ? "N/A" : caseInfo.date)));
    attrs.append($("<li>").html("Respondent: " + (caseInfo.respondent == "null" ? "N/A" : caseInfo.respondent)));
    attrs.append($("<li>").html("Issue: " + (caseInfo.issue == "null" ? "N/A" : caseInfo.issue)));
    attrs.append($("<li>").html("Chief Justice: " + (caseInfo.chiefJustice == "null" ? "N/A" : caseInfo.chiefJustice)));
    attrs.append($("<li>").html("Issue Area: " + (caseInfo.issueArea == "null" ? "N/A" : caseInfo.issueArea)));
    attrs.append($("<li>").html("Petitioner: " + (caseInfo.petitioner == "null" ? "N/A" : caseInfo.petitioner)));
    var width = menu.width();
    var height = menu.height();
    var x = (graph.x - leftOffset) * (viewWidth/svg.width());
    var y = (graph.y - topOffset) * (svg.height()/viewHeight);
    // if(x < viewWidth/2)
    //   x += width/2;
    // else
    //   x -= width/2;
    if(y < svg.height()/2)
      y += 0;
    else
      y -= height;
    $("#menu").css({
        display: "block",
        top: y, //- (height + (graph.radius/2)),
        left: x //+ width/2
    });
    console.log((graph.x) + ", " + (graph.x - leftOffset) * (svg.width()/viewWidth));
}

function clearPage() {
    $("#results").html("");
    $("#pagination").css("display", "none");
    $("#menu").css("display", "none");
    $("#vis").find("svg").remove();
    $("#facet-select").css("display", "none");
    $("#facet-select").find("input").prop("checked", false);
}

function optionHandler() {
    saveState();
    showHeader($(this).parent().parent());
    $("#results-wrapper").width("45%");
    switch($(this).attr("class")) {
        case "citations":
            if($("#citations").hasClass("selected"))
                $("#citations").toggleClass("selected");
            $("#citations").click();
            break;
        case "similarity":
            if($("#similarity").hasClass("selected"))
                $("#similarity").toggleClass("selected");
            $("#similarity").click();
            break;
        case "facets":
            if($("#facets").hasClass("selected"))
                $("#facets").toggleClass("selected");
            $("#facets").click();
            break;
    }
}

function searchHandler() {
    console.log("search called");
    $("#results-wrapper").width("55%");
    var url = "http://52.36.127.109:9000/search";
    //var url = "/search";
    //e.preventDefault();
    // serialize function uses the name attribute associated with
    // the input[type=text]
    $.post(url, $(this).serialize())
        .done(function(data) {
            var json = JSON.parse(data);
    //console.log(json.documents[0].opinions_cited);
            if(json.documents == null) {
                console.log("error");
                return;
            }
            var docs = json.documents;
            var citations = [];
            var data = [];
            $("#results").html("");
            if($("#nav-container").find($("#form-container")).length == 0) {
                $("#img-container").css("display", "none");
                $("#nav-container").prepend($("<div>").html($("#form-container")));
                $("#form-container").css({
                    display: "inline-block",
                    margin: "0",
                    float: "left"
                });
                $("#form-container").find("form").css({
                    marginBottom: "0"
                });
                $("#form-container").find("a").css({
                    lineHeight: $("#nav-container").css("height")
                });
                $("#results-wrapper").css("top", $("#nav-container").css("height"));
                $("#vis").css("top", $("#nav-container").css("height"));
                $(".back").css("display", "inline-block");
            }
            for(var i = 0; i < docs.length; i++) {
                var ids = cleanCitations(docs[i].opinions_cited);
                var content = docs[i].html;
                var caseTitle = getTitle(docs[i].absolute_url);
                var result = buildResult(docs[i], i);
                $("#results").append(result);
            }
            // add event handlers
            attachHandlers();
            $("#case-header").css("display", "none");
            $("#vis").find("svg").remove();
        });
}

function attachHandlers() {
    //$(".title").click(resultHandler);
    $("#results").find(".title").click(viewHandler);
    $("#results").find(".title").mouseover(function() {
        var target = "." + $(this).attr("class").split(" ")[1];
        //console.log($("circle" + target).attr("class"));
        $("circle" + target).attr({
            stroke: "#cca300",
            "stroke-width": "5",
            //fill: "white"
        });
    });

    $("#results").find(".title").mouseleave(function() {
        var target = "." + $(this).attr("class").split(" ")[1];
        $("circle" + target).attr({
            stroke: "black",
            "stroke-width": "1",
            fill: "black"
        });
    });

    $("#results").find(".citations").click(optionHandler);
    $("#results").find(".similarity").click(optionHandler);
    $("#results").find(".facets").click(optionHandler);
}

function saveState() {
    console.log("saving state");
    console.log($("body").find("#loading").html());
    states.push({
        body: $("body").clone(true),
        scrollPosition: $(document).scrollTop()
    });
    console.log(JSON.stringify(states));
    // var data = [];
    // var results = $("body").find(".result");
    // for(var i = 0; i < results.length; i++) {
    //     var title = $(results[i]).find(".title");
    //     data.push({
    //         title: title.data("content"),
    //         citation: title.data("citations"),
    //         similarity: title.data("id")
    //     });
    // }
    // states.push({
    //     content: $("body").clone(true),
    //     currentCase: {
    //         content: $("#view-doc").data("content"),
    //         citations: $("#citations").data("ids"),
    //         citationPage: $("#citations").data("page"),
    //         similarity: $("#similarity").data("id")
    //     },
    //     data: data
    // });
    //console.log($("#citations").data("page"));
}

function buildResult(doc, index) {
    var ids = cleanCitations(doc.opinions_cited);
    var content = doc.html;
    var caseTitle = getTitle(doc.absolute_url);
    var id = getId(doc.resource_uri);
    var caseCite = doc.caseCite;

    var result = $("<div>");
    var title = $("<h3>");
    var link = $("<a>");
    var showCitations = $("<a>");
    var similarity = $("<a>");
    var facet = $("<a>");
    var facets = $("<a>");
    var options = $("<div>");
    var snippet = $("<div>");
    var snippetBuff = $("<div>").append(content);
    var attrs = $("<ul>");

    // Set up title
    title.html(caseTitle);
    title.attr("class", "group-" + index);

    // Set up link
    link.data("content", content);
    link.data("citations", ids);
    link.data("id", id);
    link.data("caseCite", caseCite);
    link.html(title);
    link.attr("class", "title group-" + (index + 1));

    // data associated with header
    options.data("title", caseTitle);

    // Citation link
    showCitations.data("ids", ids);
    showCitations.data("page", 0);
    showCitations.attr("class", "citations");
    showCitations.html("Show Citations");

    // Similarity link
    similarity.data("id", id);
    similarity.attr("class", "similarity");
    similarity.html("Similar content");

    // Facet link
    facet.data("caseCite", caseCite);
    facet.attr("class", "facets");
    facet.html("Similar attributes");

    // Snippet
    //snippet.html("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed dignissim libero. Phasellus sed enim ac eros accumsan vestibulum eu quis lacus. Proin condimentum rutrum neque, et molestie orci aliquam.");
    var snippetHtml = snippetBuff.find("#p1").find("p").html();
    var message = "";
    var buff = [];
    if(snippetHtml != undefined)
        buff = snippetHtml.split(" ", 50);
    for(var i = 0; i < buff.length; i++) {
        message += buff[i];
        if(i < buff.length - 1)
            message += " ";
    }
    snippet.html(message);
    snippet.attr("class", "snippet");

    // attrs
    attrs.append($("<li>").html("Date: " + (doc.date == "null" ? "N/A" : doc.date)));
    attrs.append($("<li>").html("Respondent: " + (doc.respondent == "null" ? "N/A" : doc.respondent)));
    attrs.append($("<li>").html("Issue: " + (doc.issue == "null" ? "N/A" : doc.issue)));
    attrs.append($("<li>").html("Chief Justice: " + (doc.chiefJustice == "null" ? "N/A" : doc.chiefJustice)));
    attrs.append($("<li>").html("Issue Area: " + (doc.issueArea == "null" ? "N/A" : doc.issueArea)));
    attrs.append($("<li>").html("Petitioner: " + (doc.petitioner == "null" ? "N/A" : doc.petitioner)));
    attrs.attr("class", "info");

    // Append everything to result
    options.append(showCitations, similarity, facet);
    options.append(snippet, attrs);
    options.attr("class", "options");
    result.append(link);
    result.append(options);
    result.attr("class", "result");
    return result;
}

function updateResults(docs) {
    $("#results").html("");
    if(typeof docs == "string") {
        var message = $("<h2>");
        message.html(docs);
        $("#results").append(message);
        $("#vis").find("svg").remove();
        removeLoadingAnimation();
        return;
    }
    var data = [];
    var i = 1;
    console.log(docs.length);
    var citations = [];
    for(var i = 0; i < docs.length; i++)
        $("#results").append(buildResult(docs[i], i));
    // while(true) {
    //     if(docs[i].offset == docs.length - 1)
    //         break;
    //     var result = buildResult(docs[i], i);
    //     //var list = showChildren(docs[i], docs);
    //     //citations[i] = cleanCitations(docs[i].opinions_cited);
    //     //result.append(list);
    //     $("#results").append(result);
    //     i++;
    // }
    attachHandlers();
    console.log(states);
}

function showChildren(currentDoc, docs) {
    var list = $("<ul>");
    //console.log(currentDoc);
    var i = currentDoc.offset + 1;
    var count = 0;
    while(count < currentDoc.citations) {
        var li = $("<li>");
        var result = buildResult(docs[i], i);
        li.append(result);
        list.append(li);
        count++;
        i++;
    }
    return list;
}

function placeVis() {
    $("#vis").css({
        top: $("#case-header").height() + $("#nav-container").outerHeight() +
            ($("#facet-select").is(":visible") ? $("#facet-select").outerHeight() : 0),
        height: window.innerHeight - ($("#case-header").height() + ($("#facet-select").is(":visible") ? $("#facet-select").outerHeight() : 0))
    });
    $("#vis").data({
        top: parseInt($("#vis").css("top")),
        height: $("#vis").height()
    });
}

function adjustVis() {
    var top = $("#vis").data("top") - ($(document).scrollTop());
    //console.log($(document).scrollTop());
    console.log(top);
    if(top > 0) {
        $("#vis").css("top", top);
        $("#vis").css("height", $("#vis").data("height") + $(document).scrollTop());
    }
    else {
        $("#vis").css("top", 0);
        $("#vis").css("height", $("#vis").data("height") + $("#vis").data("top"));
    }
}

function nodeLeave() {
      console.log("Node leave");
      window.setTimeout(function() {
        if(!$("#menu").data("hovered"))
          $("#menu").css("display", "none");
      }, 1);
}

$(document).ready(function(){

    $(".back").click(backHandler);
    $("#citations").click(citationHandler);
    $("#similarity").click(similarityHandler);
    $("#facets").click(facetHandler);
    $("#view-doc").click(viewHandler);
    $(".prev-button").click(pageHandler);
    $(".next-button").click(pageHandler);
    $("#facet-select").find("button").click(facetSelectHandler);

    $(".citations").click(optionHandler);
    $(".similarity").click(optionHandler);
    $(".facets").click(optionHandler);

    $("#menu").find(".title").click(viewHandler);

    $("#menu").find(".glyphicon").click(function() {
        $("#menu").css("display", "none");
    });

    $("#menu").mouseenter(function() {
        $(this).data("hovered", true);
    });

    $("#menu").mouseleave(function() {
        console.log("Menu out");
        $("#menu").css("display", "none");
        $("#menu").data("hovered", false);
    });

    $("#search").submit(searchHandler);

    $(".node").click(function() {
        console.log($(this).data("graph"));
    });

    $(document).scroll(function() {
        adjustVis();
    });

    $("#vis").css({
        height: $("#case-header").height()
    });

    /* !!!!!!!!
     * still buggy
     * !!!!!!!!
     */
    // $(window).resize(function() {
    //     // $("#vis").find("svg")[0].setAttribute("viewBox", "0 0 " + ($("#vis").width()) + " " + (2* window.innerHeight));
    //     console.log(window.innerHeight);
    //     // placeVis();
    //     // adjustVis();
    //     if(parseInt($("#vis").css("top")) > 0)
    //         $("#vis").height(window.innerHeight - parseInt($("#vis").css("top")));
    //     else
    //         $("#vis").height(window.innerHeight);
    //     $("#vis").data({
    //         height: $("#vis").height(),
    //         // top: parseInt($("#vis").css("top"))
    //     });
    // });

    // $("#search").submit(function() {
    //     $("#img-container").css("display", "none");
    //     $("#nav-container").prepend($("<div>").html($("#form-container")));
    //     $("#form-container").css({
    //         display: "inline-block",
    //         margin: "0",
    //         float: "left"
    //     });
    //     $("#form-container").find("form").css({
    //         marginBottom: "0"
    //     });
    //     $("#form-container").find("a").css({
    //         lineHeight: $("#nav-container").css("height")
    //     });
    //     $("#results-wrapper").css("top", $("#nav-container").css("height"));
    //     $("#vis").css("top", $("#nav-container").css("height"));
    //     $(".back").css("display", "inline-block");
    //     resultHandler();
    // });
});
