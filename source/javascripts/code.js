var divcode = `ADDI.S F1, F1, 18.3
ADDI.S F2, F2, 2
SW.S F1, 0(R1)
SW.S F2, 4(R1)
LOOP: DIV.S F3, F1, F2
SW.S F3, 8(R1)
LW.S F1, 8(R1)
BNEZ.S F1, LOOP`;

var fibcode = `ADDI R1, R1, 1
ADDI R2, R2, 1
SW R1, 0(R4)
SW R2, 4(R4)
LOOP: LW R1, 0(R4)
LW R2, 4(R4)
ADD R3, R1, R2
SW R3, 8(R4)
ADDI R4, R4, 4
BEQZ R0, LOOP`;

var dotcode = `ADDI R1, R1, 1
ADDI R2, R2, 1
ADDI R3, R3, 1
ADDI R4, R4, 1
SW R1, 0(R10)
SW R2, 4(R10)
SW R3, 8(R10)
SW R4, 12(R10)
LOOP: MULT R7, R1, R3
MULT R8, R2, R4
ADD R0, R7, R8
SW R0, 24(R10)
ADDI R1, R0, 1
ADDI R2, R0, 5
ADDI R3, R0, 10
BNEZ R0, LOOP
ADDI R4, R0, 15`;

function loadCode(code) {
  switch (code) {
    case "div2":
      window.editor.setValue(divcode);
      break;
    case "fibonacci":
      window.editor.setValue(fibcode);
      break;
    case "dot":
      window.editor.setValue(dotcode);
      break;
  }
}
