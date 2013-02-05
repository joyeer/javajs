

/**
 * A AST tree walk, which help to go thought whole AST tree
 */
function ASTWalker(unit){
    this._unit = unit;
};

ASTWalker.prototype.visit = function(visitor){
    this._visitor = visitor;
    this._visitUnit();
};

/**
 * walk through complication unit
 */
ASTWalker.prototype._visitUnit = function(){
    try {
        this._visitor.visitComplicationUnit(this._unit);

        // walk through import statements
        for(var k in this._unit.imports){
            var importDecl = this._unit.imports[k];
            importDecl.parent = this._unit;
            this._visitor.visitImport(importDecl);
        }

        for(var k in this._unit.defs){
            var def = this._unit.defs[k];
            def.parent = this._unit;
            this._visitClassDecl(def);
        }
    }catch(e){
        console.log("Error:" + e +  "@"+this._unit.sourcepath)
        throw e ;
    }
};

/**
 * walk through class declaration
 */
ASTWalker.prototype._visitClassDecl = function(def){
    this._visitor.visitClassDecl(def);

    for(var k in def.methods){
        var method = def.methods[k];
        method.parent = def;
        this._visitMethodDecl(method);
    }

    for(var k in def.fields){
        var field = def.fields[k];
        field.parent = def;
        this._visitFieldDecl(field);
    }

    for(var k in def.inners){
        var inner = def.inners[k];
        inner.parent = def ;
        this._visitClassDecl(inner);
    }
};

ASTWalker.prototype._visitModifiers = function(modifiers){
    this._visitor.visitModifiers(modifiers);
};

/**
 * walk through method declaration
 */
ASTWalker.prototype._visitMethodDecl = function(def){
    this._visitor.visitMethodDecl(def);
    this._visitor.visitBlock(def.block);
};

/**
 * walk through field declaration
 */
ASTWalker.prototype._visitFieldDecl = function(decl){
    this._visitor.visitFieldDecl(decl);
};

/**
 * walk through statement declaration
 */
ASTWalker.prototype._visitStatement = function(stat){
    if(stat instanceof AST.Block){
        this._visitBlock(stat);
    } else if(stat instanceof AST.If){
        this._visitIf(stat);
    } else if(stat instanceof AST.VariableDecl){
        this._visitVariableDecl(stat);
    } else if(stat instanceof AST.StaticBlock){
        this._visitStaticBlock(stat);
    } else if(stat instanceof AST.DoWhile){
        this._visitDoWhile(stat);
    } else if(stat instanceof AST.While){
        this._visitWhile(stat);
    } else if(stat instanceof AST.For){
        this._visitFor(stat);
    } else if(stat instanceof AST.EnhancedFor){
        this._visitEnhancedFor(stat);
    } else if(stat instanceof AST.LabeledStatement){
        this._visitLabeledStatement(stat);
    } else if(stat instanceof AST.Switch){
        this._visitSwitch(stat);
    } else if(stat instanceof AST.Case){
        this._visitCase(stat);
    } else if(stat instanceof AST.Synchronized){
        this._visitSynchronized(stat);
    } else if(stat instanceof AST.Try){
        this._visitTry(stat);
    } else if(stat instanceof AST.Catch){
        this._visitCatch(stat);
    } else if(stat instanceof AST.ExpressionStatement){
        this._visitExpressionStatement(stat);
    } else if( stat instanceof AST.Break){
        this._visitBreak(stat);
    } else if(stat instanceof AST.Continue){
        this._visitContinue(stat);
    } else if(stat instanceof AST.Return){
        this._visitReturn(stat);
    } else if(stat instanceof AST.Throw){
        this._visitThrow(stat);
    } else if(stat instanceof AST.Assert){
        this._visitAssert(stat);
    }
    throw "Unknow Statement";
};

/**
 * Walk through variable declaration
 * @param stat
 * @private
 */
ASTWalker.prototype._visitVariableDecl = function(stat){
    this._visitor.visitVariableDecl(stat);
};

/**
 * visit asert statmemtn
 */
ASTWalker.prototype._visitAssert = function(stat){
    this._visitor.visitAssert(stat);
    this._visitExpression(stat.expr);
};

/**
 * visit throw statement
 */
ASTWalker.prototype._visitThrow = function(stat){
    this._visitor.visitThrow(stat);
    this._visitor._visitExpression(stat.expr);
};

/**
 * visit return statement
 */
ASTWalker.prototype._visitReturn = function(stat){
    this._visitor.visitReturn(stat);
    this._visitExpression(stat.expr);
};

ASTWalker.prototype._visitContinue = function(stat){
    this._visitor.visitContinue(stat);
};

ASTWalker.prototype._visitBreak = function(stat){
    this._visitor.visitBreak(stat);
};

/**
 * cond ? truepart : falsepart
 */
ASTWalker.prototype._visitConditional = function(stat){
    this._visitor.visitConditional(stat);
    this._visitor._visitExpression(stat.cond);
    this._visitor._visitExpression(stat.truepart);
    this._visitor._visitExpression(stat.falsepart);
};

