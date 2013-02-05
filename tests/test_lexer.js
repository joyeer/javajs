var parser = require("../lexer.js");
var fs = require("fs") ;
var Token = require("../ast.js").Token;

function readFileContent(path) {
	return fs.readFileSync(path).toString() ;
}

exports.testLexerParse = function(test) {
	
	var lexer = new parser.Lexer() ;
	lexer.parse(readFileContent("tests/data/0001.txt"));
	
	var visitor = lexer.getVisitor() ;
	
	// keywords
	test.ok(visitor.next().tk === Token.TK_ABSTRACT,"check abstract");
	test.ok(visitor.next().tk === Token.TK_CONTINUE,"check continue");
	test.ok(visitor.next().tk === Token.TK_FOR,"check for");
	test.ok(visitor.next().tk === Token.TK_NEW,"check new");
	test.ok(visitor.next().tk === Token.TK_SWITCH,"check switch");
	test.ok(visitor.next().tk === Token.TK_ASSERT,"check assert");
	test.ok(visitor.next().tk === Token.TK_DEFAULT,"check default");
	test.ok(visitor.next().tk === Token.TK_IF,"check if");
	test.ok(visitor.next().tk === Token.TK_PACKAGE, "check package");
	test.ok(visitor.next().tk === Token.TK_SYNCHRONIZED,"check synchroized");
	test.ok(visitor.next().tk === Token.TK_BOOLEAN,"check boolean");
	test.ok(visitor.next().tk === Token.TK_DO,"check do");
	test.ok(visitor.next().tk === Token.TK_GOTO,"check goto");
	test.ok(visitor.next().tk === Token.TK_PRIVATE,"check private");
	test.ok(visitor.next().tk === Token.TK_THIS,"check this");
	test.ok(visitor.next().tk === Token.TK_BREAK,"check break");
	test.ok(visitor.next().tk === Token.TK_DOUBLE,"check double");
	test.ok(visitor.next().tk === Token.TK_IMPLEMENTS,"check implements");
	test.ok(visitor.next().tk === Token.TK_PROTECTED,"check protected");
	test.ok(visitor.next().tk === Token.TK_THROW,"check throw");
	test.ok(visitor.next().tk === Token.TK_BYTE,"check byte");
	test.ok(visitor.next().tk === Token.TK_ELSE,"check else");
	test.ok(visitor.next().tk === Token.TK_IMPORT,"check import");
	test.ok(visitor.next().tk === Token.TK_PUBLIC,"check public");
	test.ok(visitor.next().tk === Token.TK_THROWS,"check throws");
	test.ok(visitor.next().tk === Token.TK_CASE,"check case");
	test.ok(visitor.next().tk === Token.TK_ENUM,"check enum");
	test.ok(visitor.next().tk === Token.TK_INSTANCEOF,"check instanceof");
	test.ok(visitor.next().tk === Token.TK_RETURN,"check return");
	test.ok(visitor.next().tk === Token.TK_TRANSIENT,"check transient");
	test.ok(visitor.next().tk === Token.TK_CATCH,"check CATCH");
	test.ok(visitor.next().tk === Token.TK_EXTENDS,"check extends");
	test.ok(visitor.next().tk === Token.TK_INT,"check int");
	test.ok(visitor.next().tk === Token.TK_SHORT,"check short");
	test.ok(visitor.next().tk === Token.TK_TRY,"check try");
	test.ok(visitor.next().tk === Token.TK_CHAR,"check CHAR");
	test.ok(visitor.next().tk === Token.TK_FINAL,"check final");
	test.ok(visitor.next().tk === Token.TK_INTERFACE,"check interface");
	test.ok(visitor.next().tk === Token.TK_STATIC,"check static");
	test.ok(visitor.next().tk === Token.TK_VOID,"check void");
	test.ok(visitor.next().tk === Token.TK_CLASS,"check class");
	test.ok(visitor.next().tk === Token.TK_FINALLY,"check finally");
	test.ok(visitor.next().tk === Token.TK_LONG,"check long");
	test.ok(visitor.next().tk === Token.TK_STRICTFP,"check strictfp");
	test.ok(visitor.next().tk === Token.TK_VOLATILE,"check volatile");
	test.ok(visitor.next().tk === Token.TK_CONST,"check const");
	test.ok(visitor.next().tk === Token.TK_FLOAT,"check float");
	test.ok(visitor.next().tk === Token.TK_NATIVE,"check native");
	test.ok(visitor.next().tk === Token.TK_SUPER,"check super");
	test.ok(visitor.next().tk === Token.TK_WHILE,"check WHILE");
	test.equals(visitor.next().tk , Token.TK_NullLiteral, "check null");
	var token = visitor.next();
	test.equals(token.tk,Token.TK_Identifier,"check identifier");
	test.equals(token.value,"asdfasdfasdf","check identifier");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_Identifier,"check identifier: $$$");
	test.equals(token.value, "$$$","check identifier: $$$");
	
	token = visitor.next();
	test.equals(token.tk, Token.TK_Identifier,"check identifier: $00123123sdf");
	test.equals(token.value, "$00123123sdf","check identifier: $00123123sdf");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_Identifier, "check identifier: ___");
	test.equals(token.value, "___","check identifier: ___");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_IntegerLiteral,"check integer: 0_0");
	test.equals(token.value, "0_0","check integer: 0_0");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_IntegerLiteral,"check integer: 00");
	test.equals(token.value, "00","check integer: 00");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_IntegerLiteral, "check integer: 0123");
	test.equals(token.value,"0123", "check integer: 0123");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_IntegerLiteral, "check integer: 0");
	test.equals(token.value,"0", "check integer: 0");
	
	token = visitor.next() ; 
	test.equals(token.tk, Token.TK_IntegerLiteral, "check integer: 0200_0000_0000");
	test.equals(token.value, "0200_0000_0000", "check integer: 0200_0000_0000");
	
	token = visitor.next() ; 
	test.equals(token.tk, Token.TK_IntegerLiteral, "check binary integer: 0b0111_1111_1111_1111_1111_1111_1111_1111");
	test.equals(token.value, "0b0111_1111_1111_1111_1111_1111_1111_1111", "check binary integer: 0b0111_1111_1111_1111_1111_1111_1111_1111");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_IntegerLiteral, "check hex: 0x0") ;
	test.equals(token.value,"0x0","check hex: 0x0");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_IntegerLiteral, "check hex: 0xaeb5f");
	test.equals(token.value, "0xaeb5f"," check hex value: 0xaeb5f");
	
	token = visitor.next();
	test.equals(token.tk, Token.TK_FloatingLiteral, "check hex: 0x.1234f");
	test.equals(token.value,"0x.1234f","check hex value: 0x.1234f");
	
	token = visitor.next();
	test.equals(token.tk, Token.TK_FloatingLiteral,"check hex: 0x133e.1231");
	test.equals(token.value, "0x133e.1231", "check hex: 0x133e.1231");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_IntegerLiteral, "check dec: 12345");
	test.equals(token.value, "12345", "check dec value: 12345");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_FloatingLiteral, "check dec:123556.123 ");
	test.equals(token.value, "123556.123", "check dec:123556.123");
	
	token = visitor.next();
	test.equals(token.tk, Token.TK_FloatingLiteral,"check dec:876540.123e123");
	test.equals(token.value, "876540.123e123", "check dec: 876540.123e123");
	
	token = visitor.next();
	test.equals(token.tk, Token.TK_FloatingLiteral, "check dec:876540.123e1234f");
	test.equals(token.value, "876540.123e1234f","check dec value: 876540.123e1234f");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_FloatingLiteral, "check dec:1238e123123");
	test.equals(token.value, "1238e123123", "check dec value: 1238e123123");
	
	token = visitor.next() ;
	test.equals(token.tk, Token.TK_FloatingLiteral, "check dec:1238e123123F");
	test.equals(token.value, "1238e123123F", "check dec value: 1238e123123F");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_BooleanLiteral,"check true");
	test.equals(token.value,"true");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_BooleanLiteral,"check false");
	test.equals(token.value,"false");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_Identifier);
	test.equals(token.value,"java");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_StringLiteral);
	test.equals(token.value,"\"java\"");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_IntegerLiteral);
	test.equals(token.value,"0");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_SEMI);
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_Identifier);
	test.equals(token.value,"i");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_PLUSPLUS);
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_BOOLEAN);
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_DOT);
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_CLASS);
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_FloatingLiteral);
	test.equals(token.value,"0");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_IntegerLiteral);
	test.equals(token.value,"0");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_IntegerLiteral);
	test.equals(token.value,"42L");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_RPAREN);
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_CharacterLiteral);
	test.equals(token.value,"*");
	
	token = visitor.next();
	test.equals(token.tk,Token.TK_FloatingLiteral);
	test.equals(token.value,"0.0");

    token = visitor.next();
    test.equals(token.tk,Token.TK_FloatingLiteral);
    test.equals(token.value,".5f");

    token = visitor.next();
    test.equals(token.tk,Token.TK_IntegerLiteral);
    test.equals(token.value,"0x400000L");

    token = visitor.next();
    test.equals(token.tk,Token.TK_Identifier);
    test.equals(token.value,"ctx");

    token = visitor.next();
    test.equals(token.tk,Token.TK_DOT);

    token = visitor.next();
    test.equals(token.tk,Token.TK_Identifier);
    test.equals(token.value,"_or");
	test.done() ;
} ;

exports.text_visitor =function(test) {
	
	var parse = function(content) {
		var lexer = new parser.Lexer() ;
		lexer.parse(content);
		var visitor = lexer.getVisitor();
		return visitor;
	};
	
	var visitor = parse("<>>+"); 
	test.equals(visitor.next().tk,Token.TK_LT);
	test.equals(visitor.next(true).tk,Token.TK_GT);
	test.equals(visitor.next(true).tk,Token.TK_GT);
	test.equals(visitor.next().tk,Token.TK_PLUS);
	
	visitor = parse("<>>");
	visitor.mark();
	test.equals(visitor.next().tk,Token.TK_LT);
	test.equals(visitor.next(true).tk,Token.TK_GT);
	visitor.restore(false);
	test.equals(visitor.next().tk,Token.TK_LT);
	
	test.done();
};