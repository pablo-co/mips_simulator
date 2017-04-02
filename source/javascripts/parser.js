var parser_instance = null;

$(function() {
	$("#parse_button")[0].disabled = true;
	$.get('static/grammar.txt', function(data) {
		$(document).trigger("parserReady", [peg.generate(data)]);
	});
});

$(document).on("parserReady", function(event, parser) {
	$("#parse_button")[0].disabled = false;
	parser_instance = parser;
});
