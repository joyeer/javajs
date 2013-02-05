var Lexer = require("../lexer").Lexer;
var Token = require("../ast").Token;
var Parser = require("../parser").Parser;
var AST = require("../ast").AST;
var fs = require("fs") ;


function parseContent(path) {
	var content = fs.readFileSync(path).toString() ;
	
	var lexer = new Lexer();
	lexer.parse(content);
	
	var g = new Parser(lexer.getVisitor());
	return g.parse();
}


exports.test_0100 = function(test) {
	
	var unit = parseContent("tests/data/0100.txt");
	
	
	// check package
	test.equals(unit._package.toString(),"package1.package2","check the package name");
	
	
	// check imports
	test.equals(unit.imports.length,4,"we decl 4 import ");
	test.equals(unit.imports[0].toString(),"java.util.Vector","first import");
	test.equals(unit.imports[0].wildcard,false);
	test.equals(unit.imports[0].isStatic,false);
	test.equals(unit.imports[1].toString(),"java.util","first import");
	test.equals(unit.imports[1].wildcard,true);
	test.equals(unit.imports[1].isStatic,false);
	test.equals(unit.imports[2].toString(),"java.util.x","first import");
	test.equals(unit.imports[2].wildcard,false);
	test.equals(unit.imports[2].isStatic,true);
	test.equals(unit.imports[3].toString(),"java.util","first import");
	test.equals(unit.imports[3].wildcard,true);
	test.equals(unit.imports[3].isStatic,true);
	
	
	// check class :
	
	/**
	 * abstract class Point {
	 * 	int x = 1, y = 1;
	 * }
	 */
	test.ok(unit.defs[0] instanceof AST.ClassDecl,"check the type");
	test.equals(unit.defs[0].kind,AST.ClassDecl.Kind.Class);
	test.equals(unit.defs[0].modifiers.length,1,"check modifers");
	test.equals(unit.defs[0].modifiers[0],Token.TK_ABSTRACT);
	test.equals(unit.defs[0].identifier.toString(),"Point");
	
	var fields = unit.defs[0].fields;
	test.equals(fields.length,1);
	// check field: int x = 1, y = 1;
	test.equals(fields[0].type.toString(),"int");
	test.equals(fields[0].identifier.toString(),"x");
	test.ok(fields[0].expr instanceof AST.Literal);
	test.equals(fields[0].expr.value,"1");
	test.equals(fields[0].vars.length,1);
	test.equals(fields[0].vars[0].identifier.toString(),"y");
	test.ok(fields[0].vars[0].expr instanceof AST.Literal);
	test.ok(fields[0].vars[0].expr.value,"1");
	/**
	 * abstract class ColoredPoint extends Point {
	 * 		int color;
	 * }
	 */
	
	test.ok(unit.defs[1] instanceof AST.ClassDecl);
	test.equals(unit.defs[1].kind,AST.ClassDecl.Kind.Class);
	test.equals(unit.defs[1].modifiers.length,1);
	test.equals(unit.defs[1].modifiers[0],Token.TK_ABSTRACT);
	test.equals(unit.defs[1].identifier.toString(),"ColoredPoint");
	test.equals(unit.defs[1].extendsTypeList.length,1);
	test.equals(unit.defs[1].extendsTypeList[0].toString(),"Point");
	
	test.equals(unit.defs[1].fields.length,1);
	var field = unit.defs[1].fields[0];
	test.equals(field.type.toString(),"int");
	test.equals(field.identifier.toString(),"color");
	
	/**
	 * class SimplePoint extends Point {
	 * }
	 */
	test.ok(unit.defs[2] instanceof AST.ClassDecl);
	test.equals(unit.defs[2].kind,AST.ClassDecl.Kind.Class);
	test.equals(unit.defs[2].modifiers.length,0);
	test.equals(unit.defs[2].identifier.toString(),"SimplePoint");
	test.equals(unit.defs[2].extendsTypeList.length,1);
	test.equals(unit.defs[2].extendsTypeList[0].toString(),"Point");
	
	/**
	 * interface Colorable {
	 *	void setColor(int color);
	 * }
	 */
	//check class defintaion
	
	test.ok(unit.defs[3] instanceof AST.ClassDecl,"check interface Colorable");
	test.equals(unit.defs[3].kind,AST.ClassDecl.Kind.Interface);
	test.equals(unit.defs[3].modifiers.length,0);
	test.equals(unit.defs[3].identifier.toString(),"Colorable");
	
	test.equals(unit.defs[3].methods.length,1);
	test.equals(unit.defs[3].methods[0].identifier.toString(),"setColor");
	var parameter = unit.defs[3].methods[0].params;
	test.equals(parameter[0].identifier.toString(),"color");
	test.equals(parameter[0].type.toString(),"int");
	test.equals(parameter[0].returnType,null);
	
	/**
	 * 
	 * abstract class Colored implements Colorable {
	 * 	public abstract int setColor(int color);
     * }
	 */
	test.ok(unit.defs[4] instanceof AST.ClassDecl);
	test.equals(unit.defs[4].kind, AST.ClassDecl.Kind.Class);
	test.equals(unit.defs[4].modifiers.length,1);
	test.equals(unit.defs[4].modifiers[0],Token.TK_ABSTRACT);
	test.equals(unit.defs[4].identifier.toString(),"Colored");
	test.equals(unit.defs[4].implTypeList.length,1);
	test.equals(unit.defs[4].implTypeList[0].toString(),"Colorable");
	
	// check: public abstract int setColor(int color);
	test.equals(unit.defs[4].methods.length,1);
	test.equals(unit.defs[4].methods[0].identifier.toString(),"setColor");
	test.equals(unit.defs[4].methods[0].modifiers.length,2);
	test.equals(unit.defs[4].methods[0].modifiers[0],"public");
	test.equals(unit.defs[4].methods[0].modifiers[1],"abstract");
	test.equals(unit.defs[4].methods[0].returnType.toString(),"int");
	var parameter = unit.defs[4].methods[0].params;
	test.equals(parameter[0].identifier.toString(),"color");
	test.equals(parameter[0].type.toString(),"int");
	
	
	/**
	 * public final class Math {
     * }
	 */
	test.ok(unit.defs[5] instanceof AST.ClassDecl);
	test.equals(unit.defs[5].kind, AST.ClassDecl.Kind.Class);
	test.equals(unit.defs[5].modifiers.length,2);
	test.equals(unit.defs[5].modifiers[0],Token.TK_PUBLIC);
	test.equals(unit.defs[5].modifiers[1],Token.TK_FINAL);
	
	
	
	
	test.done();
	
} ;

