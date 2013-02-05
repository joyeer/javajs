var Token = require("../ast").Token;
var AST = require("../ast").AST;
var Lexer = require("../lexer").Lexer;
var Parser = require("../parser").Parser;
var fs = require("fs") ;

function parseContent(path) {
	var content = fs.readFileSync(path).toString() ;
	
	var lexer = new Lexer();
	lexer.parse(content);
	
	var g = new Parser(lexer.getVisitor());
	return g.parse();
}

exports.test_openjdk_abstract_T4717181a = function(test) {
	var unit = parseContent("tests/data/openjdk/abstract/T4717181a.java");
	test.ok(unit.defs[0].inners.length,3);
	test.ok(unit.defs[0].inners[0].identifier.toString(),"C");
	test.ok(unit.defs[0].inners[1].identifier.toString(),"I");
	test.ok(unit.defs[0].inners[2].identifier.toString(),"D");
	test.done();
};

exports.test_openjdk_abstract_T4717181b = function(test) {
	var unit = parseContent("tests/data/openjdk/abstract/T4717181b.java");
	test.equals(unit.defs[0].inners.length,6);
	test.equals(unit.defs[0].inners[5].blocks.length,1);
	test.ok(unit.defs[0].inners[5].blocks[0].stats[0] instanceof AST.Try);
	test.done();
};

exports.test_openjdk_annotations_T71043371 = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/T7043371.java");
	test.ok(unit.defs[1].fields[0].modifiers[0] instanceof AST.Annotation);
	test.equals(unit.defs[1].fields[0].modifiers[0].qualifiedId.toString(),"Anno");
	test.equals(unit.defs[1].fields[0].modifiers[0].pairs[0][0].toString(),"value");
	test.equals(unit.defs[1].fields[0].modifiers[0].pairs[0][1].toString(),"A.a");
	test.done();
} ;

exports.test_openjdk_annotations_T7073477 = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/T7073477.java");
	test.ok(unit.defs[0].modifiers[0] instanceof AST.Annotation);
	test.equals(unit.defs[0].modifiers[0].value.toString(),"T7073477A.S");
	test.done();
};

exports.test_openjdk_annotations_TestAnnotationPackageInfo = function(test) {
	//TODO: add later
	
	test.done();
};

exports.test_openjdk_annotations_6214965_CompilerAnnotationTest = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/6214965/CompilerAnnotationTest.java");
	test.ok(unit.defs[0].modifiers[0] instanceof AST.Annotation);
	
	test.ok(unit.defs[0].modifiers[0].value instanceof AST.Annotation);
	
	test.equals(unit.defs[0].modifiers[0].value.pairs[0][0].toString(),"name");
	test.equals(unit.defs[0].modifiers[0].value.pairs[0][1].value.toString(),"\"test\"");
	test.equals(unit.defs[0].modifiers[0].value.pairs[1][0].toString(),"name2");
	test.equals(unit.defs[0].modifiers[0].value.pairs[1][1].value.toString(),"\"test2\"");
	test.done();
};

exports.test_openjdk_annotations_pos_ClassA = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/pos/ClassA.java");
	test.ok(unit.defs[0] instanceof AST.ClassDecl);
	test.ok(unit.defs[0].methods[0].default_ instanceof AST.FieldAccess);
	test.equals(unit.defs[0].methods[0].default_.type.toString(),"int");
	test.equals(unit.defs[0].methods[0].default_.dotClass,true);
	test.done();
};

exports.test_openjdk_annotations_pos_ClassB = function(test) {
	// TODO: add this test case later
	test.done();
};

exports.test_openjdk_annotations_pos_Local = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/pos/Local.java");
	test.ok(unit.defs[0] instanceof AST.ClassDecl);
	test.ok(unit.defs[0].blocks[0] instanceof AST.Block);
	test.ok(unit.defs[0].blocks[0].stats[0] instanceof AST.VariableDecl);
	test.equals(unit.defs[0].blocks[0].stats[0].identifier.toString(),"x");
	test.done();
};

exports.test_openjdk_annotations_pos_Members = function(test){
	var unit = parseContent("tests/data/openjdk/annotations/pos/Members.java");
	test.ok(unit.defs[0].inners[0] instanceof AST.ClassDecl);
	test.done();
};

exports.test_openjdk_annotations_pos_Primitives = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/pos/Primitives.java");
	test.ok(unit.defs[0].inners.length,5);
	
	test.equals(unit.defs[0].inners[3].modifiers.length,3);
	test.equals(unit.defs[0].inners[3].modifiers[1].pairs.length,11 );
	test.done();
};

exports.test_openjdk_annotations_pos_Parameter = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/pos/Parameter.java");
	test.equals(unit.defs[0].kind, AST.ClassDecl.Kind.Annotation);
	test.equals(unit.defs[1].kind, AST.ClassDecl.Kind.Class);
	
	test.ok(unit.defs[1].methods[1].block.stats[0] instanceof AST.EnhancedFor);
	test.done();
};

