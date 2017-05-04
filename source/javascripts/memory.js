function build_memory(number_of_bytes) {
  return new ArrayBuffer(number_of_bytes);
}

function write_int(memory, address, val) {
  if (address > memorySize) {
    throw "Invalid access";
  }

  try {
    var view = new DataView(memory, address, 4);
    view.setInt32(0, val);
    return true;
  } catch(e) {
    return false;
  }
}

function write_float(memory, address, val) {
  if (address > memorySize) {
    throw "Invalid access";
  }

  try {
    var view = new DataView(memory, address, 4);
    view.setFloat32(0, val);
    return true;
  } catch(e) {
    return false;
  }
}

function read_int(memory, address) {
  if (address > memorySize) {
    throw "Invalid access";
  }

  try {
    var view = new DataView(memory, address, 4);
    return view.getInt32(0);
  } catch(e) {
    return null;
  }
}

function read_float(memory, address) {
  if (address > memorySize) {
    throw "Invalid access";
  }

  try {
    var view = new DataView(memory, address, 4);
    return view.getFloat32(0);
  } catch(e) {
    return null;
  }
}
