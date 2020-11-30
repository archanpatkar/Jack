const Tokenizer = require("./tokenizer");
const SymbolTable = require("./symtab");
const VMEmitter = require("./vmcode");

const termend = [")","}","]",";",","];
const bop = ["+","-","*","/","&","|","<",">","="];
const uop = ["-","~"];
const kwc = ["true","false","null","this"];
const kwc_map = {
    "true": 1,
    "false": 0,
    "null": 0
};
const stp = {
    "let": "compileLetStatement",
    "if": "compileIfStatement",
    "while": "compileWhileStatement",
    "do": "compileDoStatement",
    "return": "compileReturnStatement"
};

class Compiler {
    constructor(code) {
        if(code) this.setup(code);
    }

    setup(code) {
        this.code = code;
        this.tok = new Tokenizer(code);
        this.vm = new VMEmitter();
        this.cst = new SymbolTable(null);
        this.mst = new SymbolTable(this.cst);
        this.className = null;
        this.functionName = null;
    }

    expect(val, type) {
        const curr = this.tok.next();
        if(curr.value == val || curr.type == type) return curr;
        throw new SyntaxError(`Expected ${type?type:""} ${val}`);
    }

    compile(code) {
        if(!this.code || code) this.setup(code);
        else throw new Error("No code given!");
        this.compileClass();
        return this.vm.compgen();
    }

    compileClass() {
        this.emit("<class>\n");
        this.expect("class");
        this.className = this.expect(true,"identifier").value;
        this.expect("{");
        let curr = this.tok.peek();
        while(curr.value == "static" || curr.value == "field") {
            this.compileClassVarDec();
            curr = this.tok.peek();
        }
        curr = this.tok.peek();
        while(curr.value == "constructor" || 
              curr.value == "function" || 
              curr.value == "method") {
            this.compileSubroutineDec();    
            curr = this.tok.peek();
        }
        this.expect("}");
        this.emit("</class>\n");
    }

    compileType() {
        let curr = this.tok.peek();
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
        if(this.tok.peek().value !== ")") {
            this.compileType();
            this.expect(true,"identifier");
            let curr = this.tok.peek();
            while(curr.value != ")") {
                this.expect(",");
                this.compileType();
                this.expect(true,"identifier");
                curr = this.tok.peek();
            }
        }
        this.emit("</parameterList>\n");
    }

    compileLetStatement() {
        this.emit("<letStatement>\n");
        this.expect("let");
        const varName = this.expect(true,"identifier").value;
        let curr = this.tok.peek();
        if(curr.value == "[") {
            this.expect("[");
            this.compileExpression();
            this.expect("]");
        }
        this.expect("=");
        this.compileExpression();
        this.expect(";");
        this.emit("</letStatement>\n");
    }

    compileIfStatement() {
        this.emit("<ifStatement>\n");
        this.expect("if");
        this.expect("(");
        this.compileExpression();
        this.expect(")");
        this.expect("{");
        this.compileStatements();
        this.expect("}");
        if(this.tok.peek().value == "else") {
            this.expect("else");
            this.expect("{");
            this.compileStatements();
            this.expect("}");
        }
        this.emit("</ifStatement>\n");
    }

    compileWhileStatement() {
        this.emit("<whileStatement>\n");
        this.expect("while");
        this.expect("(");
        this.compileExpression();
        this.expect(")");
        this.expect("{");
        this.compileStatements();
        this.expect("}");
        this.emit("</whileStatement>\n");
    }

    compileDoStatement() {
        this.emit("<doStatement>\n");
        this.expect("do");
        this.compileSubroutineCall();
        this.expect(";");
        this.emit("</doStatement>\n");
    }

    compileReturnStatement() {
        this.emit("<returnStatement>\n");
        this.expect("return");
        if(this.tok.peek().value !== ";") this.compileExpression();
        this.expect(";");
        this.emit("</returnStatement>\n");
    }

