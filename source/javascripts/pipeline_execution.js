var current_clock_cycle = 0

var previous_clock_cycles = []

function nextClockCycle(pipeline, instruction_set) {
	current_clock_cycle += 1;
	moveAllInstructionsCurrentlyInPipeline(pipeline);
	performAllStageOperations(pipeline);
	tryToInsertNewInstructionIntoPipeline(pipeline,instruction_set);
}

function moveAllInstructionsCurrentlyInPipeline(pipeline) {
	pipeline.execution_graph.forEach(function(stage) {
		if (stage.instruction == null) {
			return;
		}
		if(stage.next_stage == null) {
			stage.instruction.cycle_finished = current_clock_cycle;
			stage.instruction = null;
			return;
		}
		if (stage.next_stage != "UNKNOWN") {
			if (stage.next_stage.instruction == null) {
				stage.next_stage.instruction = stage.instruction;
				stage.instruction = null;
			}	
		}
		else {
			var execution_stage = pipeline.execution_stages[deduce_execution_pipeline(stage.instruction)];
			if (execution_stage.instruction == null) {
				execution_stage.instruction = stage.instruction;
				stage.instruction = null;
			}
		}
		
	});
}

function performAllStageOperations(pipeline) {
	pipeline.execution_graph.forEach(function(stage) {
		if (stage.instruction == null) {
			return;
		}
		if (stage.stage_operation == null) {
			return;
		}
		stage.stage_operation();
	});
}

function tryToInsertNewInstructionIntoPipeline(pipeline,instruction_set){
	pipeline.fetching_stages.forEach(function(fetching_stage) {
		if (fetching_stage.instruction == null){
			var instruction_to_insert = instruction_set.filter(function(instruction) {
				return instruction.cycle_started == null;
			})[0];
			instruction_to_insert.cycle_started = current_clock_cycle;
			fetching_stage.instruction = instruction_to_insert;
		}
	});
}

function deduceExecutionPipeline(instruction) {
	//0 EX
	//1 FP ADD
	//2 MULT
	//3 FP MULT

	if (instruction.op == "MULT.S" || instruction.op == "DIV.S") {
		return 3;
	}
	if (instruction.op == "MULT" || instruction.op == "DIV") {
		return 2;
	}
	if (instruction.reg == "float" && !(instruction.op == "LW.S" || instruction.op == "SW.S")) {
		return 1;
	}
	return 0;
}