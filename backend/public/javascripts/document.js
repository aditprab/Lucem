var highlightModeOn = false;
    var dragged = false;
    var clickedHighlight = false;
    var highlightOffset = $(window).height();
    var documentID;
    var documentHTML;

    var hideNotes = function() {
      $(".sidebar").empty(); 
    };
    var showNotes = function() {
      // get notes for the highlight
    };

    var highlight = function(startIndex, stopIndex) {
      var html = $('#document').html();
      var spanHTML = '<span class="highlighted">'

      html_new = html.substring(0, startIndex) + spanHTML +
                 html.substring(startIndex, stopIndex) +
                 '</span>' + 
                 html.substring(stopIndex, html.length);

      $('#document').html(html_new);
    };

    var highlight_clicked = function() {
      console.log("highlight was clicked");
      hideNotes();
      clickedHighlight = false;
      
      if($(this).hasClass('clicked')) {
        console.log("clicked was clicked again");
        $('.clicked').toggleClass("clicked", false);
        return;
      }

      $('.clicked').toggleClass("clicked", false);

      hideNotes();
      showNotes();

      $("#right-sb").append("<button id=\"add-btn\">+</button>");
      $("#add-btn").click(function() {
        $(this).before("<textarea class=\"note\"></textarea>");
        // get id of current highlight
        $('.clicked').attr('id');
        $(".note").keyup(function() {
          if($("#hiddenDiv").length == 0) {
            $("#right-sb").prepend("<div id=\"hiddenDiv\"></div>");
          }
          $("#hiddenDiv").html($(this).val());
          $(this).height($("#hiddenDiv").height());
        });
      });
      console.log("offset");
      console.log($(this).offset());
      console.log("scrollOffset");
      console.log($(window).scrollTop());
      console.log("window height");
      console.log(screen.height);
      if($(window).scrollTop() > $(this).offset()) {
        alert("scrolled enough");
      }
      clickedHighlight = true;
      $(this).addClass("clicked");

      $(document).click(function(event) {
        if(clickedHighlight && !$(event.target).is(".clicked") &&
           !$(event.target).is(".sidebar") && !$(event.target).is($(".sidebar").children())) {
          console.log("clicked outside");
          hideNotes();
          $(".clicked").toggleClass("clicked", false);
          clickedHighlight = false;
        }
      });
    };

    var highlight_handler = function() {
      var selection = window.getSelection();
      var highlighted = selection.toString();
      var emptyRegex = /^[\s]+$/g;

      // don't highlight if selection is white space
      if(selection == null || selection.isCollapsed) {
        // highlight even if the selection is exclusively white space.
        // highlighted.match(emptyRegex)) {
        return;
      }

 console.log(selection);
      var anchorNode = selection.anchorNode;
      var anchorClone = anchorNode.parentNode.cloneNode(true);
      var focusNode = selection.focusNode;
      var range  = selection.getRangeAt(0);
      var spanClass = "highlighted";
      var spanNode = document.createElement('span');
      spanNode.className = spanClass;
console.log(spanNode);
      var spanHTML = "<span class=\"" + spanClass + "\">";

      if(anchorNode == focusNode) {
        // <span class="highlighted">
        //   <text here>
        // </span>
        // anchorNode = <text here>
        // anchorNode.parentNode = <span class="highlighted">
        var span = anchorNode.parentNode;

        // selection is limited to one dom node, which includes
        // selections in text that has already been highlighted.
        // to match the functionality of text editors, if the
        // selected text is already highlighted, it will be 
        // unhighlighted
        if(anchorNode.parentNode.className == spanClass) {
          var anchorOffset = selection.anchorOffset,
              focusOffset = selection.focusOffset;

          console.log("already highlighted, unhighlight");
          if((anchorOffset == 0 && focusOffset ==
              focusNode.textContent.length) ||
              (focusOffset == 0 && anchorOffset ==
              focusNode.textContent.length)) {
            // user reselected the entirety of the highlighted text. 
            // probably means to unhighlight the text
            var textNode = document.createTextNode(anchorNode.textContent);
            span.parentNode.replaceChild(textNode, span);
          }
        } else {
           range.surroundContents(spanNode);
        }
        
        $(".highlighted").click(highlight_clicked);
      } else {
        var span, offset;

        if(anchorNode.parentNode.className == spanClass) {
          span = anchorNode.parentNode;
        offset = selection.anchorOffset;
        } else if(focusNode.parentNode.className == spanClass) {
          span = focusNode.parentNode;
          offset = selection.focusOffset;
        } else {
          console.log('anchor node and focus node are different and do not begin in highlighted nodes');
          var i = 0, 
              topLevel = document.getElementById('document').childNodes;
          
          while(i < topLevel.length) {
console.log(topLevel[i].nodeName);
            if(topLevel[i].contains(anchorNode)) {
              while(!topLevel[i].contains(focusNode)) {
                spanNode = document.createElement('span');
                spanNode.className = 'highlighted';
                topLevel[i].parentNode.insertBefore(spanNode, topLevel[i]);
                spanNode.appendChild(topLevel[i]);
                console.log(topLevel[i]);
                ++i;
              }
              console.log(topLevel);
              console.log(topLevel[i]);
              break;
            }
            ++i;
          }


          
          console.log(focusNode.previousSibling);
          //spanNode.appendChild(range.extractContents());
          // range.insertNode(spanNode);
          return;
        }

        var parentText = span.parentNode.textContent;

        // before is a boolean variable used to determine whether the
        // user highlighted selection forward or backward, which
        // may indicate that anchorNode and focusNode are reversed.
        // 
        var before = parentText.indexOf(highlighted) <
                   parentText.indexOf(span.textContent);

        if(!before) {
          console.log("extending highlight to the right");
          var highlightedText = span.textContent.substring(0,
                                                     offset);
          highlighted = highlightedText + highlighted;
          spanNode.textContent = highlighted;
        } else {
          console.log("extending highlight to the left");
          var highlightedText = span.textContent.substring(offset,
                                         span.textContent.length);
          highlighted = highlighted + highlightedText;
          spanNode.textContent = highlighted;
        }
        range.deleteContents();
        span.parentNode.replaceChild(spanNode, span);
      }

      //
      // the following code finds the start and end indices of the newly
      // highlighted text relative to the unmodified html. 
      //
      var html = $('.hidden').html();
      var highlightedElements = anchorClone.getElementsByClassName('highlighted');

      // removing span.highlighted(s) to get anchor's vanilla html, which we can
      // use to search for to find its index in the overall html.
      while(highlightedElements.length > 0) {
        var textNode = document.createTextNode(highlightedElements[0].textContent);
        anchorClone.replaceChild(textNode, highlightedElements[0]);
      }

      // wrapping anchorNode in a div to access the element's html, which could
      // not be done with the innerHTML property.
      var anchorWrapper =
          $('<div></div>').append($(anchorClone).clone());
      var anchorHTML = anchorWrapper.html();
      var anchorStart = html.indexOf(anchorHTML);
      var anchorEnd = anchorStart + anchorHTML.length;
      // sometimes, the literal html has multiple spaces, but these
      // spaces are ignored when rendered and fetched by javascript
      anchorHTML = anchorHTML.replace(/ +(?=)/g, ' ');
      var highlightStart = anchorStart + anchorHTML.indexOf(highlighted);
      var highlightEnd = highlightStart + highlighted.length;
      // make sure these two are the same or else there is an error
      console.log(highlighted);
      console.log(html.substring(highlightStart, highlightEnd));
      //highlight(highlightStart, highlightEnd);
      console.log(documentID);

      var url = "/highlight";
      var obj = {"docID":documentID, "startIndex":highlightStart, "stopIndex":highlightEnd};

console.log(obj);
      $.ajax({
            type:'POST',
            contentType: 'application/json',
            url: url,
            data: JSON.stringify(obj)
        }).done(function(res) {
            if(res.error != null) {
                alert(res.error);
            }
        });
    };

