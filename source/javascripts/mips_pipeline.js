function callParser() {
  	var editor = ace.edit("editor");
  	$("#parse_result_area")[0].value = "";
  	var instruction_set;
  	$("#parse_button")[0].disabled = true;
  	try {
  		instruction_set = parser_instance.parse(editor.getValue());
  	} catch(err) {
  		printError(err);
  		return;
  	}

  	var nonexistentLabels = obtainNonexistentLabels(instruction_set);
  	if (nonexistentLabels.length > 0) {
  		printError("The following markers are used in branches or jumps without being defined: " + nonexistentLabels);
  		return;
  	}
}

function obtainNonexistentLabels(instruction_set) {
	var nonexistentLabels = [];
	var markersFound = [];
	instruction_set.forEach(function(instruction) {
		if (instruction.marker != null) {
			markersFound.push(instruction.marker);
		}

	});
	instruction_set.forEach(function(instruction) {
		if (instruction.label != null) { 
			if ($.inArray(instruction.label, markersFound) == -1) {
				nonexistentLabels.push(instruction.label);
			}
		}
	});
	return nonexistentLabels;
}

function printError(error_string){
	var error_output_area = $("#parse_result_area")[0];
	error_output_area.value = error_string;
}