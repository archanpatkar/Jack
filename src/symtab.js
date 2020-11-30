class SymbolTable {
    constructor(parent) {
        this.parent = parent;
        this.table = {};
        this.kindcount = {};
    }

    reset() {
        this.table = {};
        this.kindcount = {};
    }

    calc(kind) {
        if(this.kindcount[kind]) this.kindcount[kind] = 0;
        return this.kindcount[kind]++;
    }

    define(name,type,kind) {
        this.table[name] = {
            type: type,
            kind: kind,
            index: this.calc(kind)
        };
    }

    kind(name) {
        if(!this.table[name]) {
            if(this.parent) return this.parent.kind(name);
            else throw new Error("No such symbol!");
        }
        return this.table[name].kind;
    }

    type(name) {
        if(!this.table[name]) {
            if(this.parent) return this.parent.type(name);
            else throw new Error("No such symbol!");
        }
        return this.table[name].type;
    }

    index(name) {
        if(!this.table[name]) {
            if(this.parent) return this.parent.index(name);
            else throw new Error("No such symbol!");
        }
        return this.table[name].index;
    }
}

module.exports = SymbolTable;