$(function() {
  window.templates = {};
  $(".template").each(function(i, el) {
    window.templates[$(el).attr("id")] = Handlebars.compile($(this).html());
  });
});

function drawExecution() {
  drawCode();
  drawInt();
  drawFloat();
  drawMem();
}

function drawCode() {
  ++currentPlayedCycle;
  $("#cycle").html(currentPlayedCycle);
  var content = {lines:[]};
  for (var i = 0; i < global_instructions.length; ++i) {
    var line = global_instructions[i];
    var active = line.cycle_started == current_clock_cycle;
    var stage = currentStage(line);
    updateHistory(line.num, stage);
    content.lines.push({body: line.text, active: active, stages: getHistory(line.num)});
  }
  var html = window.templates["code-runtime-template"](content);
  $("#runtime-container").html(html);
}

function getHistory(num) {
  var last_x = 4;
  var stages = instructionsHistory[num].slice().reverse().slice(0, last_x);
  for (var i = 0; i < stages.length; ++i) {
    if (current_clock_cycle - stages[i].cycle >= last_x) {
      stages.splice(i, 1);
      --i;
    }
  }

  var cycle = current_clock_cycle;
  if (stages[0]) { cycle = stages[0].cycle }
  var spaces = Math.min(current_clock_cycle - cycle, 3);
  for (var i = 0; i < spaces; ++i) {
    stages.unshift(null);
  }

  return stages;
}

function updateHistory(num, stage) {
  if (stage === null) {
    return;
  }

  var len = instructionsHistory[num].length;
  if (instructionsHistory[num][len - 1] == stage) {
    instructionsHistory[num].push({cycle: current_clock_cycle, name: "Stall"});
  } else {
    instructionsHistory[num].push({cycle: current_clock_cycle, name: stage});
  }
}

function currentStage(line) {
  var arr = global_pipeline.execution_graph;
  for (var i = 0; i < arr.length; ++i) {
    var stage = global_pipeline.execution_graph[i];
    if (stage.instruction && stage.instruction.num == line.num) {
      return stage.name;
    }
  }
  return null;
}

function drawInt() {
  var state = [];
  for (var i = 0; i < integer_registers.length; ++i) {
    value = integer_registers[i].value;
    if (value != 0) {
      state.push({value: integer_registers[i].value, addr: i});
    }
  }
  var html = window.templates["memory-template"]({title: "INT", mem: state});
  $("#int-register-file").html(html);
}

function drawFloat() {
  var state = [];
  for (var i = 0; i < float_registers.length; ++i) {
    value = float_registers[i].value;
    if (value != 0) {
      state.push({value: value, addr: i});
    }
  }
  var html = window.templates["memory-template"]({title: "FLOAT", mem: state});
  $("#float-register-file").html(html);
}

function drawMem() {
  var state = [];
  for (var i = 0; i < memorySize; i += 4) {
    var value = read_int(memory, i);
    if (value != 0) {
      state.push({value: value, addr: i});
    }
  }
  var html = window.templates["memory-template"]({title: "MEM", mem: state});
  $("#memory-file").html(html);
}
