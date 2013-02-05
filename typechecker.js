var Visitor = require("./visitor").Visitor;
var Error = require("./errors").Error;
var ClassDecl = require("./ast").AST.ClassDecl;

var DEFAULT_PACKAGE = "java.lang";

function TypeChecker(symtab){
    this._symtab = symtab;
    this._unit = null;
}
TypeChecker.inherited(Visitor);

TypeChecker.prototype.visitComplicationUnit  = function(unit){
    this._unit = unit;

    // default package
    var classes = this._symtab.getPackage(DEFAULT_PACKAGE);
    // load self package
    classes = classes.concat(
                  this._symtab.getPackage(this._unit.name));

    for(var k in classes){
        var name = classes[k] ;
        this._unit.codesym.registerClass(null,name,this._symtab.getClass(name));
    }

};

/**
 * make all import classes
 * @param decl
 */
TypeChecker.prototype.visitImport = function(decl){
    var base = decl.identifiers.join(".");

    if(! decl.wildcard  && ! decl.isStatic) {
        var def = this._symtab.getClass(base);
        if(def == null){
            //TODO: refactor it
            throw "cannot find source@" + this._unit.sourcepath;
        }
        this._unit.codesym.registerClass(null,base,def);

    } else if( decl.wildcard && !decl.isStatic) {

        // for import java.lang.* , we will import all
        var classes = this._symtab.getPackage(base);
        if(classes == null){
            //TODO: refactor this error
            throw "cannot find declaration";
        }
        for(var k in classes){
            var clazz = classes[k];
            var def = this._symtab.getClass(clazz);
            if(def == null){
                //TODO: refactor it
               throw "cannot find declaration";
            }

            this._unit.codesym.registerClass(null,k,def);
        }
    } else if( ! decl.wildcard && decl.isStatic) {

    }

};

/**
 * go through all class declaration
 * @param decl
 */
TypeChecker.prototype.visitClassDecl = function(decl){
    // find extends class
    if(decl.extendsTypeList != null) {
        if(decl.extendsTypeList.length > 1 && decl.kind != ClassDecl.Kind.Interface){
            //TODO: refactor it as error
            throw  "Java only allow one super class @"+ this._unit.sourcepath ;
        }

        for(var i = 0 ;i  < decl.extendsTypeList.length ; i ++) {
            var type = decl.extendsTypeList[i];
            var decl = this._unit.codesym.getClass(type.identifiers.join("."),this._unit.name);
            if(decl == null){
                //TODO: refactor it
                throw "Cannot find extends classses@" + type.identifiers.join(".")  + "@"  + this._unit.sourcepath;
            }
        }

    }
};

exports.TypeChecker = TypeChecker;
