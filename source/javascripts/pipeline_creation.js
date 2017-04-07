function createPipeline(superscaling_amount) {
	
	var stages = [];
	var executionStages = [];
	var fetchingStages = [];

	var WB = createStage("WB",null);
	stages.push(WB);

	var MEM = createStage("MEM",WB);
	stages.push(MEM);

	var EX = createStage("EX",MEM);
	stages.push(EX);
	executionStages.push(EX);

	var FP = [5];
	var MULT = [4];
	var FPMULT = [7];

	if (superscaling_amount == 1) {
		FP[4] = createStage("FP5",MEM);
		MULT[3] = createStage("MULT4",MEM);
		FPMULT[6] = createStage("FPMULT7",MEM);
	} else {
		FP[4] = createStage("FP5",WB);
		MULT[3] = createStage("MULT4",WB);
		FPMULT[6] = createStage("FPMULT7",WB);
	}

	stages.push(FP[4]);
	for (i = 4; i >= 1;i--) {
		FP[i - 1] = createStage("FP" + i,FP[i]);
		stages.push(FP[i-1]);
	}
	executionStages.push(FP[0]);

	stages.push(MULT[3]);
	for (i = 3; i >= 1;i--) {
		MULT[i-1] = createStage("MULT" + i,MULT[i]);
		stages.push(MULT[i-1]);
	}
	executionStages.push(MULT[0]);

	stages.push(FPMULT[6]);
	for (i = 3; i >= 1;i--) {
		FPMULT[i-1] = createStage("FPMULT" + i,FPMULT[i]);
		stages.push(FPMULT[i-1]);
	}
	executionStages.push(FPMULT[0]);
	
	for (i = 1;i <= superscaling_amount; i++) {
		var ID = createStage("ID" + i,"UNKNOWN");
		var IF = createStage("IF" + i,ID);
		stages.push(ID);
		stages.push(IF);
		fetchingStages.push(IF);
	}

	return {executionGraph:stages, executionStages:executionStages,fetchingStages:fetchingStages};
};

function createStage(name,next_stage) {
	return {
		name: name,
		next_stage: next_stage,
		instruction: null
	}
}