$(function () {
  $("#pause").hide();
  $("#code-footer").hide();
  $("#runtime-link").hide();

  var editor = ace.edit("editor");
  window.editor = editor;
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");

  editor.getSession().on('change', function(e) {
    var parse_button = $("#parse_button")[0];
    parse_button.disabled = false;
  });

  window.playSpeed = $("#play-speed").slider({
    min: 0.1,
    max: 10,
    value: 1,
    scale: 'logarithmic',
    step: 0.1,
    formatter: function(value) {
      return (1 / value).toFixed(2) + "x";
    }
  });

  $("#speedSlider").hide();
});