var doc_init = function(id, html, callback) {
  var url = "/highlight";
  documentID = id;
  $("#document").html(html.replace(/ +(?=)/g, ' '));
  $(".hidden").html($("#document").html());

  $.ajax({
    type:'GET',
    url:url,
    data:{"docID":id}
  }).done(function(data){
    if(data == null) {
      return;
    }
    console.log(data);
    var keys = Object.keys(data);
    console.log(keys);
    // must go backwards to keep from changing the indices
    // of later highlights
    for(var i = keys.length - 1; i >= 0; --i) {
      console.log("one iteration");
      highlight(keys[i], data[keys[i]]);
    }
    $('.highlighted').click(highlight_clicked);

    callback();
  });
};

$(document).ready(function() {

  $("#document").mousedown(function() {
        dragged = false;
      }).mousemove(function(){
        dragged = true;
      }).mouseup(function(){
        if(dragged && highlightModeOn) {
          highlight_handler();
        }
        dragged = false;
      }).dblclick(function() {
        if(highlightModeOn) {
          highlight_handler();
        }
      });

  $('#highlight-btn').click(function(){
            // highlight the text already selected when the user engages
            // highlight mode
            if(!highlightModeOn) {
              highlight_handler();
              $(this).css("background-color", "rgb(255,255,88)");
              $(this).attr("title", "highlight on");
            } else {
              $(this).css("background-color", "transparent");
              $(this).attr("title", "highlight off");
            }
            highlightModeOn = !highlightModeOn;
          });

});
