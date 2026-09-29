package coa;

import java.util.ArrayList;
import java.util.List;

class ControlUnit {
    private final AluStub alu = new AluStub();
    private List<Instruction> program = new ArrayList<>();

    void loadProgram(List<Instruction> instructions) {
        program = new ArrayList<>(instructions);
    }

    void run() {
        System.out.println("--- Control Unit: starting execution ---");
        for (int index = 0; index < program.size(); index++) {
            execute(fetch(index));
        }
        System.out.println("--- Control Unit: execution finished ---");
    }

    private Instruction fetch(int index) {
        Instruction instruction = program.get(index);
        System.out.printf("%n[FETCH]   Instruction %d: %s %d, %d%n",
                index + 1, instruction.opcode, instruction.operand1, instruction.operand2);
        return instruction;
    }

    private void execute(Instruction instruction) {
        System.out.println("[DECODE]  Opcode is " + instruction.opcode);
        switch (instruction.opcode) {
            case "ADD" -> System.out.println("[EXECUTE] Result = "
                    + alu.add(instruction.operand1, instruction.operand2));
            case "SUB" -> System.out.println("[EXECUTE] Result = "
                    + alu.subtract(instruction.operand1, instruction.operand2));
            case "MUL" -> System.out.println("[EXECUTE] Result = "
                    + alu.multiply(instruction.operand1, instruction.operand2));
            default -> {
                System.out.println("[EXECUTE] Unknown opcode - skipping.");
            }
        }
    }

    public static void main(String[] args) {
        ControlUnit controlUnit = new ControlUnit();
        controlUnit.loadProgram(List.of(
                new Instruction("ADD", 10, 5),
                new Instruction("SUB", 20, 8),
                new Instruction("MUL", 4, 6)));
        controlUnit.run();
    }
}

final class Instruction {
    final String opcode;
    final int operand1;
    final int operand2;

    Instruction(String opcode, int operand1, int operand2) {
        this.opcode = opcode;
        this.operand1 = operand1;
        this.operand2 = operand2;
    }
}

final class AluStub {
    int add(int first, int second) {
        return first + second;
    }

    int subtract(int first, int second) {
        return first - second;
    }

    int multiply(int first, int second) {
        return first * second;
    }
}