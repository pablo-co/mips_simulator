var float_registers;
var integer_registers;
var memory = build_memory(10000);
var next_instruction = 0;
var next_instruction_value_when_predicting_branch = 0;
var forwarding_enabled = false;
var branch_prediction_taken = false; // 0 - No branch prediction, 1 - branch predict not taken, 2 - branch predict taken.

function createPipeline(superscaling_amount,int_registers_amount,float_registers_amount,branch_delay_slots,forwarding,branch_prediction) {

  var stages = [];
  var executionStages = [];
  var fetchingStages = [];

  float_registers = initializeRegisters(float_registers_amount);
  integer_registers = initializeRegisters(int_registers_amount);

  forwarding_enabled = forwarding;
  branch_prediction_taken = branch_prediction;

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

  return {execution_graph:stages, execution_stages:executionStages,fetching_stages:fetchingStages,branch_delay_slots:branch_delay_slots};
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
    registers.push({value:0,temp_value:null,available_for_reading:true,amount_reading:0,available_for_writing:true,waiting_for_lock:[]})
  }
  return registers;
}

function wbOperation(instruction) {

  if (instruction.exception != null && instruction.exception == true) {
    handleException(instruction);
  }

  try {

    var register_array;
    if (instruction.reg == "int") {
      register_array = integer_registers;
    } else {
      register_array = float_registers;
    }
    if (instruction.op_result != null) {
      register_array[instruction.rs].value = instruction.op_result;
      register_array[instruction.rs].temp_value = null;
    }
    if (instruction.rs != null && instruction.rt != null && (instruction.rd != null || instruction.im != null)) {
      //R type instructions
      if (instruction.op == "SW" || instruction.op == "SW.S") {
        freeRegisterAfterReading(register_array[instruction.rt]);
        freeRegisterAfterReading(register_array[instruction.rs]);
      } else {
        if (! forwarding_enabled) {
          freeRegisterAfterWriting(register_array[instruction.rs]);
        }
        freeRegisterAfterReading(register_array[instruction.rt]);
        if (instruction.rd != null) {
          freeRegisterAfterReading(register_array[instruction.rd]);
        }
      }

    }
  } catch (e) {
    handleException(instruction);
  }

  return true;
}

function memOperation(instruction) {
  if (instruction.mem_addr != null) { // Otherwise, do nothing in mem (not mem operation)
    if (instruction.op == "LW") {
      var value = read_int(memory,instruction.mem_addr);
      if (value == null) {
        throw "Value could not be read.";
      }
      instruction.op_result = value;
      if (forwarding_enabled) {
        integer_registers[instruction.rs].temp_value = instruction.op_result;
        freeRegisterAfterWriting(integer_registers[instruction.rs]);
      }
      return true;
    }
    if (instruction.op == "LW.S") {
      var value = read_float(memory,instruction.mem_addr);
      if (value == null) {
        throw "Value could not be read.";
      }
      instruction.op_result = value;
      if (forwarding_enabled) {
        float_registers[instruction.rs].temp_value = instruction.op_result;
        freeRegisterAfterWriting(float_registers[instruction.rs]);
      }
      return true;
    }
    var value;
    if (instruction.op == "SW") {
      if (integer_registers[instruction.rs].temp_value != null) {
        value = integer_registers[instruction.rs].temp_value;
      } else {
        value = integer_registers[instruction.rs].value;
      } 
      return write_int(memory,instruction.mem_addr,value);
    }
    if (instruction.op == "SW.S") {
      if (float_registers[instruction.rs].temp_value != null) {
        value = float_registers[instruction.rs].temp_value;
      } else {
        value = float_registers[instruction.rs].value;
      } 
      return write_float(memory,instruction.mem_addr,value);
    }
  }
  return true;
}

