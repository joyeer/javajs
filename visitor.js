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

/**
 * A AST Visitor, this is a abstract class
 */
function Visitor(){
    this._model = null;
}

Visitor.prototype.visitComplicationUnit = function(decl){};
Visitor.prototype.visitImport = function(decl){};
Visitor.prototype.visitModifiers = function(modifiers){};
Visitor.prototype.visitClassDecl= function(decl){};
Visitor.prototype.visitMethodDecl = function(decl){};
Visitor.prototype.visitVariableDecl = function(decl){};
Visitor.prototype.visitFieldDecl = function(decl){};
Visitor.prototype.visitBlock = function(decl){};
Visitor.prototype.visitFor = function(decl){};
Visitor.prototype.visitEnhancedFor = function(decl){};
Visitor.prototype.visitLabel = function(decl){};
Visitor.prototype.visitSwitch = function(decl){};
Visitor.prototype.visitCase = function(decl){};
Visitor.prototype.visitTry = function(decl){};
Visitor.prototype.visitCatch = function(decl){};
Visitor.prototype.visitConditional = function(decl){};
Visitor.prototype.visitExpressionStatement = function(decl){};
Visitor.prototype.visitBreak = function(decl){};
Visitor.prototype.visitReturn = function(decl){};
Visitor.prototype.visitIf = function(decl){};
Visitor.prototype.visitThrow = function(decl){};
Visitor.prototype.visitAssert = function(decl){};
Visitor.prototype.visitMethodInvocation = function(decl){};
Visitor.prototype.visitNewClass = function(decl){};
Visitor.prototype.visitNewArray = function(decl){};
Visitor.prototype.visitParens = function(decl){};
Visitor.prototype.visitAssignOp = function(decl){};
Visitor.prototype.visitUnary = function(decl){};
Visitor.prototype.visitBinary = function(decl){};
Visitor.prototype.visitTypeCast = function(decl){};
Visitor.prototype.visitInstanceof = function(decl){};
Visitor.prototype.visitArrayAccess = function(decl){};
Visitor.prototype.visitFieldAccess = function(decl){};
Visitor.prototype.visitThisAccess = function(decl){};
Visitor.prototype.visitIdent = function(decl){};
Visitor.prototype.visitLiteral = function(decl){};
Visitor.prototype.visitReferenceType = function(decl){};
Visitor.prototype.visitPrimitiveType = function(decl){};
Visitor.prototype.visitArrayTreeType = function(decl){};
Visitor.prototype.visitTypeApply = function(decl){};
Visitor.prototype.visitTypeParameter = function(decl){};
Visitor.prototype.visitAnnotation = function(decl){};
Visitor.Level = {};
Visitor.Level.Top = 0;
Visitor.Level.Class = Visitor.Level.Top + 1;

exports.Visitor = Visitor;
