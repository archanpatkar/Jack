const bopmap = {
    "+":"add",
    "-":"sub",
    "=":"eq",
    ">":"gt",
    "<":"lt",
    "&":"and",
    "|":"or",
    "*":"call Math.multiply 2",
    "/":"call Math.divide 2"
};

const uopmap = {
    "-":"neg",
    "~":"not"
};

const push = (seg,i) => `push ${seg} ${i}`;
const pop = (seg,i) => `pop ${seg} ${i}`;
const bop = (op) => `${bopmap[op]}`;
const uop = (op) => `${uopmap[op]}`;
const label = (lab) => `label ${lab}`;
const goto = (lab) => `goto ${lab}`;
const ifgoto = (lab) => `if-goto ${lab}`;
const call = (name,args) => `call ${name} ${args?args:0}`;
const functiondef = (name,lcls) => `function ${name} ${lcls}`;
const returnop = () => `return`;

class VMEmitter {
    constructor() {
        this.output = [];
    }

    compgen() {
        return this.output.join("\n");
    }

    emit(str) {
        this.output.push(str);
    }

    emitPush(seg,i) {
        this.output.push(push(seg,i));
    }

    emitPop(seg,i) {
        this.output.push(pop(seg,i));
    }

    emitBinaryOp(op) {
        this.output.push(bop(op));
    }
    
    emitUnaryOp(op) {
        this.output.push(uop(op));
    }

    emitLabel(lab) {
        this.output.push(label(lab));
    }

    emitGoto(lab) {
        this.output.push(goto(lab));
    }

    emitIf(lab) {
        this.output.push(ifgoto(lab));
    }

    emitFunction(name,local) {
        this.output.push(functiondef(name,local));
    }

    emitCall(name,args) {
        this.output.push(call(name,args));
    }

    emitReturn() {
        this.output.push(returnop());
    }
}
module.exports = VMEmitter;