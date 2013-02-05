
var Visitor = require("./visitor").Visitor;

var TAB = "    ";
var NA = "N/A";
var dbgTab = 0;

function debugPrint(message){
    var sb = [];
    for(var i = 0 ; i < dbgTab  ; i ++){
        sb.push(TAB);
    }
    sb.push(message);
    console.log(sb.join(""));
};

var incTab = function(){ dbgTab ++;};
var decTab = function(){ dbgTab --;};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AST tree printer
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ASTPrinter() {
}

ASTPrinter.prototype.print = function(unit){
    debugPrint("Package: " + unit.pkgname) ;
    incTab();

    for(var k in unit.defs){
        var decl = unit.defs[k];
        this._printClass(decl);
    }
    decTab();
};

ASTPrinter.prototype._printClass = function(decl){
    debugPrint("Class: " + decl.getName());
    incTab();
    debugPrint("AccessFlag: " + decl.modifiers.join(" "));

    for(var k in decl.methods){
        this._printMethod(decl.methods[k]);
    }
    decTab();
};

ASTPrinter.prototype._printMethod = function(decl){
    debugPrint("Method: " + decl.getName());
    incTab();
    if(decl.params != null) {
        var sb =  [];
        for(var k in decl.params){
            var param = decl.params[k];
        }
        debugPrint("Parameters:" + sb.join(""));
    }

    decTab();
};

exports.ASTPrinter = ASTPrinter;
