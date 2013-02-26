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

var Visitor = require("./visitor").Visitor;

var TAB = "    ";
var NA = "N/A";
var dbgTab = 0;

function debugPrint(message){
    var sb = [];
    for(var i = 0 ; i < dbgTab  ; i ++){
        sb.push(TAB);
    }
    sb.push(message);
    console.log(sb.join(""));
};

var incTab = function(){ dbgTab ++;};
var decTab = function(){ dbgTab --;};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AST tree printer
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ASTPrinter() {
}

ASTPrinter.prototype.print = function(unit){
    debugPrint("Package: " + unit.pkgname) ;
    incTab();

    for(var k in unit.defs){
        var decl = unit.defs[k];
        this._printClass(decl);
    }
    decTab();
};

ASTPrinter.prototype._printClass = function(decl){
    debugPrint("Class: " + decl.getName());
    incTab();
    debugPrint("AccessFlag: " + decl.modifiers.join(" "));

    for(var k in decl.methods){
        this._printMethod(decl.methods[k]);
    }
    decTab();
};

ASTPrinter.prototype._printMethod = function(decl){
    debugPrint("Method: " + decl.getName());
    incTab();
    if(decl.params != null) {
        var sb =  [];
        for(var k in decl.params){
            var param = decl.params[k];
        }
        debugPrint("Parameters:" + sb.join(""));
    }

    decTab();
};

exports.ASTPrinter = ASTPrinter;
