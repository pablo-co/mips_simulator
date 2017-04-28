function reserveRegisterForReading(register,instruction_number_requesting){
	if(!register.available_for_reading && (register.instruction_requesting != instruction_number_requesting)) {
		if (! $.inArray(register.waiting_for_lock,instruction_number_requesting)) {
			register.waiting_for_lock.push(instruction_number_requesting);
		}
		return false;
	}
	if (register.waiting_for_lock.length > 0 && register.waiting_for_lock[0] != instruction_number_requesting) {
		if (! $.inArray(register.waiting_for_lock,instruction_number_requesting)) {
			register.waiting_for_lock.push(instruction_number_requesting);
		}
		return false;
	}
	if (register.waiting_for_lock.length > 0) {
		register.waiting_for_lock.pop();
	}
	//register.amount_reading += 1;
	//register.available_for_writing = false;
	return true;
}

function reserveRegisterForWriting(register,instruction_number_requesting){
	if(!register.available_for_writing) {
		if (! $.inArray(register.waiting_for_lock,instruction_number_requesting)) {
			register.waiting_for_lock.push(instruction_number_requesting);
		}
		return false;
	}
	if (register.waiting_for_lock.length > 0 && register.waiting_for_lock[0] != instruction_number_requesting) {
		if (! $.inArray(register.waiting_for_lock,instruction_number_requesting)) {
			register.waiting_for_lock.push(instruction_number_requesting);
		}
		return false;
	}
	if (register.waiting_for_lock.length > 0) {
		register.waiting_for_lock.pop();
	}
	register.available_for_writing = false;
	register.available_for_reading = false;
	register.instruction_requesting = instruction_number_requesting;
	return true;
}

function freeRegisterAfterReading(register){
	//register.amount_reading -= 1;
	//if (register.amount_reading == 0) {
	//	register.available_for_writing = true;
	//}
	return true;
}

function freeRegisterAfterWriting(register){
	register.available_for_writing = true;
	register.available_for_reading = true;
	return true;
}
