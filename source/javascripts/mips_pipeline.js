var global_pipeline;
var global_instructions;
var instructionsHistory;
var currentPlayedCycle;
var automaticExec;

function callParser() {
  var editor = ace.edit("editor");
  $("#code-footer").hide();
  $("#code-errors").html("");
  var instruction_set;
  $("#parse_button")[0].disabled = true;

  try {
    instruction_set = parser_instance.parse(editor.getValue());
  } catch(err) {
    printError(err.name + " in line " + err.location.start.line +  ": " + err.message);
    return;
  }

  var nonexistentLabels = obtainNonexistentLabels(instruction_set);
  if (nonexistentLabels.length > 0) {
    printError("The following markers are used in branches or jumps without being defined: " + nonexistentLabels);
    return;
  }
  global_instructions = instruction_set;
  global_pipeline = createPipeline(1,32,32,true,false,true); 
  instructionsHistory = [];
  for (var i = 0; i < instruction_set.length; ++i) {
    instructionsHistory.push([]);
  }

  currentPlayedCycle = 0;
  $("#runtime-link").show();
  $("#runtime-link").tab("show");
  $("#code-link").hide();
  next();
}

function next() {
  $("#runtime-execution").show();
  callNextClockCycle();
}

function play() {
  automaticExec = setInterval(callNextClockCycle, 1000);
  $("#runtime-execution").show();
  $("#play").hide();
  $("#pause").show();
}

function pause() {
  clearInterval(automaticExec);
  $("#play").show();
  $("#pause").hide();
}

function stop() {
  pause();
  currentPlayedCycle--;
  resetState();
  $("#code-link").show();
  $("#code-link").tab("show");
  $("#runtime-link").hide();
  $("#parse_button")[0].disabled = false;
}

function callNextClockCycle() {
  nextClockCycle(global_pipeline,global_instructions);
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
  $("#code-footer").show();
}
