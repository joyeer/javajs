var utils = require('./utils');
var SymTab = require("./symtab").SymTab;
var ASTWalker = require("./walker").ASTWalker;
var SymVisitor = require("./sym").SymVisitor;
var ASTPrinter = require("./printer").ASTPrinter;
var Parser = require("./parser").Parser;
var Lexer = require('./lexer').Lexer;
var fs = require("fs");
var TypeChecker = require('./TypeChecker').TypeChecker;

/**
 * Compiler for java to javascirpt
 * @constructor
 */
function Compiler(){
    this._units = [];
    this._symTab = new SymTab();
}

Compiler.prototype.compileFolder = function(folder){
    var folders = utils.listFolderSync(folder);
    var units = [];
    for(var k in folders){
        var f = folders[k];
        if(f.endsWith(".java")){
            var unit = this._compile(f);
            unit.sourcepath = f;
            this._units.push(unit);
            units.push(unit);
        }
    }

    // visit unit for AST syntax checking
    for(var k in units){
        new ASTWalker(units[k]).visit(new SymVisitor(this._symTab));
    }

    for(var k in units){
        new ASTWalker(units[k]).visit(new TypeChecker(this._symTab));
    }
};

/**
 * compiling a file, do syntax checking
 */
Compiler.prototype.compileFile = function(path){
    var unit = this._compile(path);
    this._units.push(unit);
    unit.sourcepath = path;
    new ASTWalker(unit).visit(new SymVisitor(this._symTab));
    new ASTPrinter().print(unit);
};

/**
 * compiling a single unit
 */
Compiler.prototype._compile = function(path){
    try {
        var content = fs.readFileSync(path).toString() ;
        var lexer = new Lexer() ;
        lexer.parse(content);
        var parser = new Parser(lexer.getVisitor()) ;
        var unit =  parser.parse();
        if(unit.defs.length == 0 && !path.endsWith("package-info.java")) {
            console.log("error:" + path);
        }
        return unit;
    }catch (e){
        console.log("compiling error:" + path  + " :" + e);
    }
    return null;
};

var usage = "Usage:" +
    "\t folder/file --output folder";


if( require.main == module) {

    var compiler = new Compiler();
    var path = process.argv[2];

    if(utils.isDirectory(path)) {
        compiler.compileFolder(path);
    } else {
        compiler.compileFile(path);
    }
}
