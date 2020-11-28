const fs = require("fs");
const tokenizer = require("./lexer");

function main(args)
{
    const name = args[0].split(".")[0];
    const code = fs.readFileSync(`./${args[0]}`).toString();
    console.log(code);
    const tokens = tokenizer(code);
    console.log(tokens);
    const special = ["<",">",'"',"&"];
    const map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "&": "&amp;"
    }
    const token_val = (token) => special.includes(token.value)?map[token.value]:token.value;
    let output = "<tokens>\n";
    for(let token of tokens) 
        if(token.type != "EOF") output += `<${token.type}> ${token_val(token)} </${token.type}>\n`;
        else break;
    output += "</tokens>";
    fs.writeFileSync(`./${name}T.xml`,output);
}


main(process.argv.slice(2));