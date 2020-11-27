const lexer = require("./lexer");

class Tokenizer {
    constructor(code) {
        this.tokens = lexer(code);
    }
    peek() { return this.tokens[0]; }
    next() { return this.tokens.shift(); }
}

const special = ["<",">",'"',"&"];
const map = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "&": "&amp;"
}
const token_val = (token) => special.includes(token.value)?map[token.value]:token.value;


class Compiler {
    constructor(code) {
        if(code) {
            this.code = code;
            this.tok = new Tokenizer(code);
        }
        this.output = "";
    }

    emit(cmd) {
        if(cmd instanceof Object) {
            this.output += `<${token.type}> ${token_val(token)} </${token.type}>\n`;
        }
        this.output += cmd;
    }

    expect(val, type) {
        const curr = this.tok.next();
        if(curr.value == val || curr.type == type) 
        {
            this.emit(curr);
            return curr;
        }
        throw new SyntaxError(`Expected ${type?type:""} ${val}`);
    }

    compile(code) {
        if(this.code) {
            this.code = code;
            this.tok = new Tokenizer(code);
        }

    }

    compileClass() {
        this.emit("<class>\n");
        this.expect("class");
        const className = this.expect(true,"identifier").value;
        // this.emit(`<identifier> ${className} </identifier>\n`);
        this.expect("{");
        let curr = this.tok.peek();
        while(curr.value == "static" || curr.value == "field")
            this.compileClassVarDec();
        curr = this.tok.peek();
        while(curr.value == "constructor" || 
              curr.value == "function" || 
              curr.value == "method"
            )
            this.compileSubroutineDec();    
        this.expect("}");
        this.emit("</class>\n");
    }

    compileClassVarDec() {
        this.emit("<classVarDec>\n");
        this.tok.next();

    }


}


module.exports = Compiler;