exports.test_openjdk_annotations_6365854_T6365854 = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/6365854/T6365854.java");
	
	test.ok(unit.defs[0].methods[0].block.stats[1].expr instanceof AST.MethodInvocation);
	test.ok(unit.defs[0].methods[0].block.stats[1].expr.args[0] instanceof AST.MethodInvocation);
	test.done();
};

exports.test_openjdk_annotations_6550655_T6550655 = function(test) {
	var unit = parseContent("tests/data/openjdk/annotations/6550655/T6550655.java");
	test.equals(unit.defs[0].methods.length,7);
	test.equals(unit.defs[0].inners.length,4);
	test.equals(unit.defs[0].fields.length,6);
	test.done();
};

exports.test_openjdk_enum_AbstractEmptyEnum = function(test) {
	var unit = parseContent("tests/data/openjdk/enum/AbstractEmptyEnum.java");
	test.ok(unit.defs[0] instanceof AST.ClassDecl);
	test.equals(unit.defs[0].constants,null);
	test.equals(unit.defs[0].identifier.toString(),"AbstractEmptyEnum");
	test.equals(unit.defs[0].methods[0].identifier.toString(),"m");
	test.done();
}; 

exports.test_openjdk_enum_AbstractEnum1 = function(test) {
	var unit = parseContent("tests/data/openjdk/enum/AbstractEnum1.java");
	test.equals(unit.defs[0].kind,AST.ClassDecl.Kind.Enum);
	test.ok(unit.defs[0].constants[0].body instanceof AST.ClassDecl);
	test.ok(unit.defs[0].methods[0].block.stats[0] instanceof AST.If);
	test.ok(unit.defs[0].methods[0].block.stats[0].truepart instanceof AST.Throw);
	test.ok(unit.defs[0].methods[0].block.stats[0].cond.expr instanceof AST.Unary);
	test.done();
};


exports.test_openjdk_cast_BoxedArray = function(test) {
	var unit = parseContent("tests/data/openjdk/cast/BoxedArray.java");
	test.ok(unit.defs[0].methods[0].block.stats[0].expr.rexpr instanceof AST.TypeCast);
	test.equals(unit.defs[0].methods[0].block.stats[0].expr.rexpr.type.id,"int");
	test.equals(unit.defs[0].methods[0].block.stats[0].expr.rexpr.type.dimCount,1);
	test.equals(unit.defs[0].methods[0].block.stats[0].expr.rexpr.expr.identifiers[0].value,"a1");
	test.done();
};

exports.test_openjdk_cast_forum_T654170 = function(test) {
	var unit = parseContent("tests/data/openjdk/cast/forum/T654170.java");
	test.equals(unit.defs.length,3);
	test.ok(unit.defs[0].methods[0].block.stats[0].type.args[0] instanceof AST.TypeParameter);
	test.ok(unit.defs[0].methods[0].block.stats[1].cond.expr instanceof AST.InstanceOf );
	test.done();
};


exports.test_openjdk_boxing_NoBoxingDouble = function(test) {
	var unit = parseContent("tests/data/openjdk/boxing/NoBoxingDouble.java");
	test.equals(unit.defs[0].fields[0].expr.tk,Token.TK_FloatingLiteral);
	test.equals(unit.defs[0].fields[0].expr.value,"0");
	test.done();
};

exports.test_openjdk_boxing_BoxingCaching = function(test){
	var unit = parseContent("tests/data/openjdk/boxing/BoxingCaching.java");
	test.equals(unit.defs[0].methods.length,7);
	test.equals(unit.defs[0].methods[0].block.stats[1].expr.dims[0].value,"2" );
	test.done();
};

exports.test_openjdk_boxing_5043020 = function(test) {
	var unit = parseContent("tests/data/openjdk/cast/5043020/T5043020.java");
	test.equals(unit.defs[0].methods[0].returnType.length,3);
	test.ok(unit.defs[0].methods[0].returnType[0] instanceof AST.TypeParameter);
	test.ok(unit.defs[0].methods[0].returnType[1] instanceof AST.TypeParameter);
	test.ok(unit.defs[0].methods[0].returnType[2] instanceof AST.TypeParameter);
	test.done();
};

exports.test_openjdk_cast_6219964 = function(test){
	var unit = parseContent("tests/data/openjdk/cast/6219964/T6219964.java");
	test.ok(unit.defs[0].methods[0].block.stats[0].expr instanceof AST.NewClass);
	test.done();
};

exports.test_openjdk_cast_6256789 = function(test){
	var unit = parseContent("tests/data/openjdk/cast/6256789/T6256789.java");
	test.equals(unit.defs[0].methods.length,1);
	test.equals(unit.defs[0].inners.length,1);
	test.done();
};

exports.test_openjdk_cast_6557182 = function(test){
	var unit = parseContent("tests/data/openjdk/cast/6557182/T6557182.java");
	test.equals(unit.defs[0].methods.length,2);
	test.done();
};

exports.test_openjdk_AccessMethods_ChainedAssignment = function(test){
	var unit = parseContent("tests/data/openjdk/AccessMethods/ChainedAssignment.java");
	test.equals(unit.defs[0].inners[0].methods.length,2);
	test.ok(unit.defs[0].inners[0].methods[0].block.stats[0].expr instanceof AST.AssignOp);
	test.done();
};