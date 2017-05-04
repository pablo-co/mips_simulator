var current_clock_cycle = 0

var previous_clock_cycles = []

function nextClockCycle(pipeline, instruction_set) {
  current_clock_cycle += 1;
  moveAllInstructionsCurrentlyInPipeline(pipeline);
  tryToInsertNewInstructionIntoPipeline(pipeline,instruction_set);
  performAllStageOperations(pipeline);
  drawExecution();
}

function moveAllInstructionsCurrentlyInPipeline(pipeline) {
  pipeline.execution_graph.forEach(function(stage) {
    if (stage.instruction == null) {
      return;
    }
    //Instruction has to be stalled if operation was not successful.
    //It will be reattempted in the current clock cycle.
    if ((stage.stage_operation != null) && (stage.operation_performed == null || stage.operation_performed == false)) {
      return;
    }
    if(stage.next_stage == null) {
      stage.instruction.cycle_finished = current_clock_cycle;
      stage.instruction = null;
      //stage.operation_performed == false;
      return;
    }
    if (stage.next_stage != "UNKNOWN") {
      if (stage.next_stage.instruction == null) {
        if ((pipeline.superscaling_amount == 1 && stage.next_stage.name == "MEM") || (pipeline.superscaling_amount != 1 && stage.next_stage.name == "WB")) { //Last execution operation
          var min_starting_cycle = Number.MAX_VALUE;
          pipeline.execution_graph.forEach(function(inner_stage) {
            if (inner_stage.next_stage != "UNKNOWN" && inner_stage.instruction != null && inner_stage.next_stage != null && ((pipeline.superscaling_amount == 1 && inner_stage.next_stage.name == "MEM") || (pipeline.superscaling_amount != 1 && inner_stage.next_stage.name == "WB")) && inner_stage.instruction.sequence_number < min_starting_cycle) {
              min_starting_cycle = inner_stage.instruction.sequence_number;
            }
          });
          if (stage.instruction.sequence_number == min_starting_cycle) {
            stage.next_stage.instruction = stage.instruction;
            stage.instruction = null;
            stage.next_stage.operation_performed = false;
          }
        } else {
          stage.next_stage.instruction = stage.instruction;
          stage.instruction = null;
          stage.next_stage.operation_performed = false;
        }
      }	
    }
    else { // ID
      var min_starting_cycle = Number.MAX_VALUE;
      pipeline.execution_graph.forEach(function(inner_stage) {
        if (inner_stage.next_stage == "UNKNOWN" && inner_stage.instruction != null && inner_stage.instruction.sequence_number < min_starting_cycle) {
          min_starting_cycle = inner_stage.instruction.sequence_number;
        }
      });
      var execution_stage = pipeline.execution_stages[deduceExecutionPipeline(stage.instruction)];
      if (execution_stage.instruction == null && stage.instruction.sequence_number == min_starting_cycle) {
        execution_stage.instruction = stage.instruction;
        stage.instruction = null;
        execution_stage.operation_performed = false;
      }
    }

  });
}

function performAllStageOperations(pipeline) {
  var idOperations = []; // To attempt their execution in order.
  var executionOperations = []; // To attempt their execution in order.
  pipeline.execution_graph.forEach(function(stage) {
    if (stage.instruction == null || stage.stage_operation == null || stage.operation_performed == true) {
      return;
    }
    try {
      if (stage.next_stage == "UNKNOWN") { // ID operation
        idOperations.push(stage);
      } else if (stage.next_stage != null && ((pipeline.superscaling_amount == 1 && stage.next_stage.name == "MEM") || (pipeline.superscaling_amount != 1 && stage.next_stage.name == "WB"))) { //Last execution operation
        executionOperations.push(stage);
      } else {
        stage.operation_performed = stage.stage_operation(stage.instruction);
      }
    } catch (e) {
      stage.instruction.exception = true;
      stage.operation_performed = true; //So that the instruction continues until WB.
    }
  });

  executionOperations.sort(function (operation1, operation2) {
    return operation1.instruction.sequence_number > operation2.instruction.sequence_number;
  });
  executionOperations.forEach(function(stage) {
    try {
      stage.operation_performed = stage.stage_operation(stage.instruction);
    } catch (e) {
      stage.instruction.exception = true;
      stage.operation_performed = true; //So that the instruction continues until WB.
    }
  });

  idOperations.sort(function (operation1, operation2) {
    return operation1.instruction.sequence_number > operation2.instruction.sequence_number;
  });
  idOperations.forEach(function(stage) {
    try {
      stage.operation_performed = stage.stage_operation(stage.instruction);
    } catch (e) {
      stage.instruction.exception = true;
      stage.operation_performed = true; //So that the instruction continues until WB.
    }
  });
}

function tryToInsertNewInstructionIntoPipeline(pipeline,instruction_set){
  pipeline.fetching_stages.forEach(function(fetching_stage) {
    if (fetching_stage.instruction == null){
      if (instruction_set[next_instruction] != null) {	
        instruction_set[next_instruction].cycle_started = current_clock_cycle;
        instruction_set[next_instruction].sequence_number = global_sequence_number;
        global_sequence_number++;
        fetching_stage.instruction = instruction_set[next_instruction];
        next_instruction++;
      }
    }
  });
}

function deduceExecutionPipeline(instruction) {
  //0 EX
  //1 FP ADD
  //2 MULT
  //3 FP MULT

  if (instruction.op == "MULT.S" || instruction.op == "DIV.S" || instruction.op == "MULTI.S" || instruction.op == "DIVI.S") {
    return 3;
  }
  if (instruction.op == "MULT" || instruction.op == "DIV" || instruction.op == "MULTI" || instruction.op == "DIVI") {
    return 2;
  }
  if (instruction.reg == "float" && !(instruction.op == "LW.S" || instruction.op == "SW.S" || instruction.op == "BEQ.S" || instruction.op == "BEQZ.S" || instruction.op == "BNE.S" || instruction.op == "BNEZ.S" )) {
    return 1;
  }
  return 0;
}