function exOperation(instruction) {

  var value1, value2, value3, value1float, value3float;
  if (instruction.rt != null && integer_registers[instruction.rt] != null) {
   if (integer_registers[instruction.rt].temp_value != null) {
      value1 = integer_registers[instruction.rt].temp_value;
    } else {
      value1 = integer_registers[instruction.rt].value;
    } 
  }
  if (instruction.rd != null && integer_registers[instruction.rd] != null){
    if (integer_registers[instruction.rd].temp_value != null) {
      value2 = integer_registers[instruction.rd].temp_value;
    } else {
      value2 = integer_registers[instruction.rd].value;
    }
  }
  if (instruction.rs != null && integer_registers[instruction.rs] != null){
    if (integer_registers[instruction.rs].temp_value != null) {
      value3 = integer_registers[instruction.rs].temp_value;
    } else {
      value3 = integer_registers[instruction.rs].value;
    }
  }
  if (instruction.rt != null && float_registers[instruction.rt] != null) {
    if (float_registers[instruction.rt].temp_value != null) {
      value1float = float_registers[instruction.rt].temp_value;
    } else {
      value1float = float_registers[instruction.rt].value;
    } 
  }
  if (instruction.rs != null && float_registers[instruction.rs] != null){
    if (float_registers[instruction.rs].temp_value != null) {
      value3 = float_registers[instruction.rs].temp_value;
    } else {
      value3 = float_registers[instruction.rs].value;
    }
  }
  switch(instruction.op) {
    case "ADD":
      instruction.op_result = value1 + value2; 
      break;
    case "SUB":
      instruction.op_result = value1 - value2; 
      break;
    case "SUB":
      instruction.op_result = value1 - value2; 
      break;
    case "ADDI":
      instruction.op_result = value1 + instruction.im; 
      break;
    case "SUBI":
      instruction.op_result = value1 - instruction.im; 
      break;
    case "LW":
    case "SW":
    case "LW.S":
    case "SW.S":
      instruction.mem_addr = value1 + instruction.im;
      break;
    case "BEQ":
      if (value3 == value1) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "BNE":
      if (value3 != value1) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "BEQZ":
      if (value3 == 0) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "BNEZ":
      if (value3 != 0) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "BEQ.S":
      if (value3float == value1float) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "BNE.S":
      if (value3float != value1float) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "BEQZ.S":
      if (value3float == 0) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "BNEZ.S":
      if (value3float != 0) {
        doTakeBranch(instruction);
      } else {
        doNotTakeBranch(instruction);
      }
      break;
    case "J":
      doTakeBranch(instruction);
      break;
    case "NOOP":
      break;
    default:
      throw "Unimplemented operation";
      break;
  }
  if (forwarding_enabled && instruction.op_result != null) {
    integer_registers[instruction.rs].temp_value = instruction.op_result;
    if (instruction.rs != null && instruction.rt != null && (instruction.rd != null || instruction.im != null)) {
      //R type instructions
      if ( ! (instruction.op == "SW" || instruction.op == "SW.S")) {
          freeRegisterAfterWriting(integer_registers[instruction.rs]);
      }
    }
  }
  
  return true;
}

function fpOperation(instruction) {

  var value1, value2;
  if (instruction.rt != null && float_registers[instruction.rt] != null) {
   if (float_registers[instruction.rt].temp_value != null) {
      value1 = float_registers[instruction.rt].temp_value;
    } else {
      value1 = float_registers[instruction.rt].value;
    } 
  }
  if (instruction.rd != null && float_registers[instruction.rd] != null){
    if (float_registers[instruction.rd].temp_value != null) {
      value2 = float_registers[instruction.rd].temp_value;
    } else {
      value2 = float_registers[instruction.rd].value;
    }
  }
  switch(instruction.op) {
    case "ADD.S":
      instruction.op_result = value1 + value2; 
      break;
    case "SUB.S":
      instruction.op_result = value1 - value2; 
      break;
    case "ADDI.S":
      instruction.op_result = value1 + instruction.im; 
      break;
    case "SUBI.S":
      instruction.op_result = value1 - instruction.im; 
      break;
    default:
      throw "Unimplemented operation";
      break;
  }

  if (forwarding_enabled && instruction.op_result != null) {
    float_registers[instruction.rs].temp_value = instruction.op_result;
    freeRegisterAfterWriting(float_registers[instruction.rs]);
  }

  return true;
}

function multOperation(instruction) {
  
  var value1, value2;
  if (instruction.rt != null && integer_registers[instruction.rt] != null) {
   if (integer_registers[instruction.rt].temp_value != null) {
      value1 = integer_registers[instruction.rt].temp_value;
    } else {
      value1 = integer_registers[instruction.rt].value;
    } 
  }
  if (instruction.rd != null && integer_registers[instruction.rd] != null){
    if (integer_registers[instruction.rd].temp_value != null) {
      value2 = integer_registers[instruction.rd].temp_value;
    } else {
      value2 = integer_registers[instruction.rd].value;
    }
  }

  switch(instruction.op) {
    case "MULT":
      instruction.op_result = value1 * value2; 
      break;
    case "DIV":
      instruction.op_result = Math.floor(value1 / value2); 
      break;
    case "MULTI":
      instruction.op_result = value1 * instruction.im; 
      break;
    case "DIVI":
      instruction.op_result = Math.floor(value1 / instruction.im); 
      break;
    default:
      throw "Unimplemented operation";
      break;
  }
  return true;

  if (forwarding_enabled && instruction.op_result != null) {
    integer_registers[instruction.rs].temp_value = instruction.op_result;
    freeRegisterAfterWriting(integer_registers[instruction.rs]);
  }
}