ASTWalker.prototype._visitCatch = function(stat){
    this._visitor.visitCatch(stat);
};

ASTWalker.prototype._visitTry = function(stat){
    this._visitor.visitTry(stat);
};

ASTWalker.prototype._visitSynchronized = function(stat){
    this._visitor.visitSynchronized(stat);
};

ASTWalker.prototype._visitDefault = function(stat){
    this._visitor.visitDefault(stat);
};

ASTWalker.prototype._visitCase = function(stat){
    this._visitor.visitCase(stat);
};

ASTWalker.prototype._visitSwitch = function(stat){
    this._visitor.visitSwitch(stat);
};

ASTWalker.prototype._visitLabeledStatement = function(stat){
    this._visitor.visitLabeledStatement(stat);
};

ASTWalker.prototype._visitEnhancedFor = function(stat){
    this._visitor.visitEnhancedFor(stat);
} ;

/**
 * walk through while(expr) {}
 */
ASTWalker.prototype._visitWhile = function(stat){
    this._visitor._visitWhile(stat);
};

/**
 * walk through do{} while(expr);
 */
ASTWalker.prototype._visitDoWhile = function(stat){
    this._visitor.visitDoWhile(stat);
};

ASTWalker.prototype._visitStaticBlock = function(stat){
    this._visitor.visitStaticBlock(stat);
};

ASTWalker.prototype._visitIf = function(stat){
    this._visitor.visitIf(stat);
};

/**
 * walk throgh block statement
 */
ASTWalker.prototype._visitBlock = function(decl){
    this._visitor.visitBlock(decl);
    for(var k in decl.stats){
        var stat = decl.stats[k];
        this._visitStatement(stat);
    }
};

/**
 * walk through expression statement
 */
ASTWalker.prototype._visitExpressionStatement = function(def){
    this._visitor.visitExpressionStatement(def);
    this._visitExpression(def.expr);
};

/**
 * walk through expression
 */
ASTWalker.prototype._visitExpression = function(expr){
    if(expr instanceof AST.MethodInvocation){
        this._visitMethodInvocation(expr);
    } else if(expr instanceof AST.NewClass){
        this._visitNewClass(expr);
    } else if(expr instanceof AST.NewArray){
        this._visitNewArray(expr);
    } else if(expr instanceof AST.Parens){
        this._visitParens(expr);
    } else if(expr instanceof AST.AssignOp){
        this._visitAssignOp(expr);
    } else if(expr instanceof AST.Unary){
        this._visitUnary(expr);
    } else if(expr instanceof AST.Binary){
        this._visitBinary(expr);
    } else if(expr instanceof AST.TypeCast){
        this._visitTypeCast(expr);
    } else if(expr instanceof AST.InstanceOf){
        this._visitInstanceOf(expr);
    } else if(expr instanceof AST.ArrayAccess){
        this._visitArrayAccess(expr);
    } else if(expr instanceof AST.FieldAccess){
        this._visitFieldAccess(expr);
    } else if(expr instanceof AST.ThisAccess){
        this._visitThisAccess(expr);
    } if(expr instanceof AST.Ident){
        this._visitIdent(expr);
    } else if(expr instanceof AST.Literal){
        this._visitLiteral(expr);
    } else if(stat instanceof AST.Conditional){
        this._visitConditional(stat);
    }
    throw "Uknow expression";
};

ASTWalker.prototype._visitThisAccess = function(expr){
};

ASTWalker.prototype._visitLiteral = function(expr){
    this._visitor.visitLiteral(expr);
};

ASTWalker.prototype._visitIdent = function(expr){
    this._visitor.visitIdent(expr);
};

ASTWalker.prototype._visitFieldAccess = function(expr){
    this._visitor.visitFieldAccess(expr);
};

ASTWalker.prototype._visitArrayAccess = function(expr){
    this._visitor.visitArrayAccess(expr);
};

ASTWalker.prototype._visitInstanceOf = function(expr){
    this._visitor.visitInstanceof(expr);
    this._visitExpression(expr.expr);
};

ASTWalker.prototype._visitTypeCast = function(expr){
    this._visitor.visitTypeCast(expr);
};

ASTWalker.prototype._visitBinary = function(expr){
    this._visitor.visitBinary(expr);
};

ASTWalker.prototype._visitUnary = function(expr){
    this._visitor.visitUnary(expr);
};

ASTWalker.prototype._visitAssignOp = function(expr){
    this._visitor.visitAssignOp(expr);
};

ASTWalker.prototype._visitParens = function(expr){
    this._visitor.visitParens(expr);
    this._visitExpression(expr.expr);
};

ASTWalker.prototype._visitNewArray = function(expr){
    this._visitor.visitNewArray(expr);
};

ASTWalker.prototype._visitMethodInvocation = function(expr){
    this._visitor.visitMethodInvocation(expr);
};

ASTWalker.prototype._visitNewClass = function(expr){
    this._visitor.visitNewClass(expr);
};

exports.ASTWalker = ASTWalker;