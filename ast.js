/*
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements.  See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var utils = require("./utils");
var CodeSymTab = require("./symtab").CodeSymTab;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Token
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Error definition
 */
var Error = {
	EOF : "research end of file"
} ;


Error.Syntax = {
	NativeMethodNotBody : "Native Methods don't specify method body"
};


// java keywords
var keywords = [ 
    "abstract",   "continue", 	"for", 			"new", 			"switch",
    "assert",     "default",   	"if",  			"package", 		"synchronized",
    "boolean",    "do",         "goto",         "private",     "this",
    "break",      "double",     "implements",   "protected",   "throw",
    "byte",       "else",       "import",       "public",      "throws",
    "case",       "enum",       "instanceof",   "return",      "transient",
    "catch",      "extends",    "int",          "short",       "try",
    "char",       "final",      "interface",    "static",      "void",
    "class",      "finally",    "long",         "strictfp",    "volatile",
    "const",      "float",      "native",       "super",       "while",
    "null",		  "true",		"false"
] ;

var keywordDict = {} ;

/**
 * lex token
 */
function Token(tk,value) {
	this.tk = tk ;
	this.value = value ;
}

Token.prototype.toString = function() {
	return this.value;
};

Token.EOF = "EOF";
Token.TK_LPAREN = "(";
Token.TK_RPAREN = ")";
Token.TK_LBRACE = "{";
Token.TK_RBRACE = "}";
Token.TK_LBRACKET = "[";
Token.TK_RBRACKET = "]";
Token.TK_SEMI = ";";
Token.TK_COMMA = ",";
Token.TK_DOT = ".";
Token.TK_ELLIPSIS = "...";
Token.TK_EQ = "=";
Token.TK_GT = ">";
Token.TK_LT = "<";
Token.TK_BAND = "!";
Token.TK_TILDE = "~";
Token.TK_QUES= "?";
Token.TK_COLON = ":";
Token.TK_EQEQ = "==";
Token.TK_LTEQ = "<=" ;
Token.TK_GTEQ = ">=" ;
Token.TK_BANDEQ = "!=" ;
Token.TK_AMPAMP = "&&" ;
Token.TK_BARBAR = "||" ;
Token.TK_PLUSPLUS = "++" ;
Token.TK_SUBSUB = "--" ;
Token.TK_PLUS = "+" ;
Token.TK_SUB = "-" ;
Token.TK_STAR = "*" ;
Token.TK_SLASH = "/" ;
Token.TK_AMP = "&" ;
Token.TK_BAR = "|" ;
Token.TK_CARET = "^" ;
Token.TK_PERCENT = "%" ;
Token.TK_LTLT = "<<" ;
Token.TK_GTGT = ">>" ;
Token.TK_GTGTGT = ">>>" ;
Token.TK_PLUSEQ = "+=";
Token.TK_SUBEQ = "-=";
Token.TK_STAREQ = "*=";
Token.TK_SLASHEQ = "/=";
Token.TK_AMPEQ = "&=";
Token.TK_BAREQ = "|=" ;
Token.TK_CARETEQ = "^=";
Token.TK_PERCENTEQ = "%=";
Token.TK_LTLTEQ = "<<=";
Token.TK_GTGTEQ = ">>=";
Token.TK_GTGTGTEQ = ">>>=";
Token.TK_MONKEYS_AT = "@" ;

Token.TK_IntegerLiteral = "IntegerLiteral";
Token.TK_FloatingLiteral = "FloatingLiteral" ;
Token.TK_BooleanLiteral = "BooleanLiteral";
Token.TK_CharacterLiteral = "CharacterLiteral" ;
Token.TK_StringLiteral = "StringLiteral" ;
Token.TK_NullLiteral = "null" ;
Token.TK_Identifier = "Identifier";

