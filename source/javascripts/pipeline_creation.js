var float_registers;
var integer_registers;
var memory = build_memory(10000);
var next_instruction = 0;

function createPipeline(superscaling_amount,int_registers_amount,float_registers_amount,brach_delay_slots) {
	
	var stages = [];
	var executionStages = [];
	var fetchingStages = [];

	float_registers = initializeRegisters(float_registers_amount);
	integer_registers = initializeRegisters(int_registers_amount);

	var WB = createStage("WB",null,wbOperation);
	stages.push(WB);

	var MEM = createStage("MEM",WB,memOperation);
	stages.push(MEM);

	var EX = createStage("EX",MEM,exOperation);
	stages.push(EX);
	executionStages.push(EX);

	var FP = [5];
	var MULT = [4];
	var FPMULT = [7];

	if (superscaling_amount == 1) {
		FP[4] = createStage("FP5",MEM,fpOperation);
		MULT[3] = createStage("MULT4",MEM,multOperation);
		FPMULT[6] = createStage("FPMULT7",MEM,fpmultOperation);
	} else {
		FP[4] = createStage("FP5",WB.fpOperation);
		MULT[3] = createStage("MULT4",WB,multOperation);
		FPMULT[6] = createStage("FPMULT7",WB,fpmultOperation);
	}

	stages.push(FP[4]);
	for (i = 4; i >= 1;i--) {
		FP[i - 1] = createStage("FP" + i,FP[i],null);
		stages.push(FP[i-1]);
	}
	executionStages.push(FP[0]);

	stages.push(MULT[3]);
	for (i = 3; i >= 1;i--) {
		MULT[i-1] = createStage("MULT" + i,MULT[i],null);
		stages.push(MULT[i-1]);
	}
	executionStages.push(MULT[0]);

	stages.push(FPMULT[6]);
	for (i = 3; i >= 1;i--) {
		FPMULT[i-1] = createStage("FPMULT" + i,FPMULT[i],null);
		stages.push(FPMULT[i-1]);
	}
	executionStages.push(FPMULT[0]);
	
	for (i = 1;i <= superscaling_amount; i++) {
		var ID = createStage("ID" + i,"UNKNOWN",idOperation);
		var IF = createStage("IF" + i,ID,null);
		stages.push(ID);
		stages.push(IF);
		fetchingStages.push(IF);
	}

	return {execution_graph:stages, execution_stages:executionStages,fetching_stages:fetchingStages,branch_delay_slots:brach_delay_slots};
};

function createStage(name,next_stage,stage_operation) {
	return {
		name: name,
		next_stage: next_stage,
		instruction: null,
		stage_operation: stage_operation
	}
}

function initializeRegisters(amount_of_registers) {
	var registers = [];
	for (i = 0; i < amount_of_registers; i ++) {
		registers.push({value:0,available_for_reading:true,amount_reading:0,available_for_writing:true})
	}
	return registers;
}

function wbOperation(instruction) {
	var register_array;
	if (instruction.reg == "int") {
		register_array = integer_registers;
	} else {
		register_array = float_registers;
	}
	if (instruction.op_result != null) {
		register_array[instruction.rs].value = instruction.op_result;
	}
	if (instruction.rs != null && instruction.rt != null && (instruction.rd != null || instruction.im != null)) {
		//R type instructions
		if (instruction.op == "SW" || instruction.op == "SW.S") {
			freeRegisterAfterWriting(register_array[instruction.rt]);
			freeRegisterAfterReading(register_array[instruction.rs]);
		} else {
			freeRegisterAfterWriting(register_array[instruction.rs]);
			freeRegisterAfterReading(register_array[instruction.rt]);
			if (instruction.rd != null) {
				freeRegisterAfterReading(register_array[instruction.rd]);
			}
		}

	}
	return true;

	//TODO:Exceptions
}

function memOperation(instruction) {
	if (instruction.mem_addr != null) { // Otherwise, do nothing in mem (not mem operation)
		if (instruction.op == "LW") {
			var value = read_int(memory,instruction.mem_addr);
			if (value == null) {
				return false;
			}
			integer_registers[instruction.rs].value = value;
			return true;
		}
		if (instruction.op == "LW.S") {
			var value = read_float(memory,instruction.mem_addr);
			if (value == null) {
				return false;
			}
			float_registers[instruction.rs].value = value;
			return true;
		}
		if (instruction.op == "SW") {
			return write_int(memory,instruction.mem_addr,integer_registers[instruction.rs].value);
		}
		if (instruction.op == "SW.S") {
			return write_float(memory,instruction.mem_addr,float_registers[instruction.rs].value);
		}
	}
	return true;
}

