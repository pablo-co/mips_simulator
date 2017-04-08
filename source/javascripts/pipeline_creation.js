var float_registers;
var integer_registers;

function createPipeline(superscaling_amount,int_registers_amount,float_registers_amount) {
	
	var stages = [];
	var executionStages = [];
	var fetchingStages = [];

	float_registers = initializeRegisters(float_registers_amount);
	integer_registers = initializeRegisters(int_registers_amount);

	var WB = createStage("WB",null,null);
	stages.push(WB);

	var MEM = createStage("MEM",WB,null);
	stages.push(MEM);

	var EX = createStage("EX",MEM,null);
	stages.push(EX);
	executionStages.push(EX);

	var FP = [5];
	var MULT = [4];
	var FPMULT = [7];

	if (superscaling_amount == 1) {
		FP[4] = createStage("FP5",MEM,null);
		MULT[3] = createStage("MULT4",MEM,null);
		FPMULT[6] = createStage("FPMULT7",MEM.null);
	} else {
		FP[4] = createStage("FP5",WB.null);
		MULT[3] = createStage("MULT4",WB.null);
		FPMULT[6] = createStage("FPMULT7",WB,null);
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
		var ID = createStage("ID" + i,"UNKNOWN",null);
		var IF = createStage("IF" + i,ID,null);
		stages.push(ID);
		stages.push(IF);
		fetchingStages.push(IF);
	}

	return {execution_graph:stages, execution_stages:executionStages,fetching_stages:fetchingStages};
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
}

function wbOperation(instruction) {
	var register_array;
	if (instruction.reg == "int") {
		register_array = integer_registers;
	} else {
		register_array = float_registers;
	}
	if (instruction.op_result != null) {
		register_array[instruction.rs] = instruction.op_result;
	}
	if (instruction.rs != null && instruction.rt != null && (instruction.rd != null || instruction.im != null)) {
		//R type instructions
		freeRegistersAfterWriting(register_array[instruction.rs]);
		freeRegistersAfterReading(register_array[instruction.rt]);
		if (instruction.rd != null) {
			freeRegistersAfterReading(register_array[instruction.rd]);
		}
	}

	//TODO:Exceptions
}
