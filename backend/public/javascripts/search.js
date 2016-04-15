var documents = []; 
var states = [];
var maxResults = 5;

function loadingAnimation(insertSelector) {
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

    saveState();

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

    $("#citations").removeClass(".selected");
    var title = $(this).find("h3").text();
    if($("#case-header").css("display") == "none") {
        $("#case-header").css({
            top: $("#nav-container").css("height"),
            display: "block"
        });
    }
    $("#header-title").html(title);
    //console.log($(this).data("citations"));
    // $("#results").toggleClass("loading");
    $("#citations").data("ids", $(this).data("citations"));
    $("#citations").data("page", 0);
    $("#similarity").data("id", $(this).data("id"));
    $("#view-doc").data("id", $(this).data("id"));
    $("#view-doc").data("content", $(this).data("content"));
    $("#pagination").css("display", "block");
    $("#citations").click();
}

function viewHandler() {
    var html = $(this).data("content");
    var id = $(this).data("id");
    // createModal depends on the inclusion of modal.js and modal.css
    // to function properly
    createModal('95%', '95vh');
    $("#modal-container").load('/assets/html/document.html', function() {
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
                documents = documents.concat(obj.documents);
                console.log(documents);
                // console.log(nodeMap);
                // console.log(initialCount);
                // console.log(nodeMap.length);
                var nodes = buildGraph(selectedCase, documents, initialCount);
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
                console.log(data);
                getDocuments(data, documents, currentDepth + 1, targetDepth, selectedCase);
            }
        });
    }
}

function citationHandler() {
    // if($(this).hasClass("selected"))
    //     return;
    if($("#similarity").hasClass("selected"))
        saveState();
    $(this).addClass("selected");
    $("#similarity").removeClass("selected");
    var data = "";
    var selectedCase = {
        absolute_url: $(this).parent().siblings(".title").find("h3").text(),
        content: $(this).parent().siblings(".content").html(),
    };
    //var container = event.data.citations[$(this).data("target")];
    var citations = $(this).data("ids");
    var index = $(this).data("page") * maxResults;
    console.log($(this).data("page"));
    var count = 0;
    while(count < maxResults && (index + count) < citations.length) {
        data += citations[index + count];
        if(count < maxResults - 1) 
            data += ",";
        count++;
    }
    if(citations.length == 0) {
        console.log("empty");
        return;
    }
    data = cleanCSL(data);
    console.log(data);
    var documents = [];
    getDocuments(data, documents, 1, 2, selectedCase);
}

function similarityHandler() {
    if($(this).hasClass("selected"))
        return;
    saveState();
    $(this).addClass("selected");
    $("#citations").removeClass("selected");
    var url = "http://52.36.127.109:9000/similar";
    var field = "courtId=" + $(this).data("id");
    $.ajax({
        url: url,
        type: "GET",
        dataType: "text",
        data: field,
        contentType: "text/plain",
        success: function(response) {
            var simScores = JSON.parse(response);
            var data = "";
            $("#vis").html("");
            for(var i = 0; i < simScores.length; i++) {
                data += simScores[i].courtid[0];
                if(i < simScores.length - 1)
                    data += ",";
            }
            console.log(data);
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
                    buildSimVis("", obj.documents);
                    updateResults(docs);
                }
            });
        }
    });
}

function pageHandler() {
    var citations = $("#citations");
    var target;
    if($(this).hasClass("prev-page"))
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
    $("body").html(state.content);
    console.log(state);
    var results = $("body").find(".result");
    for(var i = 0; i < results.length; i++) {
        var result = $(results[i]);
        result.find(".title").data("content", state.data[i].title);
        result.find(".title").data("citations", state.data[i].citation);
        result.find(".title").data("id", state.data[i].similarity);
    }
    $("#citations").data("ids", state.currentCase.citations);
    $("#similarity").data("id", state.currentCase.similarity);
    $("#view-doc").data("content", state.currentCase.content);
    attachHandlers();
    $(".back").click(backHandler);
    $("#view-doc").click(viewHandler);
    $("#citations").click(citationHandler);
    $("#similarity").click(similarityHandler);
}
    
function attachHandlers() {
    $(".title").click(resultHandler);
    $(".title").mouseover(function() {
        var target = "." + $(this).attr("class").split(" ")[1];
        //console.log($("circle" + target).attr("class"));
        $("circle" + target).attr({
            fill: "red"
        });
    });
    
    $(".title").mouseleave(function() {
        var target = "." + $(this).attr("class").split(" ")[1];
        $("circle" + target).attr({
            fill: "blue"
        });
        
    });
}

function saveState() {
    var data = [];
    var results = $("body").find(".result");
    for(var i = 0; i < results.length; i++) {
        var title = $(results[i]).find(".title");
        data.push({
            title: title.data("content"),
            citation: title.data("citations"),
            similarity: title.data("id")
        });
    }
    states.push({
        content: $("body").html(),
        currentCase: {
            content: $("#view-doc").data("content"),
            citations: $("#citations").data("ids"),
            similarity: $("#similarity").data("id")
        },
        data: data
    });
}


