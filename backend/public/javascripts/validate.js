var validate = function() {
  var url = '/validate';

  $.get(url, function(res) {
    if(res.error != null) {
      window.location = '/';
    }
  });
};