    compileStatements() {
        this.emit("<statements>\n");
        let curr = this.tok.peek();
        while(curr.value in stp) {
            this[stp[curr.value]]();
            curr = this.tok.peek();
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
        if(curr.value == "void") this.emit(this.tok.next());
        else this.compileType();
        const subName = this.expect(true,"identifier").value;
        this.expect("(");
        this.compileParameterList();
        this.expect(")");
        this.compileSubroutineBody();
        this.emit("</subroutineDec>\n");
    }



    compileExpressionList() {
        this.emit("<expressionList>\n");
        let next = this.tok.peek();
        if(next.value !== ")") {
            this.compileExpression();
            next = this.tok.peek();
            while(next.value !== ")") {
                this.expect(",");
                this.compileExpression();
                next = this.tok.peek();
            } 
        }   
        this.emit("</expressionList>\n");
    }

    compileSubroutineCall() {
        const name1 = this.expect(true,"identifier");
        const next = this.tok.peek();
        if(next.value == ".") {
            this.expect(".");
            const name2 = this.expect(true,"identifier");
        }
        this.expect("(");
        this.compileExpressionList();
        this.expect(")");
    }

    compileTerm() {
        this.emit("<term>\n");
        let curr = this.tok.peek();
        if(curr.value == "(") {
            this.expect("(","symbol");
            this.compileExpression();
            this.expect(")");
        }
        else if(uop.includes(curr.value)) {
            this.expect(curr.value);
            this.compileTerm();
        }
        else if(curr.type == "integerConstant") 
            this.expect(true,"integerConstant");
        else if(curr.type == "stringConstant") 
            this.expect(true,"stringConstant");
        else if(kwc.includes(curr.value)) 
        {
            this.expect(true,"keyword");
            if(curr.value in kwc_map) {
                this.vm.emitPush("constant", kwc_map[curr.value]);
                if(curr.value == "true") this.vm.emitUnaryOp("-");
            }
        }
        else if(curr.type == "identifier") {
            let temp = this.tok.peek(1);
            if(temp.value == "(" || temp.value == ".") this.compileSubroutineCall()
            else if(temp.value == "[") {
                const vname = this.expect(true,"identifier");
                this.expect("[");
                this.compileExpression();
                this.expect("]");
            }
            else this.expect(true,"identifier");
        }
        else throw new SyntaxError("Something wrong!");
        this.emit("</term>\n");
    }


    compileExpression() {
        this.emit("<expression>\n");
        this.compileTerm();
        let curr = this.tok.peek();
        while(bop.includes(curr.value)) {
            this.expect(curr.value,"symbol");
            if(!termend.includes(this.tok.peek().value)) 
                this.compileTerm();
            curr = this.tok.peek();
        }
        this.emit("</expression>\n");
    }
}

function main(args) {
    if(fs.existsSync(args[0]) && fs.lstatSync(args[0]).isDirectory()) {
        const files = fs.readdirSync(args[0]).filter(f => f.endsWith(".jack"));
        const path = args[0].endsWith("/")?args[0]:`${args[0]}/`;
        console.log("Reading...");
        const data = files.map(file => {
            console.log(file);
            const filename = file.split(".")[0];
            const code = fs.readFileSync(`${path}${file}`).toString();
            const compiler = new Compiler(code);
            const output = compiler.compile();
            fs.writeFileSync(`${path}${filename}T.xml`,compiler.tok.out);
            fs.writeFileSync(`${path}${filename}.xml`,output);
        });
    }
    else {
        console.log("Reading...");
        const dirs = args[0].split("/");
        const filename = dirs[dirs.length-1].split(".")[0];
        const code = fs.readFileSync(args[0]).toString();
        const compiler = new Compiler(code);
        const output = compiler.compile();
        dirs.pop();
        const path = dirs.join("/");
        fs.writeFileSync(`${path}/${filename}T.xml`,compiler.tok.out);
        fs.writeFileSync(`${path}/${filename}.xml`,output);
    }
}

main(process.argv.slice(2));
module.exports = Compiler;