function buildResult(doc, index) {
    var ids = cleanCitations(doc.opinions_cited);
    var content = doc.html;
    var caseTitle = getTitle(doc.absolute_url);
    var id = getId(doc.resource_uri);
    
    var result = $("<div>");
    var title = $("<h3>");
    var link = $("<a>");
    var showCitations = $("<a>");
    var similarity = $("<a>");
    var facets = $("<a>");
    var options = $("<div>");
    var snippet = $("<div>");
    var attrs = $("<ul>");
    
    var samples = ["Judge", "Data", "Pettitioner", "Etc."]
    
    // Set up title
    title.html(caseTitle);
    title.attr("class", "group-" + index);
    
    // Set up link
    link.data("content", content);
    link.data("citations", ids);
    link.data("id", id);
    link.html(title);
    link.attr("class", "title group-" + (index + 1));

    
    // Citation link
    showCitations.data("target", index);
    //showCitations.data("ids", ids);
    showCitations.attr("class", "citations");
    showCitations.html("Show Citations");
    
    // Similarity link
    similarity.data("id", id);
    similarity.attr("class", "similarity");
    similarity.html("Show Similar");
    
    // Snippet 
    snippet.html("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed dignissim libero. Phasellus sed enim ac eros accumsan vestibulum eu quis lacus. Proin condimentum rutrum neque, et molestie orci aliquam.");
    
    // attrs
    // samples.forEach(function(e, i, a) {
    //     attrs.append($("<li>").html(e));
    // });
    // console.log(doc.caseCite);
    // var url = "http://52.36.127.109:9000/caseInfo";
    // var data = "caseCite=395 U.S. 784";
    // $.ajax({
    //     url: url,
    //     type: "GET",
    //     dataType: "text",
    //     data: data,
    //     contentType: "text/plain",
    //     success: function(response) {
    //         var obj = JSON.parse(response);
    //         for(var key in obj) {
    //             console.log(obj[key]);
    //             attrs.append($("<li>").html(obj[key]));
    //             options.append(attrs);
    //         }
    //     }
    // });
    
    // Append everything to result
    //options.append(showCitations, similarity);
    options.append(snippet);
    options.attr("class", "options");
    result.append(link);
    result.append(options);
    result.attr("class", "result");
    return result;
}

function updateResults(docs) {
    //console.log(selectedCase.title);
    $("#results").html("");
    //var header = $("<h2>");
    var data = [];
    //console.log(docs[0]);
    //header.html("Citations for: " + docs[0].title);
    //$("#results").append(header);
    var i = 1;
    console.log(docs.length);
    var citations = [];
    // docs.forEach(function(e, i, a) {
    //     $("#results").append(buildResult(e, i)); 
    // });
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
    
    
$(document).ready(function(){
    
    $(".back").click(backHandler);
    $("#citations").click(citationHandler);
    $("#similarity").click(similarityHandler);
    $("#view-doc").click(viewHandler);
    $("#pagination").find(".glyphicon").click(pageHandler);
    
    
    $("#search").submit(function(e){
        var url = "http://52.36.127.109:9000/search"
        //var url = "/search";
        e.preventDefault();
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
                $("#vis").html("");
                /* Start old results
                var modalBackground = "<div id=\"modal-background\"></div>";
                    var containerHTML = "<div id=\"modal-container\"></div>";
                    $("body").prepend(modalBackground);
                    $("#modal-background").append(containerHTML);
                    $("#modal-background").click(function() {
                        if($(event.target).is("#modal-background")) {
                                $("#modal-background").remove();
                        }
                    });
                        
                var i =0;
                var citations = [];
                while(i < json.documents.length){
                    citations[i] = cleanCitations(json.documents[i].opinions_cited);
                    //console.log(citations);
                    $("#modal-container").append("<br>");
                                        
                    $("#modal-container").append("<div id=" + divId + " class='collapse'> </div>");
                    $("#"+divId).append(json.documents[i].html);
                    
                    var caseTitle = $("#"+divId).find(".parties").text();
                    caseTitle.replace(/<(?:.|\n)*?>/gm, ' ');
                    var actualResultNumber = i + 1;
                    var divId = "result" + i;
                    var buttonHTML =  "<button type='button' class='btn btn-info' data-toggle='collapse'"+ "data-target='#"+divId+"'>"+ caseTitle + " </button>"; 	
                    var citationLink = "<a class='citations' data-target='" + i + "'>Show citations</a>"
                    $("#modal-container").append(buttonHTML);
                    $("#modal-container").append(citationLink);
                    
                    i++;
                }
                End previous results
                */
            });	
        });
    });