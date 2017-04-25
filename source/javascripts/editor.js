$(function () {
  $("#pause").hide();
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");

  editor.getSession().on('change', function(e) {
    var parse_button = $("#parse_button")[0];
    parse_button.disabled = false;
  });
});
