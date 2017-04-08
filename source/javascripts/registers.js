function reserveRegisterForReading(register){
	if(!available_for_reading) {
		return -1;
	}
	register.amount_reading += 1;
	register.available_for_writing = false;
	return 1;
}

function reserveRegisterForWriting(register){
	if(!available_for_writing) {
		return -1;
	}
	register.available_for_writing = false;
	register.available_for_reading = false;
	return 1;
}

function reserveRegisterForReadingAndWriting(register){
	if(!available_for_writing) {
		return -1;
	}
	register.available_for_writing = false;
	register.available_for_reading = false;
	register.amount_reading += 1;
	return 1;
}

function freeRegisterAfterReading(register){
	register.amount_reading -= 1;
	if (register.amount_reading == 0) {
		register.available_for_writing = true;
	}
}

function freeRegisterAfterWriting(register){
	register.available_for_writing = true;
	register.available_for_reading = true;
}