exports.test_0109_interfaces = function(test) {
	var unit = parseContent("tests/data/0109_interfaces.txt");
	
	
	/**
	 * interface BaseColors extends BaseColors , PrintColors {
     *    int RED = 1, GREEN = 2, BLUE = 4, CHARTREUSE = RED+90;
	 * }
	 */
	test.ok(unit.defs[0] instanceof AST.ClassDecl);
	test.equals(unit.defs[0].kind,AST.ClassDecl.Kind.Interface);
	test.equals(unit.defs[0].extendsTypeList.length,2);
	test.equals(unit.defs[0].extendsTypeList[0].toString(),"BaseColors");
	test.equals(unit.defs[0].extendsTypeList[1].toString(),"PrintColors");
	test.equals(unit.defs[0].fields[0].type.toString(),"int");
	test.equals(unit.defs[0].fields[0].identifier.toString(),"RED");
	test.equals(unit.defs[0].fields[0].expr.value,"1");
	test.equals(unit.defs[0].fields[0].vars[0].identifier.toString(),"GREEN");
	test.equals(unit.defs[0].fields[0].vars[0].expr.value,"2");
	test.equals(unit.defs[0].fields[0].vars[1].identifier.toString(),"BLUE");
	test.equals(unit.defs[0].fields[0].vars[1].expr.value,"4");
	test.equals(unit.defs[0].fields[0].vars[2].identifier.toString(),"CHARTREUSE");
	test.equals(unit.defs[0].fields[0].vars[2].expr.lexpr.toString(),"RED");
	test.equals(unit.defs[0].fields[0].vars[2].expr.rexpr.value.toString(),"90");
	test.equals(unit.defs[0].fields[0].vars[2].expr.op.toString(),"+");
	
	
	/**
	 * interface Test {
     * 	float f = j;
     *	int   j = 1;
     *	int   k = k + 1;
	 * }
	 */
	
	var decl = unit.defs[1];
	test.ok(decl instanceof AST.ClassDecl);
	test.equals(decl.kind,AST.ClassDecl.Kind.Interface);
	test.equals(decl.fields[0].identifier.toString(),"f");
	test.equals(decl.fields[0].type,"float");
	test.equals(decl.fields[0].expr,"j");
	test.equals(decl.fields[1].identifier,"j");
	test.equals(decl.fields[1].type,"int");
	test.equals(decl.fields[1].expr.value,"1");
	test.equals(decl.fields[2].identifier,"k");
	test.equals(decl.fields[2].type,"int");
	test.equals(decl.fields[2].expr.lexpr,"k");
	test.equals(decl.fields[2].expr.rexpr.value,"1");
	test.equals(decl.fields[2].expr.op,"+");
	
	/**
	 * interface InfiniteBuffer extends Buffer {
     * 	char get() throws BufferException, BufferException2;  // override
	 * }
	 */
	decl = unit.defs[2];
	
	test.equals(decl.kind,AST.ClassDecl.Kind.Interface);
	test.equals(decl.methods[0].throws_[0].toString(),"BufferException");
	test.equals(decl.methods[0].throws_[1].toString(),"BufferException2");
	
	/**
	 * interface PointInterface {
     * 	void move(int dx, int dy);
	 * }
	 */
	decl = unit.defs[3];
	test.equals(decl.methods[0].params[0].type.toString(),"int");
	test.equals(decl.methods[0].params[0].identifier.toString(),"dx");
	test.equals(decl.methods[0].params[1].type.toString(),"int");
	test.equals(decl.methods[0].params[1].identifier.toString(),"dy");
	
	/**
	 * @interface Preliminary {
	 * 	int id();
	 * }
	 */
	decl = unit.defs[4];
	test.equals(decl.kind,AST.ClassDecl.Kind.Annotation);
	test.equals(decl.identifier.toString(),"Preliminary");
	test.equals(decl.methods[0].identifier.toString(),"id");
	test.equals(decl.methods[0].returnType.toString(),"int");
	
	test.done();
} ;