function exOperation(instruction) {
	switch(instruction.op) {
		case "ADD":
			instruction.op_result = integer_registers[instruction.rt].value + integer_registers[instruction.rd].value; 
			break;
		case "SUB":
			instruction.op_result = integer_registers[instruction.rt].value - integer_registers[instruction.rd].value; 
			break;
		case "SUB":
			instruction.op_result = integer_registers[instruction.rt].value - integer_registers[instruction.rd].value; 
			break;
		case "ADDI":
			instruction.op_result = integer_registers[instruction.rt].value + instruction.im; 
			break;
		case "SUBI":
			instruction.op_result = integer_registers[instruction.rt].value - instruction.im; 
			break;
		case "LW":
		case "SW":
		case "LW.S":
		case "SW.S":
			instruction.mem_addr = integer_registers[instruction.rt].value + instruction.im;
			break;
		case "BEQ":
			if (integer_registers[instruction.rs].value == integer_registers[instruction.rt].value) {
				doTakeBranch(instruction);
			}
			break;
		case "BNE":
			if (integer_registers[instruction.rs].value != integer_registers[instruction.rt].value) {
				doTakeBranch(instruction);
			}
			break;
		case "BEQZ":
			if (integer_registers[instruction.rs].value == 0) {
				doTakeBranch(instruction);
			}
			break;
		case "BNEZ":
			if (integer_registers[instruction.rs].value != 0) {
				doTakeBranch(instruction);
			}
			break;
		case "BEQ.S":
			if (float_registers[instruction.rs].value == float_registers[instruction.rt].value) {
				doTakeBranch(instruction);
			}
			break;
		case "BNE.S":
			if (float_registers[instruction.rs].value != float_registers[instruction.rt].value) {
				doTakeBranch(instruction);
			}
			break;
		case "BEQZ.S":
			if (float_registers[instruction.rs].value == 0) {
				doTakeBranch(instruction);
			}
			break;
		case "BNEZ.S":
			if (float_registers[instruction.rs].value != 0) {
				doTakeBranch(instruction);
			}
			break;
		case "J":
			doTakeBranch(instruction);
			break;
		default:
			throw "Unimplemented operation";
			break;
	}
	return true;
}

function fpOperation(instruction) {
	switch(instruction.op) {
		case "ADD.S":
			instruction.op_result = float_registers[instruction.rt].value + float_registers[instruction.rd].value; 
			break;
		case "SUB.S":
			instruction.op_result = float_registers[instruction.rt].value - float_registers[instruction.rd].value; 
			break;
		case "ADDI.S":
			instruction.op_result = float_registers[instruction.rt].value + instruction.im; 
			break;
		case "SUBI.S":
			instruction.op_result = float_registers[instruction.rt].value - instruction.im; 
			break;
		default:
			throw "Unimplemented operation";
			break;
	}
	return true;
}

function multOperation(instruction) {
	switch(instruction.op) {
		case "MULT":
			instruction.op_result = integer_registers[instruction.rt].value * integer_registers[instruction.rd].value; 
			break;
		case "DIV":
			instruction.op_result = Math.floor(integer_registers[instruction.rt].value / integer_registers[instruction.rd].value); 
			break;
		case "MULTI":
			instruction.op_result = integer_registers[instruction.rt].value * instruction.im; 
			break;
		case "DIVI":
			instruction.op_result = Math.floor(integer_registers[instruction.rt].value / instruction.im); 
			break;
		default:
			throw "Unimplemented operation";
			break;
	}
	return true;
}

function fpmultOperation(instruction) {
	switch(instruction.op) {
		case "MULT.S":
			instruction.op_result = float_registers[instruction.rt].value * float_registers[instruction.rd].value; 
			break;
		case "DIV.S":
			instruction.op_result = Math.floor(float_registers[instruction.rt].value / float_registers[instruction.rd].value); 
			break;
		case "MULTI.S":
			instruction.op_result = float_registers[instruction.rt].value * instruction.im; 
			break;
		case "DIVI.S":
			instruction.op_result = Math.floor(float_registers[instruction.rt].value / instruction.im); 
			break;
		default:
			throw "Unimplemented operation";
			break;
	}
	return true;
}


function idOperation(instruction) {
	var register_array;
	if (instruction.reg == "int") {
		register_array = integer_registers;
	} else {
		register_array = float_registers;
	}
	if (instruction.op_result != null) {
		register_array[instruction.rs].value = instruction.op_result;
	}
	if (instruction.op == "SW" || instruction.op == "SW.S") {
		if (reserveRegisterForReading(register_array[instruction.rt],instruction.cycle_started))
			if (reserveRegisterForReading(register_array[instruction.rs],instruction.cycle_started)) {
				return true;
			} else {
				freeRegisterAfterReading(register_array[instruction.rt]);
				return false;
			}
	} else {
		if (reserveRegisterForWriting(register_array[instruction.rs],instruction.cycle_started)) { // First reservation successful
			if (reserveRegisterForReading(register_array[instruction.rt],instruction.cycle_started)) { // second reservation successful
				if (instruction.rd != null) { // Third reservation necessary
					if (reserveRegisterForReading(register_array[instruction.rd],instruction.cycle_started)) { // Third reservation successful
						return true;
					} else { // Third reservation not successful
						freeRegisterAfterReading(register_array[instruction.rt]);
						freeRegisterAfterWriting(register_array[instruction.rs]);
						return false;
					}
				}
			} else { // Second reservation not successful.
				freeRegisterAfterWriting(register_array[instruction.rs]);
				return false;
			}

		}
	}

	//TODO:Check for structural hazards.
	return true;
}

function doTakeBranch(instruction){
	instruction_counter = 0;
	global_instructions.forEach(function(target) {
		if (target.marker != null && target.marker == instruction.label) { 
			next_instruction = instruction_counter;
		}
		instruction_counter++;
	});
	if (global_pipeline.brach_delay_slots != true) {
		global_pipeline.fetching_stages.forEach(function(fetching_stage) {
			fetching_stage.instruction = null;
			fetching_stage.next_stage.instruction = null;
		});
	}

}
