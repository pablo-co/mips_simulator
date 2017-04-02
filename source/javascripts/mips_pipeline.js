function callParser() {
  	var editor = ace.edit("editor");
  	var result_area = $("#parse_result_area")[0];
  	$("#parse_button")[0].disabled = true;
  	try {
  		  	result_area.value = parser_instance.parse(editor.getValue());
  	} catch(err) {
  		result_area.value = err;
  	}

}