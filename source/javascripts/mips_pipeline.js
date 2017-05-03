var global_pipeline;
var global_instructions;
var instructionsHistory;
var currentPlayedCycle;
var automaticExec;
var lastPlayValue = 1;

function callParser() {
  var editor = ace.edit("editor");
  var instruction_set;

  $("#code-footer").hide();
  $("#code-errors").html("");
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

  global_pipeline = createPipeline(
    getScalarAmt(),
    getIntReg(),
    getFloatReg(),
    getBranchSlots(),
    getForwarding(),
    getBranchPred(),
    getMemSize()
  );

  instructionsHistory = [];
  for (var i = 0; i < instruction_set.length; ++i) {
    instructionsHistory.push([]);
  }

  currentPlayedCycle = 0;
  $("#runtime-link").show();
  $("#runtime-link").tab("show");
  $("#code-link").hide();
  drawExecution();
}

function getScalarAmt() {
  return parseInt($("#superscaling_input").val());
}

function getIntReg() {
  return parseInt($("#int_registers_input").val());
}

function getFloatReg() {
  return parseInt($("#float_registers_input").val());
}

function getBranchSlots() {
  return $("#branch_delay_input").val() == "true";
}

function getForwarding() {
  return $("#forwarding_input").val() == "true";
}

function getBranchPred() {
  return $("#branch_pred_input").val() == "true";
}

function getMemSize() {
  return parseInt($("#size_mem_input").val());
}

function next() {
  $("#runtime-execution").show();
  callNextClockCycle();
}

function play() {
  var value = window.playSpeed.slider("getValue");
  automaticExec = setInterval(callNextClockCycle, value * 1000);
  $("#speedSlider").show();
  $("#runtime-execution").show();
  $("#play").hide();
  $("#pause").show();
}

function pause() {
  clearInterval(automaticExec);
  $("#speedSlider").hide();
  $("#play").show();
  $("#pause").hide();
}

function stop() {
  pause();
  resetState();
  $("#speedSlider").hide();
  $("#code-link").show();
  $("#code-link").tab("show");
  $("#runtime-link").hide();
  $("#parse_button")[0].disabled = false;
}

function callNextClockCycle() {
  var value = window.playSpeed.slider("getValue");
  if (value != lastPlayValue) {
    lastPlayValue = value;
    clearInterval(automaticExec);
    automaticExec = setInterval(callNextClockCycle, value * 1000);
  }
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