function fpmultOperation(instruction) {

 var value1, value2;
  if (instruction.rt != null && float_registers[instruction.rt] != null) {
   if (float_registers[instruction.rt].temp_value != null) {
      value1 = float_registers[instruction.rt].temp_value;
    } else {
      value1 = float_registers[instruction.rt].value;
    } 
  }
  if (instruction.rd != null && float_registers[instruction.rd] != null){
    if (float_registers[instruction.rd].temp_value != null) {
      value2 = float_registers[instruction.rd].temp_value;
    } else {
      value2 = float_registers[instruction.rd].value;
    }
  }

  switch(instruction.op) {
    case "MULT.S":
      instruction.op_result = value1 * value2; 
      break;
    case "DIV.S":
      instruction.op_result = Math.floor(value1 / value2); 
      break;
    case "MULTI.S":
      instruction.op_result = value1 * instruction.im; 
      break;
    case "DIVI.S":
      instruction.op_result = Math.floor(value1 / instruction.im); 
      break;
    default:
      throw "Unimplemented operation";
      break;
  }

  if (forwarding_enabled && instruction.op_result != null) {
    float_registers[instruction.rs].temp_value = instruction.op_result;
    freeRegisterAfterWriting(float_registers[instruction.rs]);
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
    if (reserveRegisterForReading(register_array[instruction.rt],instruction.cycle_started)) {
      if (reserveRegisterForReading(register_array[instruction.rs],instruction.cycle_started)) {
        return true;
      } else {
        freeRegisterAfterReading(register_array[instruction.rt]);
        return false;
      }
    } else {
      return false;
    }
  } else {
    if(instruction.op == "BEQ" || instruction.op == "BEQZ" || instruction.op == "BEQ.S" || instruction.op == "BEQZ.S" || instruction.op == "BNE" || instruction.op == "BNEZ" || instruction.op == "BNE.S" || instruction.op == "BNEZ.S" || instruction.op == "J"  ) {
      if (branch_prediction_taken) {
        instruction_counter = 0;
        next_instruction_value_when_predicting_branch = next_instruction;
        global_instructions.forEach(function(target) {
          if (target.marker != null && target.marker == instruction.label) { 
            next_instruction = instruction_counter;
          }
          instruction_counter++;
        });
      }
      if (instruction.rs != null) { 
        if (reserveRegisterForReading(register_array[instruction.rs],instruction.cycle_started)) { 
          if (instruction.rt != null) {
            if (reserveRegisterForReading(register_array[instruction.rt],instruction.cycle_started)) { 
              return true;
            } else {
              freeRegisterAfterReading(register_array[instruction.rs]);
              return false;
            }
          }
        } else {
          return false;
        }
      }
    } else {
      if (reserveRegisterForWriting(register_array[instruction.rs],instruction.cycle_started)) { // First reservation successful
        if (instruction.rt != null) {
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
          }
        } else { // Second reservation not successful.
          freeRegisterAfterWriting(register_array[instruction.rs]);
          return false;
        }

      } else {
        return false;
      }
    }
  }
  return true;
}

function doTakeBranch(instruction){

  if (! branch_prediction_taken) {

    instruction_counter = 0;
    global_instructions.forEach(function(target) {
      if (target.marker != null && target.marker == instruction.label) { 
        next_instruction = instruction_counter;
      }
      instruction_counter++;
    });

    global_pipeline.fetching_stages.forEach(function(fetching_stage) {
        fetching_stage.instruction = null;
      });

    if (global_pipeline.branch_delay_slots != true) {
      global_pipeline.fetching_stages.forEach(function(fetching_stage) {
        fetching_stage.next_stage.instruction = null;
      });
    }
  } else {
    if (global_pipeline.branch_delay_slots != true) {
      global_pipeline.fetching_stages.forEach(function(fetching_stage) {
          fetching_stage.next_stage.instruction = null;
      });
    }
  }
  
}

function doNotTakeBranch(instruction){
  if (branch_prediction_taken) {
    
    next_instruction = next_instruction_value_when_predicting_branch;

    global_pipeline.fetching_stages.forEach(function(fetching_stage) {
        fetching_stage.instruction = null;
      });
    if (global_pipeline.branch_delay_slots != true) {
      global_pipeline.fetching_stages.forEach(function(fetching_stage) {
        fetching_stage.next_stage.instruction = null;
      });
    }
  } else {
    if (global_pipeline.branch_delay_slots != true) {
      global_pipeline.fetching_stages.forEach(function(fetching_stage) {
          fetching_stage.next_stage.instruction = null;
      });
    }
  }
  
}

function handleException(instruction) {
  var first = true;
  global_pipeline.execution_graph.forEach(function(stage) {
    if (first) {
      first = false;
    } else {
      stage.instruction = null;
    }
  });
}
