var createModal = function(width, height, file) {
  var modalBackground = "<div id=\"modal-background\"></div>";
  var modalHTML = "<div id=\"modal\"></div>";
  var containerHTML = "<div id=\"modal-container\"></div>";
  var closeButtonHTML = "<div id=\"close\"></div>";
  $("body").prepend(modalBackground);
  $("#modal-background").append(modalHTML);
  $("#modal").append(containerHTML);
  $("#modal").width(width);
  $("#modal").height(height);
  $("#modal-background").click(function(event) {
    if($(event.target).is("#modal-background")) {
      removeModal();
    }
  });
  $("#modal-container").load(file);
  $("#modal").prepend(closeButtonHTML);
  $("#close").click(function() {
    removeModal();
  });
  $(document).keyup(function(e) {
    if(e.keyCode == 27) {
      // handling escape keypresses
      removeModal();
    }
  });
};

var removeModal = function() {
  $("#modal-background").remove();
  $(document).off("keyup");
};
