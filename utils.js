var fs = require("fs");


String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

Function.prototype.inherited = function(type) {
    // store the orignal construcotr for *this*
    var constructor = this.prototype.constructor ;
    // use an fake F to new the inherited types' prototypies
    var F = function() {} ;
    F.prototype = type.prototype ;
    this.prototype = new F() ;
    this.prototype.constructor = constructor ;
    // it's super class
    this.prototype.superClass = type ;
    return this ;
} ;



/**
 * check if the given path is a directory
 * @param path
 * @return {*}
 */
function isDirectory(path){
    var stat = fs.lstatSync(path);
    return stat.isDirectory();
}
exports.isDirectory = isDirectory;


/**
 * list all files under a specify path
 * @param path
 * @returns {Array}
 */
function listFolderSync(path) {
	var folders = [];
	if(isDirectory(path)){
		var dir = fs.readdirSync(path);
		for(var k in dir){
			var d = path + "/" + dir[k];
			if(isDirectory(d)){
				var r = listFolderSync(d);
				folders = folders.concat(r);
			} else {
				folders.push(d);
			}
		}
	} else {
		folders.push(path);
	}
	return folders;
};
exports.listFolderSync = listFolderSync;

/**
 * read file content from file path
 * @param path
 * @returns String
 */
function readSync(path){
	return fs.readFileSync(path).toString();
}
exports.readSync = readSync;

/**
 * check the given string is not undefined/null/""
 * @param str
 * @return {Boolean}
 */
function isEmptyString (str){
    return str != undefined && str != null && str != "";
}
exports.isEmptyString = isEmptyString;

/**
 * get a class's base name
 * @param className
 * @return {*}
 */
function getBaseClassName(className){
    var parts = className.split(".");
    return parts[parts.length -1];
}
exports.getBaseClassName = getBaseClassName;


/**
 * String.trim method
 */
String.trim = function(){
    return this.replace(/^\s+|\s+$/g,'') ;
} ;

var StringUtils = function() {
    return {
        isEmpty : function(input) {
            return (input === undefined || input === null || input === "" ) ;
        }
    } ;
} () ;

exports.StringUtils = StringUtils;

