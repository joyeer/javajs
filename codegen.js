var fs = require("fs") ;
var Lexer = require("./parser").Lexer;

var Token = require("./ast").Token;
var AST = require("./ast").AST;
var AccessFlag = require("./ast").AccessFlag;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Js code generator
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function JsGenerator(){
	this._tab = 0;
	this._code = [];
};

JsGenerator.TAB = "    ";

JsGenerator.prototype.getCode = function(){
	return this._code.join("");
};

/**
 * inc tab
 */
JsGenerator.prototype._inc = function() {
	this._tab ++ ;
};

/**
 * dec tab
 */
JsGenerator.prototype._dec = function(){
	this._tab --;
};

JsGenerator.prototype._print = function(message){
	this._code.push(message);
};

JsGenerator.prototype._ret = function(flag){
	this._code.push("\n");
	if(flag) {
		for(var i = 0 ; i < this._tab ; i ++ ){
			this._code.push(JsGenerator.TAB);
		}
	}
};

JsGenerator.prototype.generate = function(unit){
	this._unit = unit;
	this.curPackage = "";
	return this._visit(unit);
};

JsGenerator.prototype._visit = function(unit){
	var sb = [];
	for(var k in unit.defs) {
		// navigate ClassDecl
		var decl = unit.defs[k];
		sb.push(this._emitClass(decl));
	}
	return sb.join("");
};

JsGenerator.prototype._emitClass = function(decl){
	this._declClass(decl.getName());
	this._beginBlock();
	this._ret();
	this._endBlock(true);
	this._ret();
	
	if(decl.methods != null) {
		for(var k in decl.methods){
			var method = decl.methods[k];
			this._emitMethod(decl,method);
		}
	}
};

JsGenerator.prototype._emitMethod = function(parentDecl,decl) {
	
	var staticMethod = AccessFlag.is(decl.accessFlag,AccessFlag.Method.ACC_STATIC);
	this._print(parentDecl.getName());
	if(!staticMethod) {
		this._print (".prototype");
	}
	this._print( "." + decl.identifier.toString() + " = function()");
	
	// analyze parameters
	
	if(decl.block != null){
		this._beginBlock();
		this._inc();
		this._ret(true);
		if(decl.block.stats != null){
			for(var k in decl.block.stats){
				this._emitStatement(decl.block.stats[k]);
			}
		}
		this._dec();
		this._endBlock(true);
	}
};

JsGenerator.prototype._emitStatement = function(stat){
	if(stat instanceof AST.ExpressionStatement){
		this._emitExprStatement(stat);
		this._ret();
	}
};

JsGenerator.prototype._emitExpr = function(expr){
	if(expr instanceof AST.Literal){
		this._emitLiteral(expr);
	}
};

JsGenerator.prototype._emitLiteral = function(expr){
	this._print(expr.value);
};

JsGenerator.prototype._emitExprStatement = function(stat){
	var expr = stat.expr;
	if(expr instanceof AST.MethodInvocation){
		this._emitMethodInvocation(expr);
	} else {
		throw "Not implment";
	}
};

JsGenerator.prototype._emitMethodInvocation = function(expr){
	var parent = expr.getParentName();
	if(parent != null){
		this._print(parent);
		this._print(".");
		this._print(expr.identifier.toString());
		this._print("(");
		this._emitPassedArgs(expr.args);
		this._print(")");
		this._print(";");
	}
};

/**
 * pass method invocation's passed args
 */
JsGenerator.prototype._emitPassedArgs = function(args){
	if(args != null){
		for(var i = 0 ;i < args.length ; i ++) {
			if(i > 0){
				this._print(",");
			}
			this._emitExpr(args[i]);
		}
	}
};

JsGenerator.prototype._isValidJsFunction = function(func){
	return func != undefined && func != null && typeof func == "Function";
};

JsGenerator.prototype._declClass = function(name){
	this._print("function " + name + "()") ;
};

JsGenerator.prototype._beginBlock = function(){
	this._print("{");
};

JsGenerator.prototype._endBlock = function(flag){
	this._print("}" + (flag ? ";":""));
};



