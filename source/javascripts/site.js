// This is where it all goes :)
//= require "jquery"
//= require "vendor/ace/ace"
//= require "vendor/ace/theme-monokai"
//= require "vendor/ace/mode-javascript"

$(function () {
	var editor = ace.edit("editor");
	editor.setTheme("ace/theme/monokai");
	editor.getSession().setMode("ace/mode/javascript");
});