exports.test_0114_blocks_statements = function(test) {
	var unit = parseContent("tests/data/0114_blocks_statements.txt");
	
	/**
	 * public class Foo {
     *	public static void main(String[] args) {
     *   Baz.testAsserts();
     *  }
     * }
	 */
	var decl = unit.defs[0];
	test.equals(decl.kind,AST.ClassDecl.Kind.Class);
	var method = decl.methods[0];
	test.equals(method.identifier.toString(),"main");
	test.equals(method.returnType,null);
	test.equals(method.modifiers[0].toString(),"public");
	test.equals(method.modifiers[1].toString(),"static");
	test.equals(method.params[0].type.toString(),"String");
	test.equals(method.params[0].type.dimCount,1);
	test.ok(method.block.stats[0] instanceof AST.ExpressionStatement);
	test.ok(method.block.stats[0].expr instanceof AST.MethodInvocation);
	test.equals(method.block.stats[0].expr.args.length,0);
	test.equals(method.block.stats[0].expr.parent[0].value.toString(),"Baz");
	test.equals(method.block.stats[0].expr.identifier.toString(),"testAsserts");
	
	/**
	 * class Bar {
     * 	static {
     *   Baz.testAsserts(); 
     *	}
     * }
	 */
	var decl = unit.defs[1];
	var stat = decl.staticBlocks[0];
	test.ok(stat.stats[0] instanceof AST.ExpressionStatement);
	test.ok(stat.stats[0].expr instanceof AST.MethodInvocation);
	test.equals(stat.stats[0].expr.parent[0].value.toString(),"Baz");
	test.equals(stat.stats[0].expr.identifier.toString(),"testAsserts");
	
	
	/**
	 * class Baz extends Bar {
     * 	static void testAsserts() {
     *   boolean enabled = false;
     *   assert  enabled = true;
     *   System.out.println("Asserts " +  (enabled ? "enabled" : "disabled"));
     * 	}
     * }
     */
	
	var decl = unit.defs[2];
	var method = decl.methods[0];
	var stat = method.block.stats[0];
	test.ok(stat instanceof AST.VariableDecl);
	test.equals(stat.type.toString(),"boolean");
	test.equals(stat.identifier.toString(),"enabled");
	test.ok(stat.expr instanceof AST.Literal);
	test.equals(stat.expr.value,"false");
	// check assert enabled = true;
	var stat = method.block.stats[1];
	test.ok(stat instanceof AST.Assert);
	test.ok(stat.cond instanceof AST.AssignOp);
	test.ok(stat.cond.lexpr instanceof AST.Ident);
	test.ok(stat.cond.lexpr.toString(), "enabled");
	test.ok(stat.cond.op.toString() ,"=");
	test.ok(stat.cond.rexpr instanceof AST.Literal);
	test.ok(stat.cond.rexpr.toString(),"false");
	// check System.out.println("Asserts " +  (enabled ? "enabled" : "disabled"));
	var stat = method.block.stats[2];
	test.ok(stat instanceof AST.ExpressionStatement);
	test.ok(stat.expr instanceof AST.MethodInvocation);
	test.ok(stat.expr.args.length,1);
	test.ok( stat.expr.args[0] instanceof AST.Binary);
	test.ok(stat.expr.args[0].lexpr instanceof AST.Literal);
	test.equals(stat.expr.args[0].lexpr.value.toString(),"\"Asserts \"");
	test.equals(stat.expr.args[0].op.toString(),"+");
	test.ok(stat.expr.args[0].rexpr instanceof AST.Parens);
	test.ok(stat.expr.args[0].rexpr.expr.cond instanceof AST.Ident);
	test.ok(stat.expr.args[0].rexpr.expr.cond.toString(),"enabled");
	test.ok(stat.expr.args[0].rexpr.expr.truepart.toString(),"enabled");
	test.ok(stat.expr.args[0].rexpr.expr.falsepart.toString(),"disabled");
	
	
	/**
	 * class TooMany {
     * 	static void howMany(int k) {
     *   	switch (k) {
     *       	case 1: System.out.print("one ");
     *       	case 2: System.out.print("too ");
     *	       	case 3: System.out.println("many");
     *   	}
     * 	}
     * 	public static void main(String[] args) {
     *  	howMany(3);
     *   	howMany(2);
     *   	howMany(1);
     * 	}
	 * }
	 */
	var decl = unit.defs[3];
	var method = decl.methods[0];
	var stat = method.block.stats[0];
	test.ok(stat instanceof AST.Switch);
	test.equals(stat.selector.expr.toString(),"k");
	test.equals(stat.cases.length,3);
	test.equals(stat.cases[0].pat.value.toString(),"1");
	test.ok(stat.cases[0].stat[0] instanceof AST.ExpressionStatement);
	test.ok(stat.cases[0].stat[0].expr instanceof AST.MethodInvocation);
	
	test.equals(stat.cases[0].stat[0].expr.parent.toString(),"System,out");
	test.equals(stat.cases[0].stat[0].expr.identifier.toString(),"print");
	test.equals(stat.cases[0].stat[0].expr.args[0].value.toString(),"\"one \"");
	test.equals(stat.cases[1].pat.value.toString(),"2");
	test.ok(stat.cases[1].stat[0] instanceof AST.ExpressionStatement);
	test.ok(stat.cases[1].stat[0].expr instanceof AST.MethodInvocation);
	test.equals(stat.cases[1].stat[0].expr.parent.toString(),"System,out");
	test.equals(stat.cases[1].stat[0].expr.identifier.toString(),"print");
	test.equals(stat.cases[1].stat[0].expr.args[0].value.toString(),"\"too \"");
	test.equals(stat.cases[2].pat.value.toString(),"3");
	test.ok(stat.cases[2].stat[0] instanceof AST.ExpressionStatement);
	test.ok(stat.cases[2].stat[0].expr instanceof AST.MethodInvocation);
	test.equals(stat.cases[2].stat[0].expr.parent.toString(),"System,out");
	test.equals(stat.cases[2].stat[0].expr.identifier.toString(),"println");
	test.equals(stat.cases[2].stat[0].expr.args[0].value.toString(),"\"many\"");
	// check public static void main(String[] args)
	var stat = decl.methods[1].block.stats[0];
	test.ok(stat instanceof AST.ExpressionStatement);
	test.equals(stat.expr.identifier.toString(),"howMany");
	test.equals(stat.expr.args[0].value.toString(),"3");
	var stat = decl.methods[1].block.stats[1];
	test.ok(stat instanceof AST.ExpressionStatement);
	test.equals(stat.expr.identifier.toString(),"howMany");
	test.equals(stat.expr.args[0].value.toString(),"2");
	var stat = decl.methods[1].block.stats[2];
	test.ok(stat instanceof AST.ExpressionStatement);
	test.equals(stat.expr.identifier.toString(),"howMany");
	test.equals(stat.expr.args[0].value.toString(),"1");
	
	test.done();
};