// create global keyword definition 
for(var k in keywords) {
	var keyword = keywords[k];
	if(keyword == 'true' || keyword == 'false') {
		keywordDict[keyword] = Token.TK_BooleanLiteral ;
	} else if( keyword == 'null') {
		keywordDict[keyword] = Token.TK_NullLiteral ;
	} else {
		// define var KW_{KEYWORD} = 'keyword' ;
		eval("Token.TK_" + keyword.toUpperCase() + " = '" + keyword + "';");
		eval("keywordDict['" + keyword + "'] = Token.TK_" + keyword.toUpperCase() + ";") ;	
	}
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Access flag
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
var AccessFlag = {};

/**
 * access flag for class declaration
 */
AccessFlag.Class = {
	ACC_PUBLIC:			0x0001,
	ACC_FINAL:			0x0010,
	ACC_SUPER:			0x0020,
	ACC_INTERFACE:		0x0200,
	ACC_ABSTRACT:		0x0400,
	ACC_SYNTHETIC:		0x1000,
	ACC_ANNOTATION:		0x2000,
	ACC_ENUM:			0x4000	
};

/**
 * access flags for field declaration
 */
AccessFlag.Field = {
	ACC_PUBLIC : 		0x0001,
	ACC_PRIVATE: 		0x0002,
	ACC_PROTECTED: 		0x0004,
	ACC_STATIC: 		0x0008,
	ACC_FINAL:			0x0010,
	ACC_VOLATILE:		0x0040,
	ACC_TRANSIENT:		0x0080,
	ACC_SYNTHETIC:		0x1000,
	ACC_ENUM:			0x4000
};

AccessFlag.Method = {
	ACC_PUBLIC:			0x0001,
	ACC_PRIVATE:		0x0002,
	ACC_PROTECTED:		0x0004,
	ACC_STATIC:			0x0008,
	ACC_FINAL:			0x0010,
	ACC_SYNCHRONIZED:	0x0020,
	ACC_BRIDGE:			0x0040,
	ACC_VARARGS:		0x0080,
	ACC_NATIVE:			0x0100,
	ACC_ABSTRACT:		0x0400,
	ACC_STRICT:			0x0800,
	ACC_SYNTHETIC:		0x1000	
};

AccessFlag.InnerClass = {
	ACC_PUBLIC:			0x0001,
	ACC_PRIVATE:		0x0002,
	ACC_PROTECTED:		0x0004,
	ACC_STATIC:			0x0008,
	ACC_FINAL:			0x0010,
	ACC_INTERFACE:		0x0200,
	ACC_ABSTRACT:		0x0400,
	ACC_SYNTHETIC:		0x1000,
	ACC_ANNOTATION:		0x2000,
    ACC_ENUM:			0x4000
};

AccessFlag.is  = function(af,flag){
	return (flag & af) == flag;
};



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Abstract Grammar Tree
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

var AST = {};

AST.Node = function() {
    this.parent = null;
};

/**
 * Qualified identifier
 */
AST.QualifiedIdentifier = function() {
	AST.QualifiedIdentifier.prototype.superClass();
	this.identifiers = []; // for Identifier
};
AST.QualifiedIdentifier.inherited(AST.Node);

AST.QualifiedIdentifier.prototype.toString = function() {
	return this.identifiers.join(".");
};

/**
 * a java source file's everything ...
 */
AST.CompilationUnit = function() {
	AST.CompilationUnit.prototype.superClass();
	this._package = null; // QualifiedIdentifier;
	this.annotations = []; // for Annotation
	this.defs = []; // for ClassDecl
	this.imports = []; // for Import

    this.name = "";
    this.sourcepath = "";
    this.codesym = new CodeSymTab();
};
AST.CompilationUnit.inherited(AST.Node);


/**
 * a import clause;
 */
AST.Import = function() {
	AST.Import.prototype.superClass();
	this.isStatic = false;
	this.wildcard = false;
	this.identifiers = []; // for Identifier
};
AST.Import.inherited(AST.Node);

AST.Import.prototype.toString = function() {
	return this.identifiers.join(".");
};

/**
 * Statement 
 */
AST.Statement = function() {
	AST.Statement.prototype.superClass();
};
AST.Statement.inherited(AST.Node);

/**
 * a expression's base class
 */
AST.Expression = function(){
	AST.Expression.prototype.superClass();
};
AST.Expression.inherited(AST.Node);

/**
 * class/interface/annotation definition
 */
AST.ClassDecl = function() {
	AST.ClassDecl.prototype.superClass();
	
	this.kind = AST.ClassDecl.Kind.Class;
	this.modifiers = [] ; 	// for AST.Modifiers
	this.identifier = null;
	this.typeParams = null;
	this.extendsTypeList = []; 	// for extends Type
	this.implTypeList = [];  	// for implments interfaces
	this.methods = [];
	this.fields = [];

	this.inners = []; 			// for inner AST.ClassDecl
	this.blocks = [];			// for non static blocks
	this.staticBlocks = []; 	// for static blocks
	this.constants = null; 		// for enum only
	
	// for internal usage;
	this.annotations = [];
	this.accessFlag = 0;
	this.name = "";
    this.shortname = "";
    this.extends = null;              // extends super classs
    this.implements = [];           // implements interfaces
};

AST.ClassDecl.inherited(AST.Statement);
AST.ClassDecl.Kind = {
	Interface: 		"interface",
	Class:			"class",
	Enum:			"enum",
	Annotation:		"annotation"
};

/**
 * return this class declaration's name
 * @returns String
 */
AST.ClassDecl.prototype.getName = function(){
	return this.identifier.toString();
};

AST.ClassDecl.prototype.setName = function(fullname){
    this.name = fullname;
    this.shortname = utils.getBaseClassName(fullname);
};

/**
 * get inner class by a short name
 * @param name
 * @return {*}
 */
AST.ClassDecl.prototype.getInnerClassByName = function(shortname){
    for(var k in this.inners){
        var clazz = this.inners[k];
        if(clazz.shortname === shortname) {
            return clazz;
        }
    }
    return null;
};

/**
 * Enum's constant decarlation
 */
AST.EnumConstant = function() {
	AST.EnumConstant.prototype.superClass();
	this.annotations = null;
	this.identifier = null;
	this.args = null;
	this.body = null;
};
AST.EnumConstant.inherited(AST.Statement);

/**
 * Method declaration
 * @constructor
 */
AST.MethodDecl = function(){
	AST.MethodDecl.prototype.superClass();
	this.modifiers = null;
	this.identifier = null;
	this.returnType = null;
	this.params = null; // a chain of AST.Parameter, it point to first parameter, navigate whole params by AST.Paramter.next
	this.throws_ = null;
	this.default_ = null; // used for annotation method only
	this.block = null;
	
	// after syntax visit
	this.accessFlag = 0;
	this.annotations = [];
};
AST.MethodDecl.inherited(AST.Node);

AST.MethodDecl.prototype.isNative = function(){
	return AccessFlag.is(this.accessFlag,AccessFlag.Method.ACC_NATIVE); 
};

AST.MethodDecl.prototype.getName = function(){
    return this.identifier.toString();
};


/**
 * Variable declaration
 * @constructor
 */

AST.VariableDecl = function() {
	AST.VariableDecl.prototype.superClass();
	this.modifiers = null;
	this.identifier = null;
	this.type = null; // variable's type
	this.expr = null;
	this.newArray = null; // this.expr or this.newArray
};
AST.VariableDecl.inherited(AST.Statement);

AST.FieldDecl = function(){
	AST.FieldDecl.prototype.superClass();
	this.vars = [];
};
AST.FieldDecl.inherited(AST.VariableDecl); // extends from VariableDecl

/**
 * A no-op statement ";"
 */
AST.Skip = function(){
	AST.Skip.prototype.superClass();
};
AST.Skip.inherited(AST.Statement);

/**
 * { } block statement 
 */
AST.Block = function(){
	AST.Block.prototype.superClass();
	this.stats = [];
};
AST.Block.inherited(AST.Statement);

AST.StaticBlock = function() {
	AST.StaticBlock.prototype.superClass();
};
AST.StaticBlock.inherited(AST.Block);

/**
 * A do{} while();
 * @constructor
 */
AST.DoWhile = function(){
	AST.DoWhile.prototype.superClass();
    this.body =null;
    this.cond = null;
};
AST.DoWhile.inherited(AST.Statement);

AST.While = function(){
	AST.While.prototype.superClass();
    this.cond = null;
    this.body = null;
};
AST.While.inherited(AST.Statement);

/**
 * a for loop
 */
AST.For = function(){
	AST.For.prototype.superClass();
	this.init = null;
	this.cond = null;
	this.step = null;
	this.body = null;
};
AST.For.inherited(AST.Statement);

/**
 * The enhanced for loop.
 */
AST.EnhancedFor = function(){
	AST.EnhancedFor.prototype.superClass();
	this.var_ = null;
	this.expr = null;
	this.body = null;
};
AST.EnhancedFor.inherited(AST.Statement);

/**
 * A labelled expression or statement.
 */
AST.LabeledStatement = function(){
	AST.LabeledStatement.prototype.superClass();
	this.label = null;
	this.stat = null;
};
AST.LabeledStatement.inherited(AST.Statement);

/**
 * A "switch ( ) { }" construction.
 */
AST.Switch = function(){
	AST.Switch.prototype.superClass();
	this.selector = null;
	this.cases = [];
	this.default_ = null;
};
AST.Switch.inherited(AST.Statement);

/**
 *  A "case  :" of a switch.
 */
AST.Case = function() {
	AST.Case.prototype.superClass();
	this.pat = null;
	this.stat = null;
};
AST.Case.inherited(AST.Statement);

/**
 * A "default :" of a switch
 */
AST.Default = function() {
	AST.Default.prototype.superClass();
};
AST.Default.inherited(AST.Case);

AST.Synchronized = function() {
	AST.Synchronized.prototype.superClass();
    this.lock = null;
    this.body = null;
};
AST.Synchronized.inherited(AST.Statement);


/**
 * A "try { } catch ( ) { } finally { }" block.
 */
AST.Try = function() {
	AST.Try.prototype.superClass();
	this.body = null;
	this.catches = null;
	this.finalizer = null;
	this.resources = null;
};
AST.Try.inherited(AST.Statement);

/**
 * A catch block.
 */
AST.Catch = function() {
	AST.Catch.prototype.superClass();
	this.qualifiedIdents = [];
	this.block = null;
	this.identifier = null;
	this.modifiers = null;
};
AST.Catch.inherited(AST.Statement);

/**
 * A ( ) ? ( ) : ( ) conditional expression
 */
AST.Conditional = function() {
	AST.Conditional.prototype.superClass();
	this.cond = null;
	this.truepart = null;
	this.falsepart = null;
};
AST.Conditional.inherited(AST.Expression);

/**
 * An "if ( ) { } else { }" block
 */
AST.If = function() {
	AST.If.prototype.superClass();
	this.cond = null;
	this.truepart = null;
	this.elsepart = null;
};
AST.If.inherited(AST.Statement);

/**
 * an expression statement
 */
AST.ExpressionStatement = function(){
	AST.ExpressionStatement.prototype.superClass();
	this.expr = null; // statement's internal exprssion;
};
AST.ExpressionStatement.inherited(AST.Statement);

/**
 * a break statement; 
 */
AST.Break = function(){
	AST.Break.prototype.superClass();
	this.label = null;
};
AST.Break.inherited(AST.Statement);

/**
 * continue statement 
 */
AST.Continue = function(){
	AST.Continue.prototype.superClass();
	this.label = null;
};
AST.Continue.inherited(AST.Statement);

AST.Return = function() {
	AST.Return.prototype.superClass();
	this.expr = null;
};
AST.Return.inherited(AST.Statement);

/**
 * A throw (...) statement
 */
AST.Throw = function() {
	AST.Throw.prototype.superClass();
	this.superClass();
	this.expr = null;
};
AST.Throw.inherited(AST.Statement);

AST.Assert = function() {
	AST.Assert.prototype.superClass();
	this.cond = null;
	this.detail = null;
};
AST.Assert.inherited(AST.Statement);

AST.MethodInvocation = function(){
	AST.MethodInvocation.prototype.superClass();
	this.args = null;
	this.parent = null;
	this.identifier = null;
    this.isSuper = false;
};
AST.MethodInvocation.inherited(AST.Expression);

AST.MethodInvocation.prototype.getParentName = function(){
	if(this.parent instanceof Array){
		return this.parent.join(".");
	}
};

/**
 * A new(...) operation.
 */
AST.NewClass = function() {
	AST.NewClass.prototype.superClass();
	this.creatorName = null;
	this.arguments = null;
	this.body = null;
};
AST.NewClass.inherited(AST.Expression);

/**
 * A new array statement;
 */
AST.NewArray = function(){
	AST.NewArray.prototype.superClass();
    this.type = null;
	this.dimCount = null;
	this.initializer = null;
};
AST.NewArray.inherited(AST.Expression);

AST.Parens = function() {
	AST.Parens.prototype.superClass();
	this.expr = null;
};
AST.Parens.inherited(AST.Expression);


/**
 * An assignment with "+=", "|=" ...
 */
AST.AssignOp = function(){
	AST.AssignOp.prototype.superClass();
	this.lexpr = null;
	this.rexpr = null;
	this.op = null;
};
AST.AssignOp.inherited(AST.Expression);

/**
 * Unary operator
 */
AST.Unary = function(){
	AST.Unary.prototype.superClass();
	this.postfixOp = null;
	this.prefixOp = null;
	this.expr = null;
};
AST.Unary.inherited(AST.Expression);

AST.Binary = function(){
	AST.Binary.prototype.superClass();
	this.lexpr = null;
	this.op = null;
	this.rexpr = null;
};
AST.Binary.inherited(AST.Expression);

AST.TypeCast = function(){
	AST.TypeCast.prototype.superClass();
	this.type = null;
	this.expr = null;
};
AST.TypeCast.inherited(AST.Expression);

AST.InstanceOf = function(){
	AST.InstanceOf.prototype.superClass();
	this.expr = null;
	this.clazz = null;
};
AST.InstanceOf.inherited(AST.Expression);

/**
 * a array access 
 * @returns {AST.ArrayAccess}
 */
AST.ArrayAccess = function(){
	AST.ArrayAccess.prototype.superClass();
	this.parent = [];
	this.indexExpr = null;
	this.identifier = null;
    this.isThis = false;
};
AST.ArrayAccess.inherited(AST.Expression);

AST.FieldAccess = function(){
	AST.FieldAccess.prototype.superClass();
	this.identifiers = [];
	this.type = null;
	this.dimCount = null;
	this.dotClass = false;
};
AST.FieldAccess.inherited(AST.Expression);

AST.FieldAccess.prototype.toString = function() {
	return this.identifiers.join(".");
};

/**
 * A XXXX.YYY.this expression
 * @constructor
 */
AST.ThisAccess  = function(){
    AST.ThisAccess.prototype.superClass();
    this.identifiers = null;
};
AST.ThisAccess.inherited(AST.Expression);

AST.Ident = function(){
	AST.Ident.prototype.superClass();
	this.identifiers = [];
};
AST.Ident.inherited(AST.Expression);

AST.Ident.prototype.toString = function() {
	return this.identifiers.join(".");
};	
/**
 * a constant value
 */
AST.Literal = function(){
	AST.Literal.prototype.superClass();
	this.tk = null;
	this.value = null;
};
AST.Literal.inherited(AST.Expression);


/**
 * for Java reference type
 */
AST.ReferenceType = function() {
	AST.ReferenceType.prototype.superClass();
    this.identifiers = [];
    this.args = null;
	this.dimCount = 0;

    // name
    this.name = null;
};
AST.ReferenceType.inherited(AST.Node);

AST.ReferenceType.prototype.toString = function(){
	return this.identifiers.join(".");
};

/**
 * for java basic type
 */
AST.PrimitiveType = function(token){
	AST.PrimitiveType.prototype.superClass();
	this.id = token;
	this.dimCount = 0;
};
AST.PrimitiveType.inherited(AST.Expression);
/**
 * serialize debug string
 */
AST.PrimitiveType.prototype.toString = function() {
	var sb = [];
	sb.push(this.id.toString());
	for(var i = 0 ;i < this.dimCount ++ ;  i ++) {
		sb.push("[]");
	}
	return sb.join("");
};

AST.ArrayTreeType = function(){
	AST.ArrayTreeType.prototype.superClass();
};
AST.ArrayTreeType.inherited(AST.Expression);

/**
 * A parameterized type, T<...>
 */
AST.TypeApply = function(){
	AST.TypeApply.prototype.superClass();
	this.clazz = null;
	this.arguments = null;
};
AST.TypeApply.inherited(AST.Expression);

AST.TypeUnion = function(){
	AST.TypeUnion.prototype.superClass();
};
AST.TypeUnion.inherited(AST.Expression);

AST.TypeParameter = function() {
	AST.TypeParameter.prototype.superClass();
	this.type = null;
	this.extendsFrom = null;
	this.superFrom = null;
};
AST.TypeParameter.inherited(AST.Expression);

AST.Wildcard = function() {
	AST.Wildcard.prototype.superClass();
};
AST.Wildcard.inherited(AST.Expression);

AST.TypeBound = function() {
	AST.TypeBound.prototype.superClass();
};
AST.Wildcard.inherited(AST.Expression);

/**
 * Annotation:
 *   "@" QualifiedIdentifier [ "(" [AnnotationElement] ")" ]
 */
AST.Annotation = function() {
	AST.Annotation.prototype.superClass();
	this.qualifiedId = null; // for qualified identifier
	this.pairs = null; // for ElementValuePairs
	this.value = null; // for ElementValue
	
	this.type = null; // for real Annotation Type
};
AST.Annotation.inherited(AST.Expression);

AST.Annotation.prototype.getName = function(){
	return this.qualifiedId.toString();
};




exports.AST = AST;
exports.AccessFlag = AccessFlag;
exports.Token = Token;
exports.keywordDict = keywordDict;