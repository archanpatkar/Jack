const { threadId } = require("worker_threads");
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
            this.output += `<${cmd.type}> ${token_val(cmd)} </${cmd.type}>\n`;
        }
        else this.output += cmd;
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

    compileType() {
        let curr = this.tok.next();
        if(curr.value == "int") this.expect("int");
        else if(curr.value == "char") this.expect("char");
        else if(curr.value == "boolean") this.expect("boolean");
        else this.expect(true,"identifier");
    }

    compileClassVarDec() {
        this.emit("<classVarDec>\n");
        this.emit(this.tok.next());
        this.compileType();
        const varName = this.expect(true,"identifier").value;
        let curr = this.tok.peek();
        while(curr.value != ";") {
            this.expect(",");
            this.expect(true,"identifier");
            curr = this.tok.peek();
        }
        this.expect(";");
        this.emit("</classVarDec>\n");
    }

    compileParameterList() {
        this.emit("<parameterList>\n");
        this.expect("(");
        this.compileType();
        this.expect(true,"identifier");
        let curr = this.tok.peek();
        while(curr.value != ")") {
            this.expect(",");
            this.compileType();
            this.expect(true,"identifier");
            curr = this.tok.peek();
        }
        this.expect(")");
        this.emit("</parameterList>\n");
    }

    stp = {
        "let": "compileLetStatement",
        "if": "compileIfStatement",
        "while": "compileWhileStatement",
        "do": "compileDoStatement",
        "return": "compileReturnStatement"
    };

    compileLetStatment() {

    }

    compileIfStatment() {
        
    }

    compileWhileStatment() {
        
    }

    compileDoStatment() {
        this.expect("do");
        
    }

    compileReturnStatment() {
        this.expect("return");
        this.compileExpression();
        this.expect(";");
    }

    compileStatements() {
        this.emit("<statements>\n");
        let curr = this.tok.peek();
        while(stp in curr.value) {
            this[stp[curr.value]]();
        }
        this.emit("</statements>\n");
    }

    compileVarDec() {
        this.emit("<varDec>\n");
        this.expect("var");
        this.compileType();
        this.expect(true,"identifier");
        let curr = this.tok.peek();
        while(curr.value != ";") {
            this.expect(",");
            this.expect(true,"identifier");
            curr = this.tok.peek();
        }
        this.expect(";");
        this.emit("</varDec>\n");
    }

    compileSubroutineBody() {
        this.emit("<subroutineBody>\n");
        this.expect("{");
        let curr = this.tok.peek();
        while(curr.value == "var") {
            this.compileVarDec();
            curr = this.tok.peek();
        }
        this.compileStatements();
        this.expect("}");
        this.emit("</subroutineBody>\n");
    }

    compileSubroutineDec() {
        this.emit("<subroutineDec>\n");
        this.emit(this.tok.next());
        let curr = this.tok.peek();
        if(curr.value == "void") this.tok.next();
        else this.compileType();
        const subName = this.expect(true,"identifier").value;
        this.compileParameterList();
        this.compileSubroutineBody();
        this.emit("</subroutineDec>\n");
    }

}


module.exports = Compiler;