exports.test_0115_expressions = function(test) {
	var unit = parseContent("tests/data/0115_expressions.txt");
	/**
	 * class IntVector {
     * 	boolean equals(IntVector other) {
     *   if (this == other)
     *     	return true;
     *   if (v.length != other.v.length)
     *       return false;
     *   for (int i = 0; i < v.length; i++) {
     *       if (v[i] != other.v[i]) return false;
     *   }
     *   return true;
     *  }
	 * }
	 */
	var decl = unit.defs[0];
	var method = decl.methods[0];
	var stat  = method.block.stats[0];
	test.ok(stat instanceof AST.If);
	test.ok(stat.cond instanceof AST.Parens);
	test.ok(stat.cond.expr instanceof AST.Binary);
	test.equals(stat.cond.expr.lexpr.toString(),"this");
	test.equals(stat.cond.expr.rexpr.toString(),"other");
	test.ok(stat.truepart instanceof AST.Return);
	test.equals(stat.truepart.expr.value.toString(),"true");
	
	var stat = method.block.stats[1];
	test.ok(stat instanceof AST.If);
	test.ok(stat.cond instanceof AST.Parens);
	test.ok(stat.cond.expr instanceof AST.Binary);
	test.equals(stat.cond.expr.lexpr.toString(),"v.length");
	test.equals(stat.cond.expr.rexpr.toString(),"other.v.length");
	test.ok(stat.truepart instanceof AST.Return);
	test.equals(stat.truepart.expr.value.toString(),"false");
	
	var stat = method.block.stats[2];
	test.ok(stat instanceof AST.For);
	test.ok(stat.init[0] instanceof AST.VariableDecl);
	test.equals(stat.init[0].identifier.toString(),"i");
	test.ok(stat.cond instanceof AST.Binary);
	test.equals(stat.cond.lexpr.toString(),"i");
	test.equals(stat.cond.rexpr.toString(),"v.length");
	test.equals(stat.cond.op.toString(),"<");
	test.ok(stat.step[0] instanceof AST.ExpressionStatement);
	test.ok(stat.step[0].expr instanceof AST.Unary);
	test.equals(stat.step[0].expr.postfixOp,"++");
	test.equals(stat.step[0].expr.expr.toString(),"i");
	test.ok(stat.body.stats[0] instanceof AST.If);
	test.ok(stat.body.stats[0].cond.expr.lexpr instanceof AST.ArrayAccess);
	test.equals(stat.body.stats[0].cond.expr.lexpr.identifier.toString(),"v");
	test.equals(stat.body.stats[0].cond.expr.lexpr.indexExpr.identifiers.toString(),"i");
	test.equals(stat.body.stats[0].cond.expr.rexpr.parent[0].toString(),"other");
	test.equals(stat.body.stats[0].cond.expr.rexpr.identifier.toString(),"v");
	test.equals(stat.body.stats[0].cond.expr.rexpr.indexExpr.identifiers.toString(),"i");
	test.equals(stat.body.stats[0].truepart.expr.value.toString(),"false");
	
	
	/**
	 * class Test2 {
     * 	public static void main(String[] args) {
     *   	try {
     *       	test(id = 1, oops(), id = 3);
     *   	} catch (Exception e) {
     *       	System.out.println(e + ", id=" + id);
     *   	}
     *  }
     * }
	 */
	var decl = unit.defs[1];
	var method = decl.methods[0];
	var stat = method.block.stats[0];
	test.ok(stat instanceof AST.Try);
	
	test.ok(stat.block.stats[0].expr instanceof AST.MethodInvocation);
	test.equals(stat.block.stats[0].expr.identifier.toString(),"test");
	
	test.ok(stat.block.stats[0].expr.args[0] instanceof AST.AssignOp);
	test.ok(stat.block.stats[0].expr.args[1] instanceof AST.MethodInvocation);
	test.ok(stat.block.stats[0].expr.args[2] instanceof AST.AssignOp);
	test.equals(stat.catches[0].qualifiedIdents[0].toString(),"Exception");
	test.equals(stat.catches[0].identifier.toString(),"e");
	
	test.ok(stat.catches[0].block.stats[0].expr instanceof AST.MethodInvocation);
	test.done();
};


