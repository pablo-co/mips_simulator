var global_pipeline;
var global_instructions;
var instructionsHistory;
var automaticExec;

function callParser() {
  var editor = ace.edit("editor");
  $("#parse_result_area")[0].value = "";
  $("#code-errors").html("");
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
  global_instructions = instruction_set;
  global_pipeline = createPipeline(1,32,32,false); 
  instructionsHistory = [];
  for (var i = 0; i < instruction_set.length; ++i) {
    instructionsHistory.push([]);
  }

  $("#runtime-link").tab("show");

  return instruction_set;
}

function play() {
  automaticExec = setInterval(callNextClockCycle, 1000);
  $("#play").hide();
  $("#pause").show();
}

function pause() {
  clearInterval(automaticExec);
  $("#play").show();
  $("#pause").hide();
}

function callNextClockCycle() {
  nextClockCycle(global_pipeline,global_instructions);
  $("#parse_result_area")[0].value = current_clock_cycle;
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
  $("#code-errors").html(error_string);
}
