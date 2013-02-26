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
var AST = require("./ast").AST;
var Token = require("./ast").Token;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Parser
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Parser(visitor) {
	this._visitor = visitor;
}

Parser.prototype._tryEat = function(tk,flag) {
	var t = this._visitor.next(flag) ;
	if(t.tk == tk) {
		return t;
	} else {
		this._visitor.prev() ;
		return null;
	}
} ;

Parser.prototype._eat = function(tk) {
	var t = this._visitor.next() ;
	if(t.tk == tk) {
		return t ;
	} else {
		throw "Try to Eat Token: " + tk + ", doesn't find it, meet:" + t.tk;
	}
} ;

var debugCount = null;

Parser.prototype._mark = function() {
	this._visitor.mark();
	if(debugCount != null) {
		for( var key in Parser.prototype ) {
			if(Parser.prototype[key] == Parser.prototype._mark.caller ) {
				console.log( debugCount.join("") + key + "+");
			}
		}
		debugCount.push("   ");
	}
};

/**
 * 
 * @param flag
 * @returns flag
 */
Parser.prototype._restore = function(flag) {
	this._visitor.restore(flag);
	if(debugCount != null) {
		debugCount.pop();
		for( var key in Parser.prototype ) {
			if(Parser.prototype[key] == Parser.prototype._restore.caller ) {
				console.log(debugCount.join("") + key + "-");
			}
		}
	}
	return flag;
};

Parser.prototype.parse = function() {
	this._unit = this._tryParseCompilationUnit();
	return this._unit;
};

/**
 * get the identifier, otherwise return null;
 */
Parser.prototype._tryParseIdentifier = function() {
	var identifier = this._tryEat(Token.TK_Identifier);
	if(identifier != null) {
		return identifier;
	}
	return null;
};

/**
 * QualifiedIdentifier:
 *   Identifier { . Identifier }
 */
Parser.prototype._tryParseQualifiedIdentifier = function () {
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var qi = new AST.QualifiedIdentifier();
		qi.identifiers.push(identifier);
		if(identifier != null) {
			while(true) {
				this._mark();
				if(this._tryEat(Token.TK_DOT) != null) {
					identifier = this._tryParseIdentifier() ;
					if(identifier != null) {
						qi.identifiers.push(identifier);
						this._restore(true);
						continue;
					}
				}
				this._restore(false);
				break;
			}
		}
		return qi;
	}
	return null;
}; 

/**
 * QualifiedIdentifierList: 
 *   QualifiedIdentifier { , QualifiedIdentifier }
 */
Parser.prototype._tryParseQualifiedIdentifierList = function() {
    this._mark();
    var qualifiedIdentifier = this._tryParseQualifiedIdentifier();
    if(qualifiedIdentifier != null) {
    	var qiList = [];
    	qiList.push(qualifiedIdentifier);
        while(true) {
        	this._mark();
        	if(this._tryEat(Token.TK_COMMA) != null) {
        		qualifiedIdentifier = this._tryParseQualifiedIdentifier();
        		qiList.push(qualifiedIdentifier);
        		this._restore(true);
        		continue;
        	}
        	this._restore(false);
        	break;
        }
        return qiList;
    }
    this._restore(false);
    return null;
};

//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * CompilationUnit: 
 *   [ [Annotations] package QualifiedIdentifier ; ]
 *                                    {ImportDeclaration} {TypeDeclaration}
 */
Parser.prototype._tryParseCompilationUnit = function() {
	var unit = new AST.CompilationUnit();
	
	// parse:  [ [Annotations] package QualifiedIdentifier ; ]
	this._mark();
	var isSuccess = false;
	var annotations = this._tryParseAnnotations();
	if(this._tryEat(Token.TK_PACKAGE) != null) {
		var pkgIdentifier = this._tryParseQualifiedIdentifier();
		if(pkgIdentifier != null) {
			if(this._tryEat(Token.TK_SEMI)!= null) {
				unit.annotations = annotations;
				unit._package = pkgIdentifier;
				isSuccess = true;
			}
		}
	}
	this._restore(isSuccess);
	
	// parse: {ImportDeclaration }
	var _import = null;
	while((_import = this._tryParseImportDeclaration()) != null) {
		unit.imports.push(_import);
	}
	
	// parse: Parse TypeDeclaration
	var def = null;
	while((def = this._tryParseTypeDeclaration()) != null) {
		unit.defs.push(def);
	}
	
	return unit;
};


/**
 * ImportDeclaration: 
    import [static] Identifier { . Identifier } [. *] ;
 */
Parser.prototype._tryParseImportDeclaration = function() {
	this._mark();
	if(this._tryEat(Token.TK_IMPORT) != null) {
		var isStatic = (this._tryEat(Token.TK_STATIC) != null) ;
		var identifier = this._tryParseIdentifier();
		if(identifier != null) {
			var importDecl = new AST.Import();
			importDecl.identifiers.push(identifier);
			importDecl.isStatic = isStatic ;
			
			while(true) {
				this._mark();
				if(this._tryEat(Token.TK_DOT) != null) {
					identifier = this._tryParseIdentifier();
					if(identifier != null) {
						importDecl.identifiers.push(identifier);
						this._restore(true);
						continue;
					}
				}
				this._restore(false);
				break;
			}
			
			if(this._tryEat(Token.TK_DOT) != null) {
				if(this._tryEat(Token.TK_STAR) != null) {
					importDecl.wildcard = true;
				} else {
					this._restore(false);
					return null;
				}
			}
			
			if(this._tryEat(Token.TK_SEMI) != null) {
				this._restore(true);
				return importDecl;
			}
		}
	}
	this._restore(false);
	return null;
};


/**
 * TypeDeclaration: 
 *   ClassOrInterfaceDeclaration
 *   ;
 * 
 */
Parser.prototype._tryParseTypeDeclaration = function() {
	
	var decl = this._tryParseClassOrInterfaceDeclaration() ;
	
	if(decl != null) {
		return decl;
	}
	
	if(this._tryEat(Token.TK_COMMA) != null) {
		return new AST.Skip();
	}
	
	return null;
};

/**
 * ClassOrInterfaceDeclaration: 
 *   {Modifier} (ClassDeclaration | InterfaceDeclaration)
 */
Parser.prototype._tryParseClassOrInterfaceDeclaration = function() {
	this._mark();
	
	var modifiers = this._tryParseModifiers();
	
	var classDecl = this._tryParseClassDeclaration();
	if(classDecl != null) {
		this._restore(true);
		classDecl.modifiers = modifiers;
		return classDecl;
	}
	
	var interfaceDecl = this._tryParseInterfaceDeclaration();
	if(interfaceDecl != null) {
		this._restore(true);
		interfaceDecl.modifiers = modifiers;
		return interfaceDecl;
	}
	this._restore(false);
	return null;
};

/**
 * ClassDeclaration: 
 *   NormalClassDeclaration
 *   EnumDeclaration
 */
Parser.prototype._tryParseClassDeclaration = function() {
	// parse: NormalClassDeclaration
	var classDecl = this._tryParseNormalClassDeclaration();
	if(classDecl != null) {
		return classDecl;
	}
	
	//parse: EnumDeclaration
	var enumDecl = this._tryParseEnumDeclaration();
	if(enumDecl != null) {
		return enumDecl;
	}
	
	return null;
};

/**
 * NormalClassDeclaration: 
 *   class Identifier [TypeParameters] [extends Type] [implements TypeList] ClassBody
 */