exports.test_0108_classes = function(test) {
	/**
	 * interface ConvertibleTo<T> {
     * 	T convert();
	 * }	
	 */
	var unit = parseContent("tests/data/0108_classes.txt");
	test.equals(unit.defs[0].kind,AST.ClassDecl.Kind.Interface);
	test.equals(unit.defs[0].typeParams[0].type.toString(),"T");
	
	/**
	 * class ReprChange<T extends ConvertibleTo<S>,
     *            S extends ConvertibleTo<T>> { 
     *		T t; 
     *		void set(S s) { t = s.convert();    } 
     *		S get()       { return t.convert(); } 
	 * }
	 */
	
	test.equals(unit.defs[1].kind,AST.ClassDecl.Kind.Class);

	test.equals(unit.defs[1].typeParams[0].extendsFrom[0].identifiers[0].value,"ConvertibleTo");
	test.equals(unit.defs[1].typeParams[0].extendsFrom[0].args[0].type.toString(),"S");
	test.equals(unit.defs[1].typeParams[1].extendsFrom[0].identifiers[0].value,"ConvertibleTo");
	test.equals(unit.defs[1].typeParams[1].extendsFrom[0].args[0].type.toString(),"T");
	test.equals(unit.defs[1].fields.length,1);
	test.equals(unit.defs[1].methods.length,2);
	test.done();
};
