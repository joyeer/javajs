var Visitor = require("./visitor").Visitor;
var utils = require("./utils");
var AST = require("./ast").AST;
var Token = require("./ast").Token;
var AccessFlag = require("./ast").AccessFlag;
var Error = require("./errors").Error;
var SymTab = require('./symtab').SymTab;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// symbal visitor
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function SymVisitor(sym) {
    SymVisitor.prototype.superClass();
    this._symTab = sym;
    this._unit = null;
};
SymVisitor.inherited(Visitor);

SymVisitor.prototype.visitComplicationUnit = function(unit){
    this._unit = unit;
    if(unit._package != null){
        unit.name = unit._package.identifiers.join(".");
        this._symTab.registerPackage(unit.name);
    }
};

/**
 * Visit the Class/Enum/Interface definition
 */
SymVisitor.prototype.visitClassDecl = function(decl){

    decl.name = utils.isEmptyString(decl.parent.name) ?
        decl.parent.name + "." +  decl.identifier.toString() : decl.identifier.toString();

    var modifiers = [];
    // modifiers
    for(var k in decl.modifiers){
        var modifier = decl.modifiers[k];
        if(modifier instanceof AST.Annotation){
            decl.annotations.push(modifier);
        } else {
            switch(modifier){
                case Token.TK_PUBLIC:
                    decl.accessFlag |= AccessFlag.Class.ACC_PUBLIC;
                    break;
                case Token.TK_FINAL:
                    decl.accessFlag |= AccessFlag.Class.ACC_FINAL;
                    break;
                case Token.TK_SUPER:
                    decl.accessFlag |= AccessFlag.Class.ACC_SUPER;
                    break;
                case Token.TK_INTERFACE:
                    decl.accessFlag |= AccessFlag.Class.ACC_INTERFACE;
                    break;
                case Token.TK_ABSTRACT:
                    decl.accessFlag |= AccessFlag.Class.ACC_ABSTRACT;
                    break;
                default:
                    break;
            }
            modifiers.push(modifier);
        }
    }
    // make sure the modifiers doesn't contain annotations
    decl.modifiers = modifiers;
    // extends
    this._symTab.registerClass(this._unit.name,decl.name,decl);

};

SymVisitor.prototype.visitMethodDecl = function(decl){
    if(decl.modifiers != null){
        var modifiers = [];
        for(var k in decl.modifiers){
            var modifier = decl.modifiers[k];
            if(modifier instanceof AST.Annotation) {
                decl.annotations.push(modifier);
            } else {
                switch(modifier){
                    case Token.TK_PUBLIC:
                        decl.accessFlag |= AccessFlag.Method.ACC_PUBLIC;
                        break;
                    case Token.TK_PRIVATE:
                        decl.accessFlag |= AccessFlag.Method.ACC_PRIVATE;
                        break;
                    case Token.TK_STATIC:
                        decl.accessFlag |= AccessFlag.Method.ACC_STATIC;
                        break;
                    case Token.TK_FINAL:
                        decl.accessFlag |= AccessFlag.Method.ACC_FINAL;
                        break;
                    case Token.TK_NATIVE:
                        decl.accessFlag |= AccessFlag.Method.ACC_NATIVE;
                        break;
                    default:
                       // throw "Unknown modifiers";
                }
                modifiers.push(modifier);
            }
        }
        decl.modifiers = modifiers;
    }

    // check native method doesn't allow method body
    if(decl.isNative() && decl.block != null) {
        throw Error.Syntax.NativeMethodNotBody;
    }
};

SymVisitor.prototype.visitAnnotation = function(decl){
};

exports.SymVisitor = SymVisitor;
exports.SymTab = SymTab;