Parser.prototype._tryParseNormalClassDeclaration = function() {
	this._mark();
	if(this._tryEat(Token.TK_CLASS) != null) {
		var classDecl = new AST.ClassDecl();
		classDecl.kind = AST.ClassDecl.Kind.Class;
		classDecl.identifier = this._tryParseIdentifier();
		
		if(classDecl.identifier != null) {
			classDecl.typeParams = this._tryParseTypeParameters();
			
			// parse: [extends Type]
			this._mark();
			var isSuccess = false;
			if(this._tryEat(Token.TK_EXTENDS) != null) {
				var type = this._tryParseType();
				if(type != null) {
					isSuccess = true;
					classDecl.extendsTypeList.push(type);
				} 
			}
			this._restore(isSuccess);
			
			// parse: [implements TypeList]
			this._mark();
			isSuccess = false;
			if(this._tryEat(Token.TK_IMPLEMENTS) != null) {
				var typeList = this._tryParseTypeList();
				if(typeList != null) {
					isSuccess = true;
					classDecl.implTypeList = typeList;
				}
			}
			this._restore(isSuccess);
			
			// parse the class body
			classDecl = this._tryParseClassBody(classDecl);
			if(classDecl != null) {
				this._restore(true);
				return classDecl;	
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * InterfaceDeclaration: 
 *   NormalInterfaceDeclaration
 *   AnnotationTypeDeclaration
 */
Parser.prototype._tryParseInterfaceDeclaration = function() {
	
	// parse: NormalInterfaceDeclaration
	var interfaceDecl = this._tryParseNormalInterfaceDeclaration();
	if(interfaceDecl != null) {
		return interfaceDecl;
	}
	
	// parse: AnnotationTypeDeclaration
	var annotationDecl = this._tryParseAnnotationTypeDeclaration();
	if(annotationDecl != null) {
		return annotationDecl;
	}
	
	return null;
};

/**
 * EnumDeclaration:
 *   enum Identifier [implements TypeList] EnumBody
 */
Parser.prototype._tryParseEnumDeclaration = function() {
	this._mark();
	if(this._tryEat(Token.TK_ENUM) != null ) {
		var identifier = this._tryParseIdentifier();
		if(identifier != null) {
			var decl = new AST.ClassDecl();
			decl.kind = AST.ClassDecl.Kind.Enum;
			decl.identifier = identifier;
			
			this._mark();
			var isSuccess = false;
			if(this._tryEat(Token.TK_IMPLEMENTS) != null) {
				decl.implTypeList = this._tryParseTypeList();
				if(decl.implTypeList != null) {
					isSuccess = true;
				}
			}
			this._restore(isSuccess);
			
			if(this._tryParseEnumBody(decl)) {
				this._restore(true);
				return decl ;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * NormalInterfaceDeclaration: 
 *   interface Identifier [TypeParameters] [extends TypeList] InterfaceBody
 */
Parser.prototype._tryParseNormalInterfaceDeclaration = function() {
	this._mark();
	if(this._tryEat(Token.TK_INTERFACE) != null) {
		var identifier = this._tryParseIdentifier();
		if(identifier != null) {
			var classDecl = new AST.ClassDecl();
			classDecl.kind = AST.ClassDecl.Kind.Interface;
			classDecl.identifier = identifier;
			classDecl.typeParams = this._tryParseTypeParameters();
			
			this._mark();
			var isSuccess = false;
			if(this._tryEat(Token.TK_EXTENDS) != null) {
				var typeList = this._tryParseTypeList();
				if(typeList != null) {
					classDecl.extendsTypeList = typeList;
					isSuccess = true;
				}
			}
			this._restore(isSuccess);
			
			classDecl = this._tryParseInterfaceBody(classDecl);
			if(classDecl != null) {
				this._restore(true);
				return classDecl;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * AnnotationTypeDeclaration:
 *   @ interface Identifier AnnotationTypeBody
 */
Parser.prototype._tryParseAnnotationTypeDeclaration = function() {
	this._mark();
	if(this._tryEat(Token.TK_MONKEYS_AT)!= null){
		if(this._tryEat(Token.TK_INTERFACE) != null) {
			var identifier = this._tryParseIdentifier();
			if(identifier != null) {
				var decl = new AST.ClassDecl();
				decl.kind = AST.ClassDecl.Kind.Annotation;
				decl.identifier = identifier;
				if(this._tryParseAnnotationTypeBody(decl)) {
					this._restore(true);
					return decl;	
				}
				
			}
		}
	}
	this._restore(false);
	return null;
};

//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * {Modifier}
 */
Parser.prototype._tryParseModifiers = function() {
	var modifiers = [];
	var modifier = null;
	while((modifier = this._tryParseModifier()) != null) {
		modifiers.push(modifier);
	}
	return modifiers;
};

/**
 * Modifier: 
 *   Annotation
 *   public
 *   protected
 *   private
 *   static 
 *   abstract
 *   final
 *   native
 *   synchronized
 *   transient
 *   volatile
 *   strictfp
 */
Parser.prototype._tryParseModifier = function() {
	var token = this._visitor.next();
	switch(token.tk) {
	case Token.TK_PUBLIC:
	case Token.TK_PROTECTED:
	case Token.TK_PRIVATE:
	case Token.TK_STATIC:
	case Token.TK_ABSTRACT:
	case Token.TK_FINAL:
	case Token.TK_NATIVE:
	case Token.TK_SYNCHRONIZED:
	case Token.TK_TRANSIENT:
	case Token.TK_VOLATILE:
	case Token.TK_STRICTFP:
		return token.tk;
	default:
		this._visitor.prev();
		break;
	}
	
	var annotation = this._tryParseAnnotation();
	if(annotation != null) {
		return annotation;
	}
	return null;
};


/**
 * {VariableModifier}
 */
Parser.prototype._tryParseVariableModifiers = function() {
	var modifiers = [];
	var modifier = null;
	while((modifier = this._tryParseVariableModifier()) != null) {
		modifiers.push(modifier);
	}
	return modifiers; 
};

/**
 * VariableModifier:
 *   final
 *   Annotation
 */
Parser.prototype._tryParseVariableModifier = function() {
	if(this._tryEat(Token.TK_FINAL) != null) {
		return Token.TK_FINAL;
	}
	var annotation = this._tryParseAnnotation();
	if(annotation != null) {
		return annotation;
	}
	return null;
};


/**
 * Annotations:
 *   Annotation {Annotation}
 */
Parser.prototype._tryParseAnnotations = function() {
	var annotation = this._tryParseAnnotation();
	if(annotation != null) {
		var annotations = [];
		annotations.push(annotation);
		while((annotation = this._tryParseAnnotation() ) != null) {
			annotations.push(annotatoin);
		}
		return annotations;
	}
	return null;
};

/**
 * Annotation:
 *   @ QualifiedIdentifier [ "(" [AnnotationElement] ")" ]
 */
Parser.prototype._tryParseAnnotation = function() {
	this._mark();
	if(this._tryEat(Token.TK_MONKEYS_AT) != null) {
		var qualifiedIdentifier = this._tryParseQualifiedIdentifier();
		if(qualifiedIdentifier != null) {
			var annotation = new AST.Annotation();
			annotation.qualifiedId = qualifiedIdentifier;
			this._mark();
			if(this._tryEat(Token.TK_LPAREN) != null) {
				var elem = this._tryParseAnnotationElement();
				if(this._tryEat(Token.TK_RPAREN) != null) {
					this._restore(true);
					this._restore(true);
					
					if(elem instanceof Array) {
						annotation.pairs = elem;
					} else {
						annotation.value = elem;
					}
					
					return annotation ;
				}
			} else {
				this._restore(true);
				this._restore(true);
				return annotation;
			}
			this._restore(false);
		}
	}
	this._restore(false);
	return null;
};

/**
 * AnnotationElement:
 *   ElementValuePairs
 *   ElementValue
 */
Parser.prototype._tryParseAnnotationElement = function() {
	var pairs = this._tryParseElementValuePairs();
	if(pairs != null) {
		return pairs;
	}
	
	var value = this._tryParseElementValue();
	if(value != null) {
		return value;
	}
	return null;
};

/**
 * ElementValuePairs:
 *   ElementValuePair { , ElementValuePair }
 */
Parser.prototype._tryParseElementValuePairs = function() {
	this._mark();
	var pair = this._tryParseElementValuePair();
	if(pair != null) {
		var pairs = [];
		pairs.push(pair);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				pair = this._tryParseElementValuePair();
				if(pair != null) {
					pairs.push(pair);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		this._restore(true);
		return pairs;
	}
	this._restore(false);
	return null;
} ;

/**
 * ElementValuePair:
 *   Identifier = ElementValue
 * @return [identifier,expression]
 */
Parser.prototype._tryParseElementValuePair = function() {
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		if(this._tryEat(Token.TK_EQ) != null) {
			var value = this._tryParseElementValue();
			this._restore(true);
			return [identifier,value];
		}
	}
	this._restore(false);
	return null;
};

/**
 * ElementValue:
 *   Annotation
 *   Expression1 
 *   ElementValueArrayInitializer
 */
Parser.prototype._tryParseElementValue = function() {
	
	var annotation = this._tryParseAnnotation() ;
	if(annotation != null) {
		return annotation;
	}
	
	var expr1 = this._tryParseExpression1();
	if(expr1 != null) {
		return expr1;
	}
	
	var initializer = this._tryParseElementValueArrayInitializer();
	if(initializer != null) {
		return initializer;
	}
	return null;
};

/**
 * ElementValueArrayInitializer:
 *   "{" [ElementValues] [,] "}"
 */
Parser.prototype._tryParseElementValueArrayInitializer = function() {
	this._mark();
	if(this._tryEat(Token.TK_LBRACE) != null) {
		
		var values = this._tryParseElementValues();
		this._tryEat(Token.TK_COMMA);
		
		if(this._tryEat(Token.TK_RBRACE) != null) {
			this._restore(true);
			return values;
		}
	}
	this._restore(false);
	return null;
};

/**
 * ElementValues:
 *   ElementValue { , ElementValue }
 */
Parser.prototype._tryParseElementValues = function() {
	var elemValue = this._tryParseElementValue();
	if(elemValue != null) {
		var values = [];
		values.push(elemValue);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				var elemValue = this._tryParseElementValue();
				if(elemValue != null) {
					values.push(elemValue);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		return values;
	}
	return null;
};


//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * @param classDecl, AST.ClassDecl
 * @param decl, AST.MethodDecl,AST.FieldDecl, AST.StaticBlock,AST.Block
 */
Parser.prototype._appendClassBodyDecl = function(classDecl, decl) {
	if(decl instanceof AST.MethodDecl) {
		classDecl.methods.push(decl);
	} else if(decl instanceof AST.FieldDecl){
		classDecl.fields.push(decl);
	} else if(decl instanceof AST.ClassDecl) {
		classDecl.inners.push(decl);
	} else if( decl instanceof AST.StaticBlock){
		classDecl.staticBlocks.push(decl);
	} else if( decl instanceof AST.Block) {
		classDecl.blocks.push(decl);
	} else if( decl instanceof AST.Skip) {
		// ignore , do nothing
	} else {
		throw "Unkown declaration";
	}
};

/**
 * ClassBody: 
 *   { { ClassBodyDeclaration } }
 */
Parser.prototype._tryParseClassBody = function(classDecl) {
	this._mark();
	if(this._tryEat(Token.TK_LBRACE) != null) {
		var decl = null;
		while((decl = this._tryParseClassBodyDeclaration() ) != null) {
			this._appendClassBodyDecl(classDecl, decl);
		}
		if(this._tryEat(Token.TK_RBRACE) != null) {
			this._restore(true);
			return classDecl;
		}
	}
	this._restore(false);
	return null;
};

/**
 * ClassBodyDeclaration:
 *   ; 
 *   {Modifier} MemberDecl
 *   [static] Block
 */
Parser.prototype._tryParseClassBodyDeclaration = function(){
	
	// parse: ;
	this._mark();
	if(this._tryEat(Token.TK_SEMI) != null) {
		this._restore(true);
		return new AST.Skip();
	}
	this._restore(false);
	
	// parse: [static] Block
	this._mark();
	
	var isStatic = (this._tryEat(Token.TK_STATIC) != null );
	var block = this._tryParseBlock(isStatic);
	if(block != null) {
		this._restore(true);
		return block;
	}
	this._restore(false);
	
	// parse: {Modifier} MemberDecl
	this._mark();
	
	var modifiers = this._tryParseModifiers();
	// we will method or field declaration here
	var decl = this._tryParseMemberDecl();
	if(decl != null) {
		decl.modifiers = modifiers;
		this._restore(true);
		return decl;
	}
	this._restore(false);
	
	return null;
};

/**
 * MemberDecl:
 *   MethodOrFieldDecl
 *   void Identifier VoidMethodDeclaratorRest
 *   Identifier ConstructorDeclaratorRest
 *   GenericMethodOrConstructorDecl
 *   ClassDeclaration
 *   InterfaceDeclaration
 */
Parser.prototype._tryParseMemberDecl = function() {
	
	
	// parse: void Identifier VoidMethodDeclaratorRest
	this._mark();
	if(this._tryEat(Token.TK_VOID) != null) {
		var identifier = this._tryParseIdentifier();
		if(identifier != null) {
			var decl = new AST.MethodDecl();
			if(this._tryParseVoidMethodDeclaratorRest(decl)) {
				decl.identifier = identifier;
				this._restore(true);
				return decl;
			}
		}
	}
	this._restore(false);
	
	//parse: Identifier ConstructorDeclaratorRest
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var decl = this._tryParseConstructorDeclaratorRest();
		if(decl != null) {
			decl.identifier = identifier;
			this._restore(true);
			return decl;
		}
	}
	this._restore(false);
	
	// parse: MethodOrFieldDecl
	var decl = this._tryParseMethodOrFieldDecl();
	if(decl != null) {
		return decl;
	}
	
	// parse: GenericMethodOrConstructorDecl
	decl = this._tryParseGenericMethodOrConstructorDecl();
	if(decl != null) {
		return decl;
	}
	
	// parse: ClassDeclaration
	decl = this._tryParseClassDeclaration();
	if(decl != null) {
		return decl;
	}
	
	// parse: InterfaceDeclaration
	decl = this._tryParseInterfaceDeclaration();
	if(decl != null) {
		return decl;
	}
	
	return null;
};

/**
 * MethodOrFieldDecl:
 *   Type Identifier MethodOrFieldRest
 */
Parser.prototype._tryParseMethodOrFieldDecl = function() {
	this._mark();
	var type = this._tryParseType();
	if(type != null) {
		var identifier = this._tryParseIdentifier() ;
		if(identifier != null) {
			// we leave AST.MethodDecl/AST.FieldDecl creation in _tryParseMethodOrFieldRest()
			var decl = this._tryParseMethodOrFieldRest();
			if(decl != null) {
				if(decl instanceof AST.MethodDecl) {
					decl.returnType = type;	
				} else if(decl instanceof AST.FieldDecl) {
					decl.type = type;
				} else {
					throw "Unknow type";
				}
				
				decl.identifier = identifier;
				this._restore(true);
				return decl;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * MethodOrFieldRest:  
 *   FieldDeclaratorsRest ;
 *   MethodDeclaratorRest
 *   
 *  @returns {AST.MethodDecl|AST.FieldDecl}
 */
Parser.prototype._tryParseMethodOrFieldRest = function() {
	
	// parse: MethodDeclaratorRest
	var decl = this._tryParseMethodDeclaratorRest();
	if(decl != null) {
		return decl; // return AST.MethodDecl
	}
	// parse:  FieldDeclaratorsRest ;
	this._mark();
	var decl = this._tryParseFieldDeclaratorsRest();
	if(decl != null) {
		if(this._tryEat(Token.TK_SEMI) != null) {
			this._restore(true);
			return decl; // return AST.FieldDecl
		}
	}
	this._restore(false);
	return null;
};

/**
 * FieldDeclaratorsRest:  
 *   VariableDeclaratorRest { , VariableDeclarator }
 *   
 *   @returns {AST.FieldDecl}
 */
Parser.prototype._tryParseFieldDeclaratorsRest = function() {
	
	var decl = new AST.FieldDecl();
	var rest = this._tryParseVariableDeclaratorRest();
	
	if(rest != null) {
		decl.dimCount = rest[0];
		this._assignExprOrNewArray(decl,rest[1]);
		
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				var varDecl = this._tryParseVariableDeclarator();
				if(varDecl != null) {
					decl.vars.push(varDecl);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		return decl;
	}
	return null;
};

/**
 * MethodDeclaratorRest:
 *   FormalParameters {[]} [throws QualifiedIdentifierList] (Block | ;)
 */
Parser.prototype._tryParseMethodDeclaratorRest = function() {
	this._mark();
	var params = this._tryParseFormalParameters();
	if(params != null) {
		var decl = new AST.MethodDecl();
		decl.params = params;
		decl.dimCount = this._tryDimCount();
		
		this._mark();
		var isSuccess = false;
		if(this._tryEat(Token.TK_THROWS) !=  null) {
			decl.throws_ = this._tryParseQualifiedIdentifierList();
			isSuccess = (decl.throws_ != null);
		}
		this._restore(isSuccess);
		
		if(this._tryEat(Token.TK_SEMI) != null) {
			this._restore(true);
			return decl;
		}
		
		decl.block = this._tryParseBlock();
		if(decl.block != null) {
			this._restore(true);
			return decl;
		}
	}
	
	this._restore(false);
	return null;
};

/**
 * VoidMethodDeclaratorRest:
 *   FormalParameters [throws QualifiedIdentifierList] (Block | ;)
 *   
 *   @returns boolean
 */
Parser.prototype._tryParseVoidMethodDeclaratorRest = function(methodDecl) {
	this._mark();
	var params = this._tryParseFormalParameters();
	if(params != null){
		
		methodDecl.params = params;
		this._mark();
		var isSuccess = false;
		if(this._tryEat(Token.TK_THROWS) !=  null) {
			methodDecl.throws_ = this._tryParseQualifiedIdentifierList();
			isSuccess = (methodDecl.throws_ != null);
		}
		this._restore(isSuccess);
		
		if(this._tryEat(Token.TK_SEMI) != null) {
			this._restore(true);
			return true;
		}
		
		methodDecl.block = this._tryParseBlock();
		if(methodDecl.block != null) {
			this._restore(true);
			return true;
		}
	}
	this._restore(false);
	return false;
};

/**
 * ConstructorDeclaratorRest:
 *   FormalParameters [throws QualifiedIdentifierList] Block
 */
Parser.prototype._tryParseConstructorDeclaratorRest = function() {
	this._mark();
	var params = this._tryParseFormalParameters();
	if(params != null){
		var decl = new AST.MethodDecl();
		decl.params = params;
		
		this._mark();
		var isSuccess = false;
		if(this._tryEat(Token.TK_THROWS) !=  null) {
			decl.throws_ = this._tryParseQualifiedIdentifierList();
			isSuccess = (decl.throws_ != null);
		}
		this._restore(isSuccess);
		
		decl.block = this._tryParseBlock();
		if(decl.block != null) {
			this._restore(true);
			return decl;
		}
	}
	this._restore(false);
	return null;
};

/**
 * GenericMethodOrConstructorDecl:
 *   TypeParameters GenericMethodOrConstructorRest
 */
Parser.prototype._tryParseGenericMethodOrConstructorDecl = function() {
	this._mark();
	var typeParams = this._tryParseTypeParameters();
	if(typeParams != null) {
		var decl = this._tryParseGenericMethodOrConstructorRest();
        if(decl != null) {
            decl.isGeneric = true;
            decl.returnType = typeParams;
            this._restore(true);
            return decl;
        }
	}
	this._restore(false);
	return null;
};

/**
 * GenericMethodOrConstructorRest:
 *   (Type | void) Identifier MethodDeclaratorRest
 *   Identifier ConstructorDeclaratorRest
 */
Parser.prototype._tryParseGenericMethodOrConstructorRest = function() {
	
	// parse: (Type | void) Identifier MethodDeclaratorRest
	this._mark();
	var isMethod = false ;
	var type = this._tryParseType();
	if(type != null) {
		isMethod = true;
	} else {
		isMethod = ( this._tryEat(Token.TK_VOID) != null );
	}
	if(isMethod) {
		var identifier = this._tryParseIdentifier();
		if(identifier != null) {
			var decl = this._tryParseMethodDeclaratorRest();
			if(decl != null) {
				this._restore(true);
				decl.identifier = identifier;
				return decl;
			}
		}
	}
	this._restore(false);
	
	// parse: Identifier ConstructorDeclaratorRest
	this._mark();
	var identifier = this._tryParseIdentifier() ;
	if(identifier != null) {
		var decl = this._tryParseConstructorDeclaratorRest();
		if(decl != null) {
			this._restore(true);
			decl.identifier  = identifier;
			return decl;
		}
	}
	this._restore(false);
	return null;
	
};

//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * InterfaceBody: 
 *   "{" { InterfaceBodyDeclaration } "}"
 */
Parser.prototype._tryParseInterfaceBody = function(classDecl) {
	this._mark();
	if(this._tryEat(Token.TK_LBRACE)!= null) {
		var decl = null;
		while((decl = this._tryParseInterfaceBodyDeclaration()) != null) {
			if(decl instanceof AST.MethodDecl) {
				classDecl.methods.push(decl);
			} else if(decl instanceof AST.FieldDecl) {
				classDecl.fields.push(decl);
			} else if ( decl instanceof AST.ClassDecl){
                classDecl.inners.push(decl);
            } else if( decl instanceof AST.Skip){
                // continue;
            } else {
				throw "Unknow declaration";
			}
		}
		
		if(this._tryEat(Token.TK_RBRACE) != null) {
			this._restore(true);
			return classDecl;
		}
	}
	
	this._restore(false);
	return null;
};

/**
 * InterfaceBodyDeclaration:
 *   ; 
 *   {Modifier} InterfaceMemberDecl
 */
Parser.prototype._tryParseInterfaceBodyDeclaration = function() {
	if(this._tryEat(Token.TK_SEMI) != null) {
		return new AST.Skip();
	}
	
	this._mark();
	var modifiers = this._tryParseModifiers();
	var decl = this._tryParseInterfaceMemberDecl();
	if(decl != null) {
		decl.modifiers = modifiers;
		this._restore(true);
		return decl;
	}

	this._restore(false);
	return null;
} ;

/**
 * InterfaceMemberDecl:
 *   InterfaceMethodOrFieldDecl
 *   void Identifier VoidInterfaceMethodDeclaratorRest
 *   InterfaceGenericMethodDecl
 *   ClassDeclaration
 *   InterfaceDeclaration
 */
Parser.prototype._tryParseInterfaceMemberDecl = function() {
	// parse: void Identifier VoidInterfaceMethodDeclaratorRest
	this._mark();
	if(this._tryEat(Token.TK_VOID) != null) {
		var identifier = this._tryParseIdentifier();
		if(identifier != null) {
			var decl = new AST.MethodDecl();
			decl.identifier = identifier;
			if( this._tryParseVoidInterfaceMethodDeclaratorRest(decl) ) {
				this._restore(true);
				return decl;
			}
		}
	}
	this._restore(false);
	
	// parse: InterfaceMethodOrFieldDecl
	var decl = this._tryParseInterfaceMethodOrFieldDecl();
	if(decl != null) {
		return decl;
	}
	
	// parse: InterfaceGenericMethodDecl
	decl = this._tryParseInterfaceGenericMethodDecl();
	if(decl != null) {
		return decl;
	}
	
	// parse: ClassDeclaration
	decl = this._tryParseClassDeclaration();
	if(decl != null) {
		return decl;
	}
	
	// parse: InterfaceDeclaration
	decl= this._tryParseInterfaceDeclaration();
	if(decl != null) {
		return decl;
	}
	
	return null;
};

/**
 * InterfaceMethodOrFieldDecl:
 *   Type Identifier InterfaceMethodOrFieldRest
 */
Parser.prototype._tryParseInterfaceMethodOrFieldDecl = function() {
	this._mark();
	var type = this._tryParseType();
	if(type != null) {
		var identifier = this._tryParseIdentifier() ;
		if(identifier != null) {
			var decl = this._tryParseInterfaceMethodOrFieldRest();
			if(decl != null) {
				decl.type = type;
				decl.identifier = identifier;
				this._restore(true);
				return decl;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * InterfaceMethodOrFieldRest:
 *   ConstantDeclaratorsRest ;
 *   InterfaceMethodDeclaratorRest
 *   
 *   @returns {AST.FieldDecl|AST.MethodDecl}
 */
Parser.prototype._tryParseInterfaceMethodOrFieldRest = function() {
	
	var decl = this._tryParseConstantDeclaratorsRest();
	if(decl != null){
		return decl;
	}
	
	decl = this._tryParseInterfaceMethodDeclaratorRest();
	if(decl != null) {
		return decl;
	}
	return null;
};

/**
 * use for assign expr/newarray for AST.FieldDecl/AST.VariableDecl
 * @param decl, of AST.FieldDecl/AST.VariableDecl
 * @param rest
 */
Parser.prototype._assignExprOrNewArray = function(decl,rest) {
	if(rest != null) {
		if(rest instanceof AST.Expression) {
			decl.expr = rest;
		} else if(rest instanceof Array) {
			decl.array = rest;
		} else {
            throw "Unknown rest";
        }
	}
};

/**
 * ConstantDeclaratorsRest: 
 *   ConstantDeclaratorRest { , ConstantDeclarator }
 */
Parser.prototype._tryParseConstantDeclaratorsRest = function() {
	this._mark();
	var rest = this._tryParseConstantDeclaratorRest();
	if(rest != null){
		var decl = new AST.FieldDecl();
		decl.dimCount = rest[0];
		this._assignExprOrNewArray(decl,rest[1]);
			
		
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				var varDecl = this._tryParseConstantDeclarator();
				if(varDecl != null) {
					decl.vars.push(varDecl);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		this._restore(true);
		return decl;
	}
	this._restore(false);
	return null;
};

/**
 * ConstantDeclaratorRest: 
 *   {[]} = VariableInitializer
 *   
 *   @returns tuple of [dimCount, initializer]
 */
Parser.prototype._tryParseConstantDeclaratorRest = function() {
	this._mark();
	var dimCount = this._tryDimCount();
	if(this._tryEat(Token.TK_EQ) != null) {
		var initializer = this._tryParseVariableInitializer();
		if(initializer != null) {
			this._restore(true);
			return [dimCount,initializer];
		}
	}
	this._restore(false);
	return null;
};

/**
 * ConstantDeclarator: 
 *   Identifier ConstantDeclaratorRest
 */
Parser.prototype._tryParseConstantDeclarator = function() {
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var rest = this._tryParseConstantDeclaratorRest();
		if(rest != null) {
			var decl = new AST.VariableDecl();
			decl.identifier = identifier;
			decl.dimCount = rest[0];
			this._assignExprOrNewArray(decl,rest[1]);
			
			this._restore(true);
			return decl;
		}
	}
	this._restore(false);
	return null;
};

/**
 * InterfaceMethodDeclaratorRest:
 *   FormalParameters {[]} [throws QualifiedIdentifierList] ;
 */
Parser.prototype._tryParseInterfaceMethodDeclaratorRest = function(){
	this._mark();
	var formalParams = this._tryParseFormalParameters();
	if(formalParams != null) {
		var decl = new AST.MethodDecl();
		decl.dimCount = this._tryDimCount();
		
		this._mark();
		var isSuccess = false;
		if(this._tryEat(Token.TK_THROWS) != null){
			decl.throws_ = this._tryParseQualifiedIdentifierList();
			isSuccess = (decl.throws_ != null);
		}
		this._restore(isSuccess);
		
		this._restore(true);
		return decl;
	}
	this._restore(false);
	return null;
};

/**
 * VoidInterfaceMethodDeclaratorRest:
 *   FormalParameters [throws QualifiedIdentifierList] ;
 */
Parser.prototype._tryParseVoidInterfaceMethodDeclaratorRest = function(methodDecl) {
	var params = this._tryParseFormalParameters();
	if(params != null) {
		
		this._mark();
		var isSuccess = false;
		if(this._tryEat(Token.TK_THROWS) != null) {
			methodDecl.throws_ = this._tryParseQualifiedIdentifierList();
			isSuccess = (methodDecl.throws_ != null);
		}
		this._restore(isSuccess);
		
		methodDecl.params = params;
		return true;
	}
	return false;
};

/**
 * InterfaceGenericMethodDecl:
 *   TypeParameters (Type | void) Identifier InterfaceMethodDeclaratorRest
 */
Parser.prototype._tryParseInterfaceGenericMethodDecl = function() {
	this._mark();
	var typeParams = this._tryParseTypeParameters();
	if(typeParams != null) {
		var decl = new AST.MethodDecl();
		decl.returnType = this._tryParseType();
		if(decl.returnType == null) {
			decl.returnType = this._tryEat(Token.TK_VOID) ;
		}
		if(decl.returnType != null) {
			decl.identifier = this._tryParseIdentifier();
			if(decl.identifier != null) {
				decl.rest = this._tryParseInterfaceMethodDeclaratorRest();
				if(decl.rest != null) {
					this._restore(true);
					return decl;
				}
			}
		}
	}
	this._restore(false);
	return null;
};
//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * FormalParameters: 
 *   ( [FormalParameterDecls] )
 */
Parser.prototype._tryParseFormalParameters = function() {
	this._mark();
	if(this._tryEat(Token.TK_LPAREN) != null) {
		var params = [];
		this._tryParseFormalParameterDecls(params);
		if(this._tryEat(Token.TK_RPAREN) != null) {
			this._restore(true);
			return params;
		}
	}
	this._restore(false);
	return null;
};

/**
 * FormalParameterDecls: 
 *   {VariableModifier}  Type FormalParameterDeclsRest
 *   
 * @returns ABS.Paramter object, null for failure
 */
Parser.prototype._tryParseFormalParameterDecls = function(decls) {
	this._mark();
	
	var decl = new AST.VariableDecl();
	decl.modifiers = this._tryParseVariableModifiers();
	decl.type = this._tryParseType();
	
	if(decl.type != null) {
		if(this._tryParseFormalParameterDeclsRest(decls,decl)) {
			this._restore(true);
			return true;
		}
	}
	this._restore(false);
	return false;
};


/**
 * FormalParameterDeclsRest: 
 *   VariableDeclaratorId [ , FormalParameterDecls ]
 *   ... VariableDeclaratorId
 *   
 *   @returns, true/false 
 */
Parser.prototype._tryParseFormalParameterDeclsRest = function(decls,param) {
	
	// parse: ... VariableDeclaratorId
	this._mark();
	if(this._tryEat(Token.TK_ELLIPSIS) != null) {
		var id = this._tryParseVariableDeclaratorId();
		if( id != null) {
			param.identifier = id[0];
			param.dimCount = id[1];
			decls.push(param);
			this._restore(true);
			return true;
		}
	}
	this._restore(false);
	
	// parse: VariableDeclaratorId [ , FormalParameterDecls ]
	this._mark();
	var id = this._tryParseVariableDeclaratorId(param);
	if(id != null) {
		param.identifier = id[0];
		param.dimCount = id[1];
		decls.push(param);
		this._mark();
		var isSuccess = false;
		if(this._tryEat(Token.TK_COMMA) != null) {
			if(this._tryParseFormalParameterDecls(decls)) {
				isSuccess = true;
			}
		}
		this._restore(isSuccess);
		this._restore(true);
		return true;
	}
	this._restore(false);
	return false;
};

/**
 * VariableDeclaratorId:
 *   Identifier {[]}
 *   
 * @param param, AST.Parameter object instance
 * @returns tuple of [identifier, dimCount]
 */
Parser.prototype._tryParseVariableDeclaratorId = function() {
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var dimCount = this._tryDimCount();
		this._restore(true);
		return [identifier,dimCount];
	}
	this._restore(false);
	return null;
};

/**
 * VariableDeclarators:
 *   VariableDeclarator { , VariableDeclarator }
 */
Parser.prototype._tryParseVariableDeclarators = function(){
	var decl = this._tryParseVariableDeclarator();
	if(decl != null) {
		var decls = [];
		decls.push(decl);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				var decl = this._tryParseVariableDeclarator();
				if(decl != null) {
					decls.push(decl);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		return decls;
	}
	return null;
};


/**
 * VariableDeclarator:
 *   Identifier VariableDeclaratorRest
 */
Parser.prototype._tryParseVariableDeclarator = function(){
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var rest = this._tryParseVariableDeclaratorRest();
		if(rest != null){
			this._restore(true);
			var decl = new AST.VariableDecl();
			decl.identifier = identifier;
			decl.dimCount = rest[0];
			decl.expr = rest[1];
			return decl;
		}
	}
	this._restore(false);
	return null;
};

/**
 * VariableDeclaratorRest:
 *   {[]} [ = VariableInitializer ]
 *   
 * @return {[dimCount, AST.NewArray/AST.Expression]}
 */
Parser.prototype._tryParseVariableDeclaratorRest = function(){

    var rest = null;
    var dimCount = this._tryDimCount();

    this._mark();
    var isSuccess = false;
	if(this._tryEat(Token.TK_EQ) != null) {
		rest = this._tryParseVariableInitializer();
        if(rest == null) {
            throw "Initializer Error";
        }

		isSuccess = (rest != null);
	}
	this._restore(isSuccess);
	return [dimCount,rest];
};

/**
 * VariableInitializer:
 *   ArrayInitializer
 *   Expression
 */
Parser.prototype._tryParseVariableInitializer = function(){
	
	var newArray = this._tryParseArrayInitializer();
	if(newArray != null) {
		return newArray;
	}
	var expr = this._tryParseExpression();
	if(expr != null) {
		return expr ;
	}
	
	return null;
};

/**
 * ArrayInitializer:
 *   "{" [ VariableInitializer { "," VariableInitializer } [","] ] "}"
 */
Parser.prototype._tryParseArrayInitializer = function(){
	this._mark();
	if(this._tryEat(Token.TK_LBRACE)!= null) {
		
		var initializers = [];
		var initializer = this._tryParseVariableInitializer();
		if(initializer != null) {
			initializers.push(initializer);
			while(true) {
				this._mark();
				if(this._tryEat(Token.TK_COMMA) != null) {
					initializer = this._tryParseVariableInitializer();
					if(initializer != null) {
						this._restore(true);
						initializers.push(initializer);
						continue;
					}
				}
				this._restore(false);
				break;
			}
            this._tryEat(Token.TK_COMMA) ;
		}
		if(this._tryEat(Token.TK_RBRACE) != null) {
			this._restore(true);
			return initializers;
		}
	}
	this._restore(false);
	return null;
};

//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Block: 
 *   "{" BlockStatements "}"
 * @returns AST.Block;
 */
Parser.prototype._tryParseBlock = function(isStatic) {
	this._mark();
	if(this._tryEat(Token.TK_LBRACE) != null) {
		var block = (isStatic ? (new AST.StaticBlock()): (new AST.Block()));
		block.stats = this._tryParseBlockStatements();
		if(this._tryEat(Token.TK_RBRACE) != null) {
			this._restore(true);
			return block;
		}
	}
	this._restore(false);
	return null;
};

/**
 * BlockStatements: 
 *   { BlockStatement }
 * @param(block) AST.Block
 */
Parser.prototype._tryParseBlockStatements = function(){
	var stats = [];
	var stat = null;
	while((stat = this._tryParseBlockStatement()) != null) {
		if(stat instanceof Array) {
			stats = stats.concat(stat);
		} else {
			stats.push(stat);
		}
	}
	return stats;
};

/**
 * BlockStatement:
 *   LocalVariableDeclarationStatement
 *   ClassOrInterfaceDeclaration
 *   [Identifier :] Statement
 */
Parser.prototype._tryParseBlockStatement = function(){
	
	
	// parse: LocalVariableDeclarationStatement
	var stat = this._tryParseLocalVariableDeclarationStatement();
	if(stat != null) {
		return stat;
	}
	
	// parse: ClassOrInterfaceDeclaration
	var stat = this._tryParseClassOrInterfaceDeclaration();
	if(stat != null) {
		return stat;
	}
	
	// parse: [Identifier :] Statement
	this._mark();
	this._mark();
	var label = this._tryParseIdentifier();
	var success = false;
	if(label != null) {
		success = (this._tryEat(Token.TK_COLON) != null);
	}
	this._restore(success);
	
	stat = this._tryParseStatement();
	if(stat != null) {
		if(success) {
			var labelStat = new AST.LabeledStatement();
			labelStat.label = label;
			labelStat.stat = stat;
			stat = labelStat;
		}
		this._restore(true);
		return stat;
	}
	this._restore(false);
	return null;
};

/**
 * LocalVariableDeclarationStatement:
 *   { VariableModifier }  Type VariableDeclarators ;
 */
Parser.prototype._tryParseLocalVariableDeclarationStatement = function() {
	this._mark();
	
	var modifiers  = this._tryParseVariableModifiers();
	var type = this._tryParseType();
	if(type != null) {
		
		var decls = this._tryParseVariableDeclarators();
		if(decls != null) {
			for( var k in decls) {
				decls[k].modifiers = modifiers;
				decls[k].type = type;
			}
			
			if(this._tryEat(Token.TK_SEMI) != null) {
				this._restore(true);
				return decls;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * Statement:
 *   Block
 *   ;
 *   Identifier : Statement
 *   StatementExpression ;
 *   if ParExpression Statement [else Statement] 
 *   assert Expression [: Expression] ;
 *   switch ParExpression { SwitchBlockStatementGroups } 
 *   while ParExpression Statement
 *   do Statement while ParExpression ;
 *   for ( ForControl ) Statement
 *   break [Identifier] ;
 *   continue [Identifier] ;
 *   return [Expression] ;
 *   throw Expression ;
 *   synchronized ParExpression Block
 *   try Block ( Catches | [Catches] Finally )
 *   try ResourceSpecification Block [Catches] [Finally]
 */
Parser.prototype._tryParseStatement = function() {
	
	// parse: Block
	var stat = this._tryParseBlock();
	if(stat != null){
		return stat;
	}
	
	// parse: ;
	if(this._tryEat(Token.TK_SEMI) != null){
		return new AST.Skip();
	}
	
	// parse: Identifier : Statement
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		if(this._tryEat(Token.TK_COLON) != null) {
			var lstat = this._tryParseStatement();
			if(lstat != null) {
				stat.label = identifier;
				stat.stat = lstat;
				this._restore(true);
				return stat;
			}
		}
	}
	this._restore(false);
	
	
	// parse: StatementExpression ;
	this._mark();
	var statExpr = this._tryParseStatementExpression();
	if(statExpr != null) {
		if(this._tryEat(Token.TK_SEMI) != null) {
			this._restore(true);
			return statExpr;
		}
	}
	this._restore(false);
	
	var isSuccess = false;
	
	// parse: if ParExpression Statement [else Statement]
	this._mark();
	if(this._tryEat(Token.TK_IF) != null) {
		var parExpr = this._tryParseParExpression();
		if(parExpr != null) {
			var truepart = this._tryParseStatement();
			if(truepart != null) {
				
				var stat = new AST.If();
				stat.cond = parExpr;
				stat.truepart = truepart;
				
				// parse: [else Statement]

				if(this._tryEat(Token.TK_ELSE) != null) {
					stat.elsepart = this._tryParseStatement() ;
                    if(stat.elsepart == null) {
                        throw "If else wrong";
                    }
				}
				this._restore(true);
				return stat;
			}
		}
	}
	this._restore(false);
	
	// parse: assert Expression [: Expression] ;
	this._mark();
	if(this._tryEat(Token.TK_ASSERT) != null) {
		var expr = this._tryParseExpression();
		if(expr != null) {
			this._mark();
			isSuccess = false;
			var detail = null;
			if(this._tryEat(Token.TK_COLON) != null) {
				detail = this._tryParseExpression();
				isSuccess = (detail != null);
			}
			this._restore(isSuccess);
			
			if(this._tryEat(Token.TK_SEMI) != null) {
				var stat = new AST.Assert();
				stat.cond = expr;
				stat.detail = detail;
				this._restore(true);
				return stat;
			}
		}
	}
	this._restore(false);
	
	// parse: switch ParExpression "{" SwitchBlockStatementGroups "}"
	this._mark();
	if(this._tryEat(Token.TK_SWITCH) != null) {
		
		var stat = new AST.Switch();
		stat.selector = this._tryParseParExpression();
		
		if(stat.selector != null) {
			if(this._tryEat(Token.TK_LBRACE) != null) {
				if(this._tryParseSwitchBlockStatementGroups(stat)) {
					if(this._tryEat(Token.TK_RBRACE) != null) {
						this._restore(true);
						return stat;		
					}
				}
			}
			
		}
	}
	this._restore(false);
	
	// parse: while ParExpression Statement
	this._mark();
	if(this._tryEat(Token.TK_WHILE) != null) {
		var expr = this._tryParseParExpression();
		if(expr != null) {
			var stat = this._tryParseStatement();
			if(stat != null) {
                var wstat = new AST.While();
                wstat.cond = expr;
				wstat.body = stat;
				this._restore(true);
				return wstat;
			}
		}
	}
	this._restore(false);
	
	// parse: do Statement while ParExpression ;
	this._mark();
	if(this._tryEat(Token.TK_DO) != null) {
		var s = this._tryParseStatement();
		if(s != null) {
			if(this._tryEat(Token.TK_WHILE) != null) {
				var parExpr = this._tryParseExpression();
				if(parExpr != null) {
					if(this._tryEat(Token.TK_SEMI) != null) {
                        var doWhile = new AST.DoWhile();
                        doWhile.cond = parExpr;
						doWhile.body = s;
						this._restore(true);
						return doWhile;
					}
				}
			}
		}
	}
	this._restore(false);
	
	// parse: for ( ForControl ) Statement
	this._mark();
	if(this._tryEat(Token.TK_FOR) != null) {
		var stat = this._tryParseForControl();
		if(stat != null) {
			this._restore(true);
			return stat;
		}
	}
	this._restore(false);
	
	// parse: break [Identifier] ;
	this._mark();
	if(this._tryEat(Token.TK_BREAK) != null) {
        var stat = new AST.Break();
		var identifier = this._tryParseIdentifier();
        if(identifier != null){
            stat.label = identifier;
        }
		if(this._tryEat(Token.TK_SEMI) != null) {
			this._restore(true);
            return stat;
		}

	}
	this._restore(false);
	
	// parse: continue [Identifier] ;
	this._mark();
	if(this._tryEat(Token.TK_CONTINUE) != null) {
		var identifier = this._tryParseIdentifier();
		if(this._tryEat(Token.TK_SEMI) != null) {
			var stat = new AST.Continue();
            stat.label = identifier;
			this._restore(true);
			return stat;
		}
	}
	this._restore(false);
	
	
	// parse: return [Expression] ;
	this._mark();
	if(this._tryEat(Token.TK_RETURN) != null) {
		var expr = this._tryParseExpression();
		if(this._tryEat(Token.TK_SEMI) != null) {
			this._restore(true);
			var stat = new AST.Return();
			stat.expr = expr;
			return stat;
		}
	}
	this._restore(false);
	
	// parse: throw Expression ;
	this._mark();
	if(this._tryEat(Token.TK_THROW) != null) {
		var expr = this._tryParseExpression();
		if(expr != null) {
			if(this._tryEat(Token.TK_SEMI) != null) {
				this._restore(true);
				var stat = new AST.Throw();
				stat.expr = expr;
				return stat;
			}
		}
	}
	this._restore(false);
	
	// parse: synchronized ParExpression Block
	this._mark();
	if(this._tryEat(Token.TK_SYNCHRONIZED) != null) {
		var parExpr = this._tryParseParExpression();
		if(parExpr != null) {
			var block = this._tryParseBlock();
			if(block != null) {
				var stat = new AST.Synchronized() ;
                stat.lock = parExpr;
				stat.body = block;
				this._restore(true);
				return stat;
			}
		}
	}
	this._restore(false);
	
	// parse: try Block ( Catches | [Catches] Finally )
	this._mark();
	if(this._tryEat(Token.TK_TRY) != null) {
		var block = this._tryParseBlock();
		if(block != null) {
			var catches = this._tryParseCatches();
			var finalizer = this._tryParseFinally();
			if(catches != null || finalizer != null) {
				this._restore(true);
				var stat = new AST.Try();
				stat.block = block;
				stat.catches = catches;
				stat.finalizer = finalizer;
				return stat;
			}
		}
	}
	this._restore(false);
	
	// parse: try ResourceSpecification Block [Catches] [Finally]
	this._mark();
	if(this._tryEat(Token.TK_TRY) != null) {
		var spec = this._tryParseResourceSpecification();
		if(spec != null) {
			var block = this._tryParseBlock();
			if(block != null) {
				var stat = new AST.Try();
                stat.resources = spec;
				stat.block = block;
				stat.catches = this._tryParseCatches();
				stat._finally = this._tryParseFinally();
				this._restore(true);
				return stat;
			}
		}
	}
	this._restore(false);
	
	return null;
};

/**
 * StatementExpression: 
 *   Expression
 */
Parser.prototype._tryParseStatementExpression = function() {
	var expr = this._tryParseExpression();
	if(expr != null) {
		var stat = new AST.ExpressionStatement();
		stat.expr = expr;
		return stat;
	}
	return null;
};

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Catches:
 *   CatchClause { CatchClause }
 */
Parser.prototype._tryParseCatches = function() {

	var clause = this._tryParseCatchClause();
	if(clause != null) {
		var catches = [];
		catches.push(clause);
		while((clause =this._tryParseCatchClause()) != null) {
			catches.push(clause);
		}
		return catches;
	}
	return null;
};

/**
 * CatchClause:  
 *   catch "(" {VariableModifier} CatchType Identifier ")" Block
 */
Parser.prototype._tryParseCatchClause = function() {
	this._mark();
	if(this._tryEat(Token.TK_CATCH) != null) {
		if(this._tryEat(Token.TK_LPAREN) != null) {
			
			var modifiers = this._tryParseVariableModifiers();
			
			var catchType = this._tryParseCatchType();
			if(catchType != null) {
				var identifier = this._tryParseIdentifier();
				if(identifier != null) {
					if(this._tryEat(Token.TK_RPAREN) != null) {
						var block = this._tryParseBlock();
						if(block != null) {
							this._restore(true);
							
							var clause = new AST.Catch();
							clause.modifiers = modifiers;
							clause.qualifiedIdents = catchType;
							clause.identifier = identifier;
							clause.block = block;
							return clause;
						}
					}
				}
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * CatchType:
 *   Identifier { | Identifier }
 */
Parser.prototype._tryParseCatchType = function() {
	
	var qualifiedIdentifier = this._tryParseQualifiedIdentifier() ;
	if(qualifiedIdentifier != null) {
		var qis = [];
		qis.push(qualifiedIdentifier);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_BAR) != null) {
				qualifiedIdentifier = this._tryParseQualifiedIdentifier();
				qis.push(qualifiedIdentifier);
				this._restore(true);
				continue;
			}
			this._restore(false);
			break;
		}
		return qis;
	}
	return null;
};

/**
 * Finally:
 *   finally Block
 */
Parser.prototype._tryParseFinally = function() {
	this._mark();
	if(this._tryEat(Token.TK_FINALLY) != null) {
		var block = this._tryParseBlock();
		if(block != null) {
			this._restore(true);
			return block;
		}
	}
	this._restore(false);
	return null;
};

/**
 * ResourceSpecification:
 *   ( Resources [;] )
 */
Parser.prototype._tryParseResourceSpecification = function() {
	this._mark();
	if(this._tryEat(Token.TK_LPAREN) != null) {
		var resources = this._tryParseResources();
		if(resources != null) {
			this._tryEat(Token.TK_SEMI);
			if(this._tryEat(Token.TK_RPAREN) != null) {
				this._restore(true);
				return resources;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * Resources:
 *   Resource { ; Resource }
 */
Parser.prototype._tryParseResources = function() {
	this._mark();
	var res = this._tryParseResource();
	if(res != null) {
		var resources = [];
		resources.push(res);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_SEMI) != null) {
				res = this._tryParseResource();
				if(res != null) {
					resources.push(res);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		
		this._restore(true);
		return resources;
	}
	this._restore(false);
	return null;
};

/**
 * Resource:
 *   {VariableModifier} ReferenceType VariableDeclaratorId = Expression
 */
Parser.prototype._tryParseResource = function() {
	var varDecl = new AST.VariableDecl();

	this._mark();
	varDecl.modifiers = this._tryParseVariableModifiers();
    varDecl.type = this._tryParseReferenceType();

	if(varDecl.type != null) {
		varDecl.identifier = this._tryParseVariableDeclaratorId();
		if(varDecl.identifier != null) {
			if(this._tryEat(Token.TK_EQ) != null){
				varDecl.expr = this._tryParseExpression();
				if(varDecl.expr != null) {
					this._restore(true);
					return varDecl;
				}
			}
		}
	}
	this._restore(false);
	return null;
};



//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * SwitchBlockStatementGroups: 
 *   { SwitchBlockStatementGroup }
 */
Parser.prototype._tryParseSwitchBlockStatementGroups = function(switchStat) {
	
	var group = null ;
	while((group = this._tryParseSwitchBlockStatementGroup()) != null){
		if(group instanceof AST.Default) {
			if(switchStat.default_ != null) {
				throw "Not implemented-- already have a default statement";
			}
			switchStat.default_ = group;
		} else {
			switchStat.cases = switchStat.cases.concat(group);
		}
	}
	return true;
};

/**
 * SwitchBlockStatementGroup: 
 *   SwitchLabels BlockStatements
 */
Parser.prototype._tryParseSwitchBlockStatementGroup = function() {
	this._mark();
	
	var cases = this._tryParseSwitchLabels();
	if(cases != null) {
		var stats = this._tryParseBlockStatements();
		if(stats != null) {
			this._restore(true);
			cases[cases.length -1].stat = stats;
			return cases;
		}
	}
	this._restore(false);
	return null;
};

/**
 * SwitchLabels:
 *   SwitchLabel { SwitchLabel }
 */
Parser.prototype._tryParseSwitchLabels = function() {
	var cases = [];
	while((label = this._tryParseSwitchLabel()) != null) {
		cases.push(label);
	}
	return (cases.length) > 0 ? cases: null;
};

/**
 * SwitchLabel: 
 *   case Expression :
 *   case EnumConstantName :
 *   default :
 */
Parser.prototype._tryParseSwitchLabel = function() {
	
	// parse: default :
	this._mark();
	if(this._tryEat(Token.TK_DEFAULT) != null) {
		if(this._tryEat(Token.TK_COLON) != null) {
			var stat = new AST.Default();
			this._restore(true);
			return stat;
		}
	}
 	this._restore(false);
 	
 	// parse: case Expression :
 	// 		  case EnumConstantName :
 	
 	this._mark();
 	if(this._tryEat(Token.TK_CASE) != null) {
 		
 		this._mark();
 		var name = this._tryParseEnumConstantName();
 		if(name != null){
 			if(this._tryEat(Token.TK_COLON) != null) {
 				var stat = new AST.Case();
 				stat.pat = name;
 				this._restore(true);
 				this._restore(true);
 				return stat;
 			}
 		}
 		this._restore(false);
 		
 		var expr = this._tryParseExpression();
 		if(expr != null){
 			if(this._tryEat(Token.TK_COLON) != null) {
 				var stat = new AST.Case();
 				stat.pat = expr;
 				this._restore(true);
 				this._restore(true);
 				return stat;
 			}
 		}
 	}
 	this._restore(false);
 	return null;
};

/**
 * EnumConstantName:
 *   Identifier
 */
Parser.prototype._tryParseEnumConstantName = function() {
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var ident = new AST.Ident();
		ident.identifiers.push(identifier);
		return ident;
	}
	return null;
};

/**
 * ForControl:
 *   FOR "(" ForInitOpt ";" [Expression] ";" ForUpdateOpt ")" Statement
 *   FOR "(" {VariableModifiers} Type VariableDeclaratorId : Expression ")" Statement
 */
Parser.prototype._tryParseForControl = function() {
	
	this._mark();
	
	if(this._tryEat(Token.TK_LPAREN) != null) {
		var forInit = this._tryParseForInit();
		if(this._tryEat(Token.TK_SEMI) != null) {
			var expr = this._tryParseExpression();
			if(this._tryEat(Token.TK_SEMI) != null) {
				var forUpdate = this._tryParseForUpdate();
				if(this._tryEat(Token.TK_RPAREN) != null) {
					var body = this._tryParseStatement();
					if(body != null) {
						this._restore(true);
						
						var forStat = new AST.For();
						forStat.init = forInit;
						forStat.cond = expr;
						forStat.step = forUpdate;
						forStat.body = body;
						return forStat;
					
					}
				}
			}
		}
	}
	this._restore(false);
	
	
	this._mark();
	if(this._tryEat(Token.TK_LPAREN) != null){
		var modifiers = this._tryParseVariableModifiers();
		var type = this._tryParseType();
		if(type != null){
			var id = this._tryParseVariableDeclaratorId();
			if( id != null) {
				var var_ = new AST.VariableDecl();
				var_.identifier = id[0];
				var_.dimCount = id[1];
				var_.modifiers = modifiers;
				var_.type = type;
				if(this._tryEat(Token.TK_COLON) != null) {
					var expr = this._tryParseExpression();
					if(expr != null) {
						if(this._tryEat(Token.TK_RPAREN) != null) {
							var body = this._tryParseStatement();
							if(body != null){
								this._restore(true);
								
								var enhanedFor = new AST.EnhancedFor();
								enhanedFor.var_ = var_;
								enhanedFor.expr = expr;
								enhanedFor.body = body;
								return enhanedFor;
							}
						}
					}
				}
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * ForInit:
 *  { VariableModifier } Type VariableDeclarators
 *  StatementExpression { , StatementExpression }
 */
Parser.prototype._tryParseForInit = function(){
	var stats = [];
	this._mark();
	var modifiers = this._tryParseVariableModifiers();
	var type = this._tryParseType();
	if(type != null){
		var decls = this._tryParseVariableDeclarators();
		if(decls != null){
			for(var k in decls){
				var decl =  decls[k];
				decl.type = type;
				decl.modifiers = modifiers;
				stats.push(decl);
			}
			this._restore(true);
			return stats;
		}
	}
	this._restore(false);
	
	return this._tryParseForUpdate();
};

/**
 * ForUpdate:
 *   StatementExpression { , StatementExpression }
 * 
 * @return Array of AST.Statement
 */
Parser.prototype._tryParseForUpdate = function() {
	this._mark();
	var stat = this._tryParseStatementExpression();
	if(stat != null) {
		var stats = [];
		stats.push(stat);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				stat = this._tryParseStatementExpression();
				if(stat != null) {
					stats.push(stat);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		return stats;
	}
	this._restore(false);
	return null;
};

//-------------------------------------------------------------------------------------------------------------------------------------------------------------


/**
 * Expression: 
 *   Expression1 [ AssignmentOperator Expression1 ]
 */
Parser.prototype._tryParseExpression = function() {
	var lexpr = this._tryParseExpression1();
	if(lexpr != null) {
		
		this._mark();
		var operator = this._tryParseAssignmentOperator();
		if(operator != null) {
			var rexpr = this._tryParseExpression();
			if(rexpr != null) {
				var assignOp = new AST.AssignOp(); 
				assignOp.lexpr = lexpr;
				assignOp.op = operator;
				assignOp.rexpr = rexpr;
				this._restore(true);
				return assignOp ;
			}
		} 
		
		this._restore(false);
		return lexpr;
		
	}
	return null;
} ;

/**
 * AssignmentOperator: 
 *   = 
 *   +=
 *   -= 
 *   *=
 *   /=
 *   &=
 *   |=
 *   ^=
 *   %=
 *   <<=
 *   >>=
 *   >>>= 
 */
Parser.prototype._tryParseAssignmentOperator = function() {
	var t = this._visitor.next() ;
	switch(t.tk) {
	case Token.TK_EQ:
	case Token.TK_STAREQ:
	case Token.TK_SLASHEQ:
	case Token.TK_PERCENTEQ:
	case Token.TK_PLUSEQ:
	case Token.TK_SUBEQ:
	case Token.TK_BAREQ:
	case Token.TK_LTLTEQ:
	case Token.TK_GTGTEQ:
	case Token.TK_GTGTGTEQ:
	case Token.TK_AMPEQ:
	case Token.TK_CARETEQ:
	case Token.TK_BANDEQ:
		return t.tk;
	default:
		this._visitor.prev() ;
		return null;
	}
} ;

/**
 * Expression1: 
 *   Expression2 [ Expression1Rest ]
 */
Parser.prototype._tryParseExpression1 = function() {
	var expr2 = this._tryParseExpression2();
	if(expr2 != null) {
		var rest = this._tryParseExpression1Rest();
		if(rest == null) {
			return expr2;
		}
		// a conditional expression
		rest.cond = expr2;
		return rest;
	}
	return null;
};

/**
 * Expression2:
 *   Expression3 [ Expression2Rest ]
 */
Parser.prototype._tryParseExpression2 = function() {
	var expr3 = this._tryParseExpression3();
	if(expr3 != null) {
		var rest = this._tryParseExpression2Rest(expr3);
		return (rest == null) ? expr3 : rest;
	}
	return null;
};

/**
 * Expression3: 
 *   PrefixOp Expression3
 *   ( Expression | Type ) Expression3
 *   Primary { Selector } { PostfixOp }
 */
Parser.prototype._tryParseExpression3 = function() {
	
	// parse: PrefixOp Expression3
	this._mark();
	var prefixOp = this._tryParsePrefixOp();
	if(prefixOp != null) {
		var expr3 = this._tryParseExpression3();
		if(expr3 != null) {
			this._restore(true);
			var unary = new AST.Unary();
			unary.prefixOp = prefixOp;
			unary.expr = expr3;
			return unary;
		}
	}
	this._restore(false);
	// end parse: PrefixOp Expression3
	
	
	//parse: ( Expression | Type ) Expression 3
	this._mark();
	if(this._tryEat(Token.TK_LPAREN) != null) {
		var type = this._tryParseType() ;
		
		if(type == null) {
			type = this._tryParseExpression();
		}
		
		if(type != null) {
			if(this._tryEat(Token.TK_RPAREN) != null) {
				var expr  = this._tryParseExpression3();
				if(expr != null) {
					this._restore(true);
					var cast = new AST.TypeCast();
					cast.type = type;
					cast.expr = expr;
					return cast;
				}
			}
		}
	}
	this._restore(false);
	// end parse 
	
	// parse: Primary { Selector } { PostfixOp }
	this._mark();
	var primary = this._tryParsePrimary();
	if(primary != null) {
		
		var result = primary; 
		while(true) {
			this._mark();
			var selector = this._tryParseSelector();
			if(selector != null) {
				if(selector instanceof AST.MethodInvocation || selector instanceof AST.ArrayAccess || selector instanceof AST.NewClass) {
					selector.parent = result;
					result = selector;
				} else {
					throw "Not implemented";
				}
				this._restore(true);
				continue;
			}
			this._restore(false);
			break;
		}
		
		
		while(true) {
			this._mark();
			var postfixOp = this._tryParsePostfixOp();
			if( postfixOp != null) {
				var unary = new AST.Unary();
				unary.postfixOp = postfixOp;
				unary.expr = result;
				result = unary;
				this._restore(true);
				continue;
			}
			this._restore(false);
			break;
		}
		this._restore(true);
		return result;
	}
	this._restore(false) ;
	// end parse
	return null;
};


/**
 * Expression1Rest: 
    ? Expression : Expression1
 */
Parser.prototype._tryParseExpression1Rest = function() {
	this._mark();
	if(this._tryEat(Token.TK_QUES) !=null ) {
		var trueexpr = this._tryParseExpression();
		if(trueexpr != null) {
			if(this._tryEat(Token.TK_COLON) != null) {
				var falseexpr = this._tryParseExpression1() ;
				if(falseexpr != null) {
					var cond = new AST.Conditional();
					cond.truepart = trueexpr;
					cond.falsepart = falseexpr;
					this._restore(true);
					return cond;
				}
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * Expression2Rest:
 *   { InfixOp Expression3 }
 *   Expression3 instanceof Type
 */
Parser.prototype._tryParseExpression2Rest = function(lexpr) {

    var success = false;
    // parse: Expression3 instanceof Type
    this._mark();
    if(this._tryEat(Token.TK_INSTANCEOF) != null) {
        var type = this._tryParseType();
        if(type != null) {
            var iof = new AST.InstanceOf();
            iof.expr = lexpr;
            iof.clazz = type;
            lexpr = iof ;
            success = true;
        }
    }
    this._restore(success);

    // parse { InfixOp Expression3 }
    while(true) {
        this._mark();
        var infixOp = this._tryParseInfixOp();
        if(infixOp != null) {
            var rexpr = this._tryParseExpression2();
            if(rexpr != null) {
                this._restore(true);
                var binary = new AST.Binary();
                binary.lexpr = lexpr;
                binary.op = infixOp;
                binary.rexpr = rexpr;
                lexpr = binary;
                success = true;
                continue;
            }
        }
        this._restore(false);
        break;
    }
    // end parse
    return success ? lexpr : null;

};


/**
 * ParExpression: 
 *   ( Expression )
 */
Parser.prototype._tryParseParExpression = function() {
	this._mark();
	if(this._tryEat(Token.TK_LPAREN) != null) {
		var expr = this._tryParseExpression();
		if(expr != null) {
			if(this._tryEat(Token.TK_RPAREN) != null) {
				this._restore(true);
				var parExpr = new AST.Parens();
				parExpr.expr = expr;
				return parExpr;
			}
		}
	}
	this._restore(false);
	return null;
} ;


/**
 * InfixOp: 
 *   || 
 *   &&
 *   |
 *   ^
 *   &
 *   ==
 *   !=
 *   <
 *   >
 *   <=
 *   >=
 *   <<
 *   >>
 *   >>>
 *   +
 *   -
 *   *
 *   /
 *   %
 */
Parser.prototype._tryParseInfixOp = function() {
	var token= this._visitor.next();
	switch(token.tk) {
	case Token.TK_BARBAR:
	case Token.TK_AMPAMP:
	case Token.TK_BAR:
	case Token.TK_CARET:
	case Token.TK_AMP:
	case Token.TK_EQEQ:
	case Token.TK_BANDEQ:
	case Token.TK_LT:
	case Token.TK_GT:
	case Token.TK_LTEQ:
	case Token.TK_GTEQ:
	case Token.TK_LTLT:
	case Token.TK_GTGT:
	case Token.TK_GTGTGT:
	case Token.TK_PLUS:
	case Token.TK_SUB:
	case Token.TK_STAR:
	case Token.TK_SLASH:
	case Token.TK_PERCENT:
		return token.tk;
	default:
		this._visitor.prev();
		return null;
	}
};

/**
 * Selector:
 *   "." Identifier [Arguments]
 *   "." ExplicitGenericInvocation
 *   "." this
 *   "." super SuperSuffix
 *   "." new [NonWildcardTypeArguments] InnerCreator
 *   "[" Expression "]"
 */
Parser.prototype._tryParseSelector = function() {
	
	// parse: start with.
	if(this._tryEat(Token.TK_DOT) != null) {
		var identifier = this._tryParseIdentifier();
		
		// parse: Identifier [Arguments]
		this._mark();
		if(identifier != null) {
			var arguments = this._tryParseArguments();
			this._restore(true);
			var invoker = new AST.MethodInvocation();
			invoker.identifier = identifier;
			invoker.args = arguments;
			return invoker;
		}
		this._restore(false);
		
		// parse: ExplicitGenericInvocation
		var explicitGenericInvocation = this._tryParseExplicitGenericInvocation();
		if(explicitGenericInvocation != null) {
			return explicitGenericInvocation;
		}
		
		// parse this
		if(this._tryEat(Token.TK_THIS) != null) {
			var selector = new Selector();
			selector.isThis = true;
			return selector;
		}
		
		
		// parse: super SuperSuffix
		this._mark();
		if(this._tryEat(Token.TK_SUPER) != null) {
			var superSuffix = this._tryParseSuperSuffix();
			if(superSuffix != null) {
				this._restore(true);
                if(superSuffix instanceof AST.MethodInvocation){
                    superSuffix.isSuper = true;
                } else {
                    throw "Unknown";
                }
				return superSuffix;
			}
		}
		this._restore(false);
		
		
		// parse: new [NonWildcardTypeArguments] InnerCreator
		this._mark();
		if(this._tryEat(Token.TK_NEW) != null) {

            var argus = this._tryParseNonWildcardTypeArguments();
			var innerCreator = this._tryParseInnerCreator();
			if(innerCreator != null) {
                innerCreator.argus = argus
				this._restore(true);
				return innerCreator;
			}
		}
		this._restore(false);
		
		// dosnt' match for "."
		this._visitor.prev();
	} 
	
	this._mark();
	if(this._tryEat(Token.TK_LBRACKET) != null) {
		var expr = this._tryParseExpression();
		if(expr != null) {
			if(this._tryEat(Token.TK_RBRACKET) != null) {
                this._restore(true);
				var arrayAccess = new AST.ArrayAccess();
				arrayAccess.indexExpr = expr;
				return arrayAccess;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * ExplicitGenericInvocation:
 *   NonWildcardTypeArguments ExplicitGenericInvocationSuffix
 */
Parser.prototype._tryParseExplicitGenericInvocation = function() {
	this._mark();
	var arguments = this._tryParseNonWildcardTypeArguments();
	if(arguments != null) {
		var suffix = this._tryParseExplicitGenericInvocationSuffix();
		if(suffix != null) {
            this._restore(true);
			suffix.typeParams = arguments;
            return suffix;
		}
	}
	this._restore(false);
	return null;
};

/**
 * ExplicitGenericInvocationSuffix: 
 *   super SuperSuffix
 *   Identifier Arguments
 */
Parser.prototype._tryParseExplicitGenericInvocationSuffix = function() {
	
	// parse: super SuperSuffix
	this._mark();
	if(this._tryEat(Token.TK_SUPER) != null) {
		var suffix = this._tryParseSuperSuffix();
		if(suffix != null) {
			this._restore(true);
            throw "Not implemented yet";
		}
	}
	this._restore(false);
	
	// parse: Identifier Arguments
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var args = this._tryParseArguments();
		if(args != null) {
			this._restore(true);
			var stat = new AST.MethodInvocation();
            stat.identifier = identifier;
			stat.args  = args ;
			return stat;
		}
	}
 	this._restore(false);
	return null;
};

/**
 * NonWildcardTypeArguments:
 *   < TypeList >
 */
Parser.prototype._tryParseNonWildcardTypeArguments = function() {
	this._mark();
	if(this._tryEat(Token.TK_LT) != null) {
		var typeList = this._tryParseTypeList();
		if(typeList != null) {
            if(this._tryEat(Token.TK_GT,true) != null) {
                this._restore(true);
                return typeList;
            }
		}
	}
	this._restore(false);
	return null;
};

/**
 * TypeArgumentsOrDiamond:
 *   < > 
 *   TypeArguments
 */
Parser.prototype._tryParseTypeArgumentsOrDiamond = function() {
	// parse: < >
	this._mark();
	if(this._tryEat(Token.TK_LT) != null) {
		if(this._tryEat(Token.TK_GT) != null) {
			this._restore(true);
			return [];
		}
	}
	this._restore(false);
	
	// parse: TypeArguments
	var arguments = this._tryParseTypeArguments();
	if(arguments != null) {
		return arguments;
	}
	
	return null;
};
/**
 * NonWildcardTypeArgumentsOrDiamond:
 *   < >
 *   NonWildcardTypeArguments
 */
Parser.prototype._tryParseNonWildcardTypeArgumentsOrDiamond = function() {
	// parse: < >
	this._mark();
	if(this._tryEat(Token.TK_LT) != null) {
		if(this._tryEat(Token.TK_GT) != null) {
			this._restore(true);
			return [];
		}
	}
	this._restore(false);
	
	// parse: NonWildcardTypeArguments
	var nonWildcardTypeArguments = this._tryParseNonWildcardTypeArguments();
	if(nonWildcardTypeArguments != null) {
		var n = new NonWildcardTypeArgumentsOrDiamond();
		n.nonWildcardTypeArguments = nonWildcardTypeArguments;
		return n;
	}
	
	return null;
} ;

/**
 * TypeList:  
 *   Type { , Type }
 */
Parser.prototype._tryParseTypeList = function() {
	this._mark();
	var type = this._tryParseType();
	if(type != null) {
		var list = [];
		list.push(type);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				type = this._tryParseType();
				if(type != null) {
					this._restore(true);
					list.push(type);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		this._restore(true);
		return list;
	}
	this._restore(false);
	return null;
};

/**
 * TypeParameters:
 *   < TypeParameter { , TypeParameter } >
 */
Parser.prototype._tryParseTypeParameters = function() {
	this._mark();
	if(this._tryEat(Token.TK_LT) != null) {
		var param = this._tryParseTypeParamter();
		if(param != null) {
			var params = [];
			params.push(param);
			while(true){
				this._mark();
				if(this._tryEat(Token.TK_COMMA) != null){
					param = this._tryParseTypeParamter();
					if(param != null) {
						this._restore(true);
						params.push(param);
						continue;
					}
				}
				this._restore(false);
				break;
			}
			if(this._tryEat(Token.TK_GT,true) != null) {
				this._restore(true);
				return params;	
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * TypeParameter:
 *   Identifier [extends Bound]
 */
Parser.prototype._tryParseTypeParamter = function() {
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var param = new AST.TypeParameter();
		param.type = identifier;
		this._mark();
		var isSuccess = false;
		if(this._tryEat(Token.TK_EXTENDS) != null) {
			param.extendsFrom = this._tryParseBound();
			isSuccess = (param.extendsFrom != null);
		}
		this._restore(isSuccess);
		this._restore(true);
		return param;
	}
	this._restore(false);
	return null;
};

/**
 * Bound:  
 *   ReferenceType { & ReferenceType }
 */
Parser.prototype._tryParseBound = function() {
	var type = this._tryParseReferenceType();
	if(type  != null) {
		var types = [];
		types.push(type);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_AMP) != null) {
				type = this._tryParseReferenceType();
				if(type != null) {
					types.push(type);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		return types;
	}
	return null;
};

/**
 * PrefixOp: 
 *   ++
 *   --
 *   !
 *   ~
 *   +
 *   -
 */
Parser.prototype._tryParsePrefixOp = function() {
	var token = this._visitor.next();
	switch(token.tk) {
	case Token.TK_PLUSPLUS:
	case Token.TK_SUBSUB:
	case Token.TK_BAND:
	case Token.TK_TILDE:
	case Token.TK_PLUS:
	case Token.TK_SUB:
		return token.tk;
	default:
		this._visitor.prev();
		return null;
	}
};

/**
 * PostfixOp: 
 *   ++
 *   --
 */
Parser.prototype._tryParsePostfixOp = function() {
	if(this._tryEat(Token.TK_PLUSPLUS) != null) {
		return Token.TK_PLUSPLUS;
	}
	
	if(this._tryEat(Token.TK_SUBSUB) != null) {
		return Token.TK_SUBSUB;
	}
	
	return null;
};

/**
 * Primary: 
 *   Literal
 *   ParExpression
 *   this [Arguments]
 *   super SuperSuffix
 *   new Creator
 *   NonWildcardTypeArguments ( ExplicitGenericInvocationSuffix | this Arguments )
 *   Identifier { . Identifier } [IdentifierSuffix]
 *   BasicType {[]} . class
 *   void . class
 *   
 * Literal:
 *   IntegerLiteral
 *   FloatingPointLiteral
 *   CharacterLiteral 	
 *   StringLiteral 	
 *   BooleanLiteral
 *   NullLiteral
 */
Parser.prototype._tryParsePrimary = function() {
	
	// parse: Literal
	this._mark() ;
	var token = this._visitor.next() ;
	
	switch(token.tk) {
	case Token.TK_IntegerLiteral:
	case Token.TK_FloatingLiteral:
	case Token.TK_BooleanLiteral:
	case Token.TK_CharacterLiteral:
	case Token.TK_NullLiteral:
	case Token.TK_StringLiteral:
		this._restore(true);
		var literal = new AST.Literal();
		literal.tk = token.tk;
		literal.value = token.value;
		return literal;
	};
	this._restore(false);
	
	// parse: par expression
	var parExpr = this._tryParseParExpression();
	if(parExpr != null) {
		return parExpr;
	}
	
	// parse: this[ Arguments]
	this._mark();
	if(this._tryEat(Token.TK_THIS) != null) {
		var arguments = this._tryParseArguments();
		this._restore(true);
		if(arguments != null) {
			var stat = new AST.ArrayAccess();
			stat.index = arguments;
            stat.isThis = true;
			return stat;
		} else {
			var stat = new AST.FieldAccess();
			stat.identifiers.push(Token.TK_THIS);
			return stat;
		}
		
		return primary;
	}
	this._restore(false);
	
	// parse: super SuperSuffix
	this._mark();
	if(this._tryEat(Token.TK_SUPER) != null) {
		var stat = this._tryParseSuperSuffix();
		if(stat != null) {
			this._restore(true);
			return stat;
		}
	}
	this._restore(false);
	
	// parse: new Creator
	this._mark();
	if(this._tryEat(Token.TK_NEW) != null) {
		var creator = this._tryParseCreator();
		if(creator != null) {
			this._restore(true);
			return creator;
		}
	}
	this._restore(false);
	

	// parse: Identifier { . Identifier } [IdentifierSuffix]
	this._mark();
	var identifier = this._tryParseIdentifier() ;
        if( identifier != null) {
		var identifiers = [];
		identifiers.push(identifier);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_DOT) != null) {
				identifier = this._tryParseIdentifier() ;
				if(identifier != null) {
					identifiers.push(identifier);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		
		var result = null;
		// we left ParserIdentifierSuffix to decide if it's a method access/array access
		var suffix = this._tryParseIdentifierSuffix();
		if(suffix != null) {
			result = suffix ;
			if(result instanceof AST.MethodInvocation ||
                result instanceof AST.ArrayAccess ||
                result instanceof AST.FieldAccess ||
                result instanceof AST.NewClass ) {
				result.identifier = identifiers[identifiers.length -1 ];
				if(identifiers.length > 1){
					identifiers.pop();
					result.parent = identifiers;
				}
            } else if(result instanceof AST.ThisAccess) {
                result.identifiers = identifiers;
			} else {
				throw "Not implemented";
			}
		} else {
			result = new AST.Ident();
			result.identifiers = identifiers;
		}
		
		this._restore(true);
		return result;
	}
	this._restore(false);
	
	// parse: NonWildcardTypeArguments ( ExplicitGenericInvocationSuffix | this Arguments )
	this._mark();
	var nonWildcardTypeArguments = this._tryParseNonWildcardTypeArguments();
	if(nonWildcardTypeArguments != null){
		if(this._tryEat(Token.TK_LPAREN) != null) {
			
			var explicitGenericInvocationSuffix = this._tryParseExplicitGenericInvocationSuffix();
			if(explicitGenericInvocationSuffix != null) {
				if(this._tryEat(Token.TK_RPAREN) != null) {
					primary.nonWildcardTypeArguments = nonWildcardTypeArguments;
					primary.explicitGenericInvocationSuffix = explicitGenericInvocationSuffix;
					this._restore(true);
					return primary ;
				}
			} else {
				if(this._tryEat(Token.TK_THIS) != null) {
					var arguments = this._tryParseArguments();
					if(arguments != null) {
						primary.arguments = arguments;
						this._restore(true);
						return primary;
					}
				}
			}
		}
	}	
	this._restore(false);
	
	
	
	// parse: BasicType {[]} . class
	this._mark();
	var basicType = this._tryParseBasicType();
	if(basicType != null) {
		var dimCount= this._tryDimCount();
		if((this._tryEat(Token.TK_DOT) != null) && (this._tryEat(Token.TK_CLASS) != null)) {
			this._restore(true);
			var fieldAccess = new AST.FieldAccess();
			fieldAccess.type = basicType;
			fieldAccess.dimCount = dimCount;
			fieldAccess.dotClass = true;
			return fieldAccess;
		}
	}
	this._restore(false);
	
	
	// parse:  void . class
	this._mark();
	if(this._tryEat(Token.TK_VOID) != null && this._tryEat(Token.TK_DOT) != null && this._tryEat(Token.TK_CLASS) != null) {
		this._restore(true);
		var fieldAccess = new AST.FieldAccess();
		fieldAccess.type = Token.TK_VOID;
		fieldAccess.dotClass = true;
		return fieldAccess;
	}
	this._restore(false);
	
	return null;
} ;

/**
 * Arguments:
 *   ( [ Expression { , Expression } ] )
 *   
 * @returns Array of expression
 */
Parser.prototype._tryParseArguments = function() {
	this._mark();
	if(this._tryEat(Token.TK_LPAREN) != null) {
		var args = [];
		var expr = this._tryParseExpression() ;
		if(expr != null ) {
			args.push(expr);
			while(true) {
				this._mark();
				if(this._tryEat(Token.TK_COMMA) != null) {
					var expression = this._tryParseExpression();
					if(expression != null) {
						this._restore(true);
						args.push(expression);
						continue;
					}
				}
				this._restore(false);
				break;
			}
		}
		
		if(this._tryEat(Token.TK_RPAREN) != null) {
			this._restore(true);
			return args;
		}
	}
	this._restore(false);
	return null;
} ;

/**
 * Type:
 *   BasicType {[]}
 *   ReferenceType  {[]}
 */
Parser.prototype._tryParseType = function() {
	var type = this._tryParseBasicType();
	if(type != null) {
		type.dimCount = this._tryDimCount();
		return type;
	}
	
	//parse ReferenceType {[]}
	type = this._tryParseReferenceType();
	if(type != null) {
		type.dimCount = this._tryDimCount();
		return type;
	}
	
	return null;
};

/**
 * count {[]}
 */
Parser.prototype._tryDimCount = function() {
	var dimCount = 0 ;
	while(true) {
		this._mark();
		if(this._tryEat(Token.TK_LBRACKET)!= null) {
			if(this._tryEat(Token.TK_RBRACKET) != null) {
				this._restore(true) ;
				dimCount ++ ;
				continue;
			}
		}
		this._restore(false);
		break;
	}
	return dimCount;
};

/**
 * BasicType: 
 *   byte
 *   short
 *   char
 *   int
 *   long
 *   float
 *   double
 *   boolean
 */
Parser.prototype._tryParseBasicType = function() {
	var token = this._visitor.next();
	switch(token.tk) {
	case Token.TK_BYTE:
		return new AST.PrimitiveType(Token.TK_BYTE);
	case Token.TK_SHORT:
		return new AST.PrimitiveType(Token.TK_SHORT);
	case Token.TK_INT:
		return new AST.PrimitiveType(Token.TK_INT);
	case Token.TK_LONG:
		return new AST.PrimitiveType(Token.TK_LONG);
	case Token.TK_CHAR:
		return new AST.PrimitiveType(Token.TK_CHAR);
	case Token.TK_FLOAT:
		return new AST.PrimitiveType(Token.TK_FLOAT) ;
	case Token.TK_DOUBLE:
		return new AST.PrimitiveType(Token.TK_DOUBLE) ;
	case Token.TK_BOOLEAN:
		return new AST.PrimitiveType(Token.TK_BOOLEAN) ;
	default:
		this._visitor.prev();
		return null;
	}

};

/**
 * ReferenceType:
 *   Identifier [TypeArguments] { . Identifier [TypeArguments] }
 */
Parser.prototype._tryParseReferenceType = function() {
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var type = new AST.ReferenceType();
		type.identifiers.push(identifier);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_DOT) != null) {
				var identifier = this._tryParseIdentifier();
				if(identifier != null) {
					type.identifiers.push(identifier);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
        type.args = this._tryParseTypeArguments();
		return type;
	}
	return null;
};

Parser.prototype._tryParseReferenceTypeWithDim = function(){
    this._mark();
    var type = this._tryParseReferenceType();
    if(type != null){
        type.dimCount = this._tryDimCount();
        this._restore(true);
        return type;
    }
    return false;
};

/**
 * TypeArguments: 
 *   < TypeArgument { , TypeArgument } >
 */
Parser.prototype._tryParseTypeArguments = function() {
	this._mark();
	if(this._tryEat(Token.TK_LT) != null) {
		var argument = this._tryParseTypeArgument();
		if(argument != null) {
			var arguments = [];
			arguments.push(argument);
			
			while(true) {
				this._mark();
				if(this._tryEat(Token.TK_COMMA) != null) {
					argument = this._tryParseTypeArgument();
					if(argument != null) {
						this._restore(true);
						arguments.push(argument);
						continue;
					}
				}
				this._restore(false);
				break;
			}
			if(this._tryEat(Token.TK_GT,true) != null) {
				this._restore(true);
				return arguments;
			}
		}
	}
	this._restore(false);
	return null;
};

/**
 * TypeArgument:  
 *   Type
 *   ? [ ( extends | super ) ReferenceType ]
 */
Parser.prototype._tryParseTypeArgument = function() {
	
	var typeParam = new AST.TypeParameter();
	
	// parse: ReferenceType
	var type = this._tryParseType();
	if(type != null) {
		typeParam.type = type;
		return typeParam;
	}
	
	// parse: ? [ ( extends | super ) ReferenceType ]
	this._mark();
	if(this._tryEat(Token.TK_QUES) != null){
		var isExtends = false;
		var isSuper = false;
		
		if(this._tryEat(Token.TK_EXTENDS) != null){
			isExtends = true;
		} else {
			if(this._tryEat(Token.TK_SUPER) != null){
				isSuper = true;
			}
		}
        if(!isExtends && !isSuper ){
            this._restore(true);
            return typeParam;
        }

		var type = this._tryParseReferenceTypeWithDim();
		if(type != null) {
			this._restore(true);
			if(isExtends){
				typeParam.extendsFrom = type;
			}else if(isSuper){
				typeParam.superFrom = type;
			}else{
				typeParam.type = type;
			}
			return typeParam;
		}
	}
	this._restore(false);
	return null;
};


/**
 * SuperSuffix: 
 *   Arguments 
 *   . Identifier [Arguments]
 */
Parser.prototype._tryParseSuperSuffix = function() {
	// parse . Identifier [Arguments]
	this._mark();
	if(this._tryEat(Token.TK_DOT) != null) {
		var identifier = this._tryParseIdentifier() ;
		if(identifier != null) {
            var stat = new AST.MethodInvocation();
            stat.arguments = this._tryParseArguments();
            stat.identifier = identifier;
            stat.isSuper = true;
            this._restore(true);
            return stat;
        }
	}
	this._restore(false);
	
	// parse Arguments
	var args = this._tryParseArguments();
	if(args != null) {
		var stat = new AST.MethodInvocation();
		stat.isSuper = true;
		stat.arguments = args;
		return stat;
	}
	return null;
};

/**
 * Creator:  
 *   NonWildcardTypeArguments CreatedName ClassCreatorRest
 *   CreatedName ( ClassCreatorRest | ArrayCreatorRest )
 */
Parser.prototype._tryParseCreator = function() {
	
	
	// parse: NonWildcardTypeArguments CreatedName ClassCreatorRest
	this._mark();
	var arguments = this._tryParseNonWildcardTypeArguments();
    if(arguments != null){
        var name = this._tryParseCreatedName();
        if(name != null) {
        	var rest = this._tryParseClassCreatorRest();
        	if(rest != null) {
        		var creator = new Creator();
        		creator.arguments = arguments;
        		creator.name = name;
        		creator.rest = rest;
        		this._restore(true);
        		return creator;
        	}
        }
    }
	this._restore(false);
	
	// parse: CreatedName ( ClassCreatorRest | ArrayCreatorRest )
    this._mark();
    var basicType = this._tryParseBasicType();
    if(basicType != null){
        var newArray = this._tryParseArrayCreatorRest();
        if(newArray != null){
            newArray.type = basicType ;
            this._restore(true);
            return newArray;
        }
    }
    this._restore(false);

	this._mark();
	var name = this._tryParseCreatedName();
	if(name != null) {
		var newArray = null;
		var newClass = null;
		
		newClass = this._tryParseClassCreatorRest();
		if(newClass == null ) {
			newArray = this._tryParseArrayCreatorRest();
		}
		if(newClass != null) {
			this._restore(true);
			newClass.creatorName = name;
			return newClass;
		}
		if(newArray != null) {
			this._restore(true);
			newArray.name = name;
			return newArray;
		}
		
		
	}
	this._restore(false);
	return null;
};

/**
 * ArrayCreatorRest:
 * 	[ ( ] {[]} ArrayInitializer | 
 * 		Expression ] {[ Expression ]} {[]} )
 */
Parser.prototype._tryParseArrayCreatorRest = function(){
	
	if(this._tryEat(Token.TK_LBRACKET) != null) {
		this._mark();
		//parse: ] {[]} ArrayInitializer
		if(this._tryEat(Token.TK_RBRACKET) != null) {
			
			var dimCount = this._tryDimCount();
			var initializer = this._tryParseArrayInitializer();
			if(initializer != null) {
				this._restore(true);
				var newArray = new AST.NewArray();
				newArray.dimCount = dimCount;
				newArray.initializer = initializer;
				return newArray;
			}
			
		}
		this._restore(false);
		
		// Expression ] {[ Expression ]} {[]} ]
		this._mark();
		var expr = this._tryParseExpression();
		if(expr != null) {
			if(this._tryEat(Token.TK_RBRACKET) != null){
				var dims = [];
				dims.push(expr);
				while(true) {
					this._mark();
					if(this._tryEat(Token.TK_LBRACKET) != null){
						var expr = this._tryParseExpression();
						if(expr != null){
							if(this._tryEat(Token.TK_RBRACKET) != null){
								this._restore(true);
								dims.push(expr);
								continue;
							}
						}
					}
					this._restore(false);
					break;
				}
				var dimCount = this._tryDimCount();
				for(var i = 0 ;i < dimCount ; i ++) {
					dims.push(null);
				}
				this._restore(true);
				
				var newArray = new AST.NewArray();
				newArray.dims = dims;
				return newArray;	
			}
		}
		this._restore(false);
	}
	
	return null;
};

/**
 * CreatedName:   
 *   Identifier [TypeArgumentsOrDiamond] { . Identifier [TypeArgumentsOrDiamond] }
 */
Parser.prototype._tryParseCreatedName = function() {
	var identifier = this._tryParseIdentifier();
	if(identifier != null){
		var creatorName = [];
		var arg = this._tryParseTypeArgumentsOrDiamond();
		creatorName.push([identifier,arg]);
		
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_DOT) != null){
				identifer = this._tryParseIdentifier();
				if(identifier != null) {
					arg = this._tryParseTypeArgumentsOrDiamond();
					creatorName.push([identifier, arg]);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		return creatorName;
	}
	return null;
};

/**
 * ClassCreatorRest: 
 *   Arguments [ClassBody]
 */
Parser.prototype._tryParseClassCreatorRest = function(){
	var arg = this._tryParseArguments();
	if(arg != null) {
		var newClass = new AST.NewClass();
		newClass.arguments = arg;
		var decl= new AST.ClassDecl();
		newClass.body = this._tryParseClassBody(decl);
		return newClass;
	}
	return null;
};

/**
 * IdentifierSuffix:
 *   "[" ( "]" {"[]"} .   class | Expression "]")
 *   Arguments 
 *   . ( class | ExplicitGenericInvocation | this | super Arguments |
 *          new [NonWildcardTypeArguments] InnerCreator )
 */
Parser.prototype._tryParseIdentifierSuffix = function() {
	// parse:  "[" ( "]" {"[]"} .   class | Expression "]")
	this._mark();
	if(this._tryEat(Token.TK_LBRACKET) != null) {
		if(this._tryEat(Token.TK_RBRACKET) != null) { // parse: "]" {"[]"} .   class
			var dimCount = this._tryDimCount();
			if(this._tryEat(Token.TK_DOT) != null) {
				if(this._tryEat(Token.TK_CLASS) != null) {
					this._restore(true);
					var fieldAccess = new AST.FieldAccess();
					fieldAccess.dimCount = dimCount;
					fieldAccess.dotClass = true;
					return fieldAccess;
				}
			}
		} else { // parse: Expression "]"
			var expr = this._tryParseExpression();
			if(expr != null) {
				if(this._tryEat(Token.TK_RBRACKET) != null) {
					var arrayAccess = new AST.ArrayAccess();
					arrayAccess.indexExpr = expr;
					this._restore(true);
					return arrayAccess;
				}
			}
		}
	}
	this._restore(false);
	
	// parse: Arguments
	var arguments = this._tryParseArguments();
	if(arguments != null) {
		var methodCall = new AST.MethodInvocation();
		methodCall.args = arguments;
		return methodCall;
	}
	
	// parse: . ( class | ExplicitGenericInvocation | this | super Arguments | new [NonWildcardTypeArguments] InnerCreator )
	this._mark();
	if(this._tryEat(Token.TK_DOT) != null) {
		// parse: class
		if(this._tryEat(Token.TK_CLASS) != null) {
			this._restore(true);
			var fieldAccess = new AST.FieldAccess();
			fieldAccess.dotClass = true;
			return fieldAccess ;
		}
		// parse: this
		if(this._tryEat(Token.TK_THIS) != null) {
            var thisAccess = new AST.ThisAccess();
			this._restore(true);
			return thisAccess;
		}
		
		// parse: super Arguments
		if(this._tryEat(Token.TK_SUPER) != null) {
			var arguments = this._tryParseArguments();
			if(arguments != null) {
				var identifierSuffix = new IdentifierSuffix();
				identifierSuffix.arguments = arguments;
				this._restore(true);
				return identifierSuffix;
			}
			this._visitor.prev();
		}
		
		// parse: new [NonWildcardTypeArguments] InnerCreator
		this._mark();
		if(this._tryEat(Token.TK_NEW) != null) {
			var arguments = this._tryParseNonWildcardTypeArguments();
			var decl = this._tryParseInnerCreator();
			if(decl != null) {
				decl.newArguments = arguments;
				this._restore(true);
				this._restore(true);
				return decl;
			}
		}
		this._restore(false);
		
		//parse: ExplicitGenericInvocation
		var explicitGenericInvocation = this._tryParseExplicitGenericInvocation();
		if(explicitGenericInvocation != null) {
			this._restore(true);
			return explicitGenericInvocation;
		}
	}
	
	this._restore(false);
	return null;
};

/**
 * InnerCreator:  
 *   Identifier [NonWildcardTypeArgumentsOrDiamond] ClassCreatorRest
 */
Parser.prototype._tryParseInnerCreator = function() {
	this._mark();
	var identifier = this._tryParseIdentifier();
	if(identifier != null) {
		var arg = this._tryParseNonWildcardTypeArgumentsOrDiamond();
		
		var decl = this._tryParseClassCreatorRest();
		if(decl != null) {
			this._restore(true);
			decl.args = arg;
			decl.identifier = identifier;
			return decl;
		}
	}
	this._restore(false);
	return null;
};



//-------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * EnumBody:
 *   "{" [EnumConstants] [,] [EnumBodyDeclarations] "}"
 *  @returns boolean
 */
Parser.prototype._tryParseEnumBody = function(enumDecl) {
	this._mark();
	if(this._tryEat(Token.TK_LBRACE) != null){
		enumDecl.constants = this._tryParseEnumConstants();
		this._tryEat(Token.TK_COMMA) ;
		this._tryParseEnumBodyDeclarations(enumDecl);
		if(this._tryEat(Token.TK_RBRACE) != null) {
			return this._restore(true);
		}
	}
	return this._restore(false);
};

/**
 * EnumConstants:
 *   EnumConstant
 *   EnumConstants , EnumConstant
 * 
 */
Parser.prototype._tryParseEnumConstants = function() {
	var constant = this._tryParseEnumConstant();
	if(constant != null) {
		var constants = [];
		constants.push(constant);
		while(true) {
			this._mark();
			if(this._tryEat(Token.TK_COMMA) != null) {
				constant = this._tryParseEnumConstant();
				if(constant != null) {
					constants.push(constant);
					this._restore(true);
					continue;
				}
			}
			this._restore(false);
			break;
		}
		return constants;
	}
	return null;
};

/**
 * EnumConstant:
 *   [Annotations] Identifier [Arguments] [ClassBody]
 */
Parser.prototype._tryParseEnumConstant = function() {
	this._mark();
	var annotations = this._tryParseAnnotations();
	var identifier = this._tryParseIdentifier();
	if(identifier != null){
		var constant = new AST.EnumConstant();
		constant.arguments = this._tryParseArguments();
		var body = new AST.ClassDecl(); 
		constant.body = this._tryParseClassBody(body);
		constant.annotations = annotations ;
		this._restore(true);
		return constant;
	}
	this._restore(false);
	return null;
};

/**
 * EnumBodyDeclarations:
 *   ; {ClassBodyDeclaration}
 */
Parser.prototype._tryParseEnumBodyDeclarations = function(enumDecl) {
	this._mark();
	if(this._tryEat(Token.TK_SEMI) != null){
		var decl = null;
		while((decl = this._tryParseClassBodyDeclaration()) != null) {
			this._appendClassBodyDecl(enumDecl, decl);
		}
		return this._restore(true);
	}
	return this._restore(false);
};

/**
 * AnnotationTypeBody:
 *   { [AnnotationTypeElementDeclarations] }
 *   
 *  @returns boolean
 */
Parser.prototype._tryParseAnnotationTypeBody = function(classDecl) {
	this._mark();
	if(this._tryEat(Token.TK_LBRACE) != null) {
		
		this._tryParseAnnotationTypeElementDeclarations(classDecl);
		
		if(this._tryEat(Token.TK_RBRACE) != null){
			this._restore(true);
			return true;
		}
	}
	this._restore(false);
	return false;
};

/**
 * AnnotationTypeElementDeclarations:
 *   AnnotationTypeElementDeclaration
 *   AnnotationTypeElementDeclarations AnnotationTypeElementDeclaration
 *   @returns boolean
 */
Parser.prototype._tryParseAnnotationTypeElementDeclarations = function(classDecl) {
	var decl = null;
	while((decl = this._tryParseAnnotationTypeElementDeclaration()) != null) {
		this._appendClassBodyDecl(classDecl, decl);
	}
	return true;
};

/**
 * AnnotationTypeElementDeclaration:
 *   {Modifier} AnnotationTypeElementRest
 */
Parser.prototype._tryParseAnnotationTypeElementDeclaration = function() {
	this._mark();
	
	var modifiers = this._tryParseModifiers();
	
	var annotation = this._tryParseAnnotationTypeElementRest();
	if(annotation != null){
		this._restore(true);
		annotation.modifiers  = modifiers;
		return annotation;
	}
	this._restore(false);
	return null;
};

/**
 * AnnotationTypeElementRest:
 *   Type Identifier AnnotationMethodOrConstantRest ;
 *   ClassDeclaration
 *   InterfaceDeclaration
 *   EnumDeclaration  
 *   AnnotationTypeDeclaration
 */
Parser.prototype._tryParseAnnotationTypeElementRest = function() {
	
	var decl = null;
	
	// parse: Type Identifier AnnotationMethodOrConstantRest ;
	this._mark();
	var type = this._tryParseType();
	if(type != null) {
		var identifier = this._tryParseIdentifier();
		if(identifier != null){
			decl = this._tryParseAnnotationMethodOrConstantRest();
			if(decl != null) {
				if(this._tryEat(Token.TK_SEMI) != null) {
					this._restore(true);
					decl.returnType = type;
					decl.identifier = identifier;
					return decl;
				}
			}
		}
 	}
	this._restore(false);
	
	// parse: ClassDeclaration
	decl = this._tryParseClassDeclaration();
	if(decl != null){
		return decl;
	}
	
	// parse: InterfaceDeclaration
	decl = this._tryParseInterfaceDeclaration();
	if(decl != null){
		return decl;
	}
	
	// parse: EnumDeclaration
	decl = this._tryParseEnumDeclaration();
	if(decl != null) {
		return decl;
	}
	
	//parse: AnnotationTypeDeclaration
	decl = this._tryParseAnnotationTypeDeclaration();
	if(decl != null) {
		return decl;
	}
	return null;
};

/**
 * AnnotationMethodOrConstantRest:
 *   AnnotationMethodRest
 *   ConstantDeclaratorsRest
 */
Parser.prototype._tryParseAnnotationMethodOrConstantRest = function() {
	
	var decl = this._tryParseAnnotationMethodRest();
	if(decl != null) {
		return decl;
	}
	decl = this._tryParseConstantDeclaratorsRest();
	if(decl != null) {
		return decl;
	}
	return null;
};

/**
 * AnnotationMethodRest:
 *   ( ) [default ElementValue]
 */
Parser.prototype._tryParseAnnotationMethodRest = function() {
	
	if(this._tryEat(Token.TK_LPAREN) != null) {
		if(this._tryEat(Token.TK_RPAREN) != null){
			var decl = new AST.MethodDecl();
			
			this._mark();
			var isSuccess = false;
			if(this._tryEat(Token.TK_DEFAULT) != null){
				decl.default_ = this._tryParseElementValue();
				isSuccess = (decl.default_ != null); 
			}
			this._restore(isSuccess);
			return decl;
		}
	}
	return null;
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports api
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.Parser = Parser;


if( require.main == module) {
	var setPrintAST = require("./ast").setPrintAST;
	setPrintAST(true);
	
	var path = process.argv[2];
	var fs = require("fs");
	var content = fs.readFileSync(path).toString() ;
	var lexer = new Lexer() ;
	lexer.parse(content);
	var parser = new Parser(lexer.getVisitor()) ;
	parser.parse();
	parser._unit.visit();
}

