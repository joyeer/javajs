var utils = require("./utils");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SymTab
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function SymTab() {
    this._classes = {}; // index of all classes
    this._packages = {}; // index of all packages , { key : package Name, value: set of contained classe names}
}

/**
 * register java's package name
 * @param pkgname
 */
SymTab.prototype.registerPackage = function(pkgname){
    if(!(pkgname in this._packages)){
        this._packages[pkgname.toString()] = [];
    }
};

/**
 * check if a class existing in code
 * @param classname
 * @return {Boolean}
 */
SymTab.prototype.existClass = function(classname){
    return (classname in this._classes);
};

/**
 * register a class into symbol tablet
 * if a duplicated class , i will throw out a error
 * @param pkgname
 * @param classname
 * @param decl
 */
SymTab.prototype.registerClass = function(pkgname, classname, decl) {
    this._classes[classname] = decl;

    if(pkgname != null && pkgname != "") {
        this._packages[pkgname.toString()].push(classname);
    }
};

/**
 * give the full name of a class, return the declaration of this classs
 * @param name
 * @return {*}
 */
SymTab.prototype.getClass = function(name,pkgname){
    var clazz = this._classes[name];
    if(clazz == undefined){
        return null;
    }
    return clazz;
};

/**
 *
 * @param name
 * @return {*} all classes under this
 */
SymTab.prototype.getPackage = function(name){
    var classes = this._packages[name];
    if(classes == undefined){
        return null;
    }
    return classes ;
};
exports.SymTab = SymTab;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *  soource code level symbal table
 * @constructor
 */
function CodeSymTab(){
    CodeSymTab.prototype.superClass();
    this._shortNameClassesIndex = {};
}
CodeSymTab.inherited(SymTab);

/**
 * register class symbal, we will break down it's fullname,
 *  in code level, we're aollowed to access by short name
 * @param name
 * @param decl
 */
CodeSymTab.prototype.registerClass = function(pkgname,fullname,decl){
    SymTab.prototype.registerClass.call(this,pkgname,fullname,decl);

    var basename = utils.getBaseClassName(fullname);
    this._shortNameClassesIndex[basename] = decl;
};

/**
 * get class declaration base on name
 * @param name
 * @param pkgname  default package name
 * @return {*}
 */
CodeSymTab.prototype.getClass = function(name,pkgname){
    if(name in this._shortNameClassesIndex){
        return this._shortNameClassesIndex[name];
    }

    if(name in this._classes){
        return this._classes[name];
    }

    // search name in default package
    var newname = "java.lang." + name;
    if(newname in this._classes){
        return this._classes[newname];
    }

    // search it in own package
    if(!utils.StringUtils.isEmpty(pkgname)){
        var newname = pkgname + "." + name;
        if(newname in this._classes){
            return this._classes[newname];
        }
    }

    return null;
};

CodeSymTab 
exports.CodeSymTab = CodeSymTab;
