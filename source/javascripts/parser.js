$(function() {
  $.get('static/grammar.txt', function(data) {
    $(document).trigger("parserReady", [peg.generate(data)]);
  });
});
