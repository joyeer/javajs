var AST = require("./ast").AST;
var Token = require("./ast").Token;
var keywordDict = require("./ast").keywordDict;

/**
 * Lexer Parser
 */
function Lexer() {
    this._scanPos = 0 ;
    this._code = "" ;
    this._tokens = [] ;
}

/**
 * get a Lexer token visitor
 */
Lexer.prototype.getVisitor = function() {
    return new TokenVisitor(this._tokens) ;
} ;

Lexer.prototype.parse = function(code) {
    this._code = code ;
    this._scanPos = -1 ;
    this._tokens = [] ;

    while(this._scanPos < (this._code.length - 1)) {
        var c = this._moveNext() ;
        switch(c) {
            case ' ': case '\t': case '\n':case '\r': case '\b':case '\f':
            // skipe white
            break;
            case '.': {
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if(t == '.') {
                        if( this._moveNext() == '.') {
                            this._push(new Token(Token.TK_ELLIPSIS)) ;
                            break;
                        }
                        this._movePrev() ;
                    } else if( this._isNum(t)){
                        this._movePrev();
                        this._parseNumber();
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_DOT)) ;
            }
                break;
            case ';':
                this._push(new Token(Token.TK_SEMI)) ;
                break;
            case '^':
                if(this._hasNext()) {
                    if(this._moveNext() == '=') {
                        this._push(new Token(Token.TK_CARETEQ));
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_CARET));
                break;
            case '%':
                if(this._hasNext()) {
                    if(this._moveNext() == '=') {
                        this._push(new Token(Token.TK_PERCENTEQ)) ;
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_PERCENT));
                break;
            case '@':
                this._push(new Token(Token.TK_MONKEYS_AT));
                break;
            case '*': {
                if(this._hasNext()) {
                    if(this._moveNext() == '=') {
                        this._push(new Token(Token.TK_STAREQ)) ;
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_STAR)) ;
            }
                break;
            case '{':
                this._push(new Token(Token.TK_LBRACE));
                break;
            case '}':
                this._push(new Token(Token.TK_RBRACE));
                break;
            case '(':
                this._push(new Token(Token.TK_LPAREN));
                break;
            case ')':
                this._push(new Token(Token.TK_RPAREN));
                break;
            case '[':
                this._push(new Token(Token.TK_LBRACKET));
                break;
            case ']':
                this._push(new Token(Token.TK_RBRACKET));
                break;
            case '<':
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if( t == '=') {
                        this._push(new Token(Token.TK_LTEQ)) ;
                        break;
                    } else if( t == '<') {
                        if(this._hasNext() ) {
                            if(this._moveNext() == '=') {
                                this._push(new Token(Token.TK_LTLTEQ)) ;
                                break;
                            }
                            this._movePrev() ;
                        }
                        this._push(new Token(Token.TK_LTLT)) ;
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_LT)) ;
                break;
            case '>':
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if( t == '=') {
                        this._push(new Token(Token.TK_GTEQ));
                        break;
                    } else if( t == '>') {
                        if(this._hasNext()) {
                            var n = this._moveNext() ;
                            if( n == '=') {
                                this._push(new Token(Token.TK_GTGTEQ)) ;
                                break;
                            } else if( n == '>') {
                                if(this._hasNext()) {
                                    if(this._moveNext() == '=') {
                                        this._push(new Token(Token.TK_GTGTGTEQ)) ;
                                        break;
                                    }
                                    this._movePrev() ;
                                }
                                this._push(new Token(Token.TK_GTGTGT)) ;
                                break;
                            }
                            this._movePrev() ;
                        }
                        this._push(new Token(Token.TK_GTGT)) ;
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_GT)) ;
                break;
            case '!':
                if(this._hasNext()) {
                    if(this._moveNext() == '=') {
                        this._push(new Token(Token.TK_BANDEQ)) ;
                        break;
                    }
                    this._movePrev();
                }
                this._push(new Token(Token.TK_BAND)) ;
                break;
            case '|':
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if(t == '|') {
                        this._push(new Token(Token.TK_BARBAR)) ;
                        break;
                    } else if( t == '=') {
                        this._push(new Token(Token.TK_BAREQ)) ;
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_BAR)) ;
                break;
            case '?':
                this._push(new Token(Token.TK_QUES));
                break;
            case ',':
                this._push(new Token(Token.TK_COMMA));
                break;
            case '-':
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if(t == '-') {
                        this._push(new Token(Token.TK_SUBSUB));
                        break;
                    } else if( t == '=') {
                        this._push(new Token(Token.TK_SUBEQ));
                        break ;
                    } else {
                        this._movePrev();
                    }
                }
                this._push(new Token(Token.TK_SUB));
                break;
            case '&':
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if(t == '&') {
                        this._push(new Token(Token.TK_AMPAMP));
                        break;
                    } else if( t == '=') {
                        this._push(new Token(Token.TK_AMPEQ));
                        break;
                    } else {
                        this._movePrev() ;
                    }
                }
                this._push(new Token(Token.TK_AMP)) ;
                break;
            case '=':
                if(this._hasNext()) {
                    if(this._moveNext() == '='){
                        this._push(new Token(Token.TK_EQEQ));
                        break;
                    } else {
                        this._movePrev() ;
                    }
                }
                this._push(new Token(Token.TK_EQ));
                break;
            case '~':
                this._push(new Token(Token.TK_TILDE));
                break;
            case ':':
                this._push(new Token(Token.TK_COLON));
                break;
            case '+':
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if( t == '=') {
                        this._push(new Token(Token.TK_PLUSEQ)) ;
                        break;
                    } else if( t == '+') {
                        this._push(new Token(Token.TK_PLUSPLUS)) ;
                        break;
                    }
                    this._movePrev();
                }
                this._push(new Token(Token.TK_PLUS));
                break;
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
            this._parseNumber();
            break;
            case '$':
            case '_':
            case 'a': case 'b': case 'c': case 'd': case 'e': case 'f': case 'g': case 'h': case 'i': case 'j': case 'k': case 'l': case 'm': case 'n': case 'o': case 'p': case 'q': case 'r': case 's': case 't': case 'u': case 'v': case 'w':  case 'x':  case 'y': case 'z':
            case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': case 'H': case 'I': case 'J': case 'K': case 'L': case 'M': case 'N': case 'O': case 'P': case 'Q': case 'R': case 'S': case 'T': case 'U': case 'V': case 'W':  case 'X':  case 'Y': case 'Z':
            this._parseWord();
            break;
            case '/':
                if(this._hasNext()) {
                    var t = this._moveNext() ;
                    if( t == '*') {
                        this._parseCComment() ;
                        break;
                    } else if( t == '/') {
                        this._parseCppComment() ;
                        break;
                    } else if( t == '=') {
                        this._push(new Token(Token.TK_SLASHEQ));
                        break;
                    }
                    this._movePrev() ;
                }
                this._push(new Token(Token.TK_SLASH));
                break;
            case '\"':
                this._parseString() ;
                break;
            case '\'':
                this._parseCharacter() ;
                break;
            default:
                throw ( "stop meet:'" + c.charCodeAt(0) + "'") ;
                break;
        }
    }

    // EOF LEXER parser
    this._push(new Token(Token.EOF));
} ;

Lexer.prototype._push = function(token) {
    this._tokens.push(token) ;
} ;

Lexer.prototype._parseCharacter = function() {
    var t = this._moveNext();
    var start = this._scanPos;
    if(t == '\\') {
        t = this._moveNext() ;
        if(t == 'u') {
            var t1 = this._moveNext();
            var t2 = this._moveNext();
            var t3 = this._moveNext();
            var t4 = this._moveNext();
            if( this._isHexDigital(t1) && this._isHexDigital(t2) && this._isHexDigital(t3) && this._isHexDigital(t4)) {
                this._eat('\'',"Char Error");
            } else {
                throw "Char Error";
            }
        } else if( t == 'b' || t == 't' || t == 'n' || t == 'f' || t == 'r' || t == "\"" || t == '\'' || t == '\\' ) {
            this._eat('\'',"Char Error");
        } else {
            if(this._isDigits(t)){
                if(!this._isDigits(this._moveNext())){
                    this._movePrev();
                } else if( !this._isDigits(this._moveNext())){
                    this._movePrev();
                }
                this._eat('\'',"Char Error");
            } else {
                throw 'Not implemented';
            }
        }
        this._tokens.push(new Token(Token.TK_CharacterLiteral,this._code.substring(start ,this._scanPos) ));
    } else {
        var c = this._moveNext();
        if(c  == '\'') {
            this._tokens.push(new Token(Token.TK_CharacterLiteral,t));
        } else {
            throw "Error";
        }
    }
} ;

Lexer.prototype._parseString = function() {
    var continueFlag = true;
    var startChar = this._code.charAt(this._scanPos);
    var startIndex = this._scanPos ;
    do {
        var c = this._moveNext();
        switch(c) {
            case '\n':
                throw "Error String" ;
                break;
            case '\\':
                switch(this._moveNext()) {
                    case 'b': case 't': case 'n': case 'f': case 'r': case '\"': case '\'': case '\\':case 'u':
                    case '0':case '1': case '2':case '3':case '4':case '5':case '6':case '7':case '8':case '9':
                    break;
                    default:
                        throw "Error String for '\\' escape";
                }
                break;
            default:
                if( c == startChar) {
                    continueFlag = false;
                }
        }
    }while(continueFlag) ;

    var str = this._code.substring(startIndex ,this._scanPos + 1) ;
    this._push(new Token(Token.TK_StringLiteral,str)) ;
};

/**
 * parse number for decimal or float number
 * if hex/ otcal , pass them to other method for deep analyze
 */
Lexer.prototype._parseNumber = function() {
    var c = this._cur() ;
    var startIndex = this._scanPos ;
    var isHex = false;

    if(c == '0' && this._hasNext()) {
        c = this._moveNext() ;
        if( this._isOctalDigit(c) || c == '_') {
            return this._parseOctalNumeral(startIndex);
        } else if( c == 'b' || c == 'B') {
            return this._parseBinaryNumeral(startIndex);
        } else if( c == 'x' || c == 'X') {
            isHex = true;
            // parse it laters
        } else if( this._isDigits(c) ){
            throw "This literal is out of octal type ranger" + this._code[this._scanPos - 3] + this._code[this._scanPos - 2] + this._code[this._scanPos - 1] + this._code[this._scanPos ];
        } else if( c == 'f' || c == 'F' || c == 'D' || c == 'd'){
            this._push(new Token(Token.TK_FloatingLiteral,"0"));
            return;
        } else if( c == 'l' || c == 'L') {
            this._push(new Token(Token.TK_IntegerLiteral,"0"));
            return;
        } else if(c == '.' ) {
            this._movePrev();
        } else {
            this._push(new Token(Token.TK_IntegerLiteral,"0"));
            this._movePrev();
            return ;
        }
    }

    if(!this._hasNext() ) {
        this._push(new Token(Token.TK_IntegerLiteral,"0"));
        return ;
    }

    if(isHex) {
        this._parseHexFloatingLiteral(startIndex) ;
    } else {
        this._parseDecimalFloatingLiteral(startIndex) ;
    }


} ;

/**
 * DecimalFloatingPointLiteral:
 *   Digits . Digitsopt ExponentPartopt FloatTypeSuffixopt
 *   . Digits ExponentPartopt FloatTypeSuffixopt
 *   Digits ExponentPart FloatTypeSuffixopt
 *   Digits ExponentPartopt FloatTypeSuffix
 *
 * ExponentPart:
 *   ExponentIndicator SignedInteger
 *
 * ExponentIndicator: one of
 *   e E
 *
 * SignedInteger:
 *   Signopt Digits
 *
 * Sign: one of
 *    + -
 *
 * FloatTypeSuffix: one of
 *   f F d D
 *
 */
Lexer.prototype._parseDecimalFloatingLiteral = function (startIndex) {
    // TODO: refactor this method name
    var isFloating = false;

    while(this._hasNext()) {
        if(!this._isDigits(this._moveNext())) {
            this._movePrev();
            break;
        }
    }

    if(this._hasNext()) {
        if(this._moveNext() == '.') {
            isFloating = true;
            do {
                if(!this._isDigits(this._moveNext())) {
                    this._movePrev();
                    break;
                }
                if(!this._hasNext()) {
                    break;
                }
            }while(true)
        } else {
            this._movePrev() ;
        }
    }

    if(this._hasNext()) {
        var c = this._moveNext() ;
        if(c == 'e' || c == 'E') {
            isFloating = true;
            var c = this._moveNext() ;
            if(c == '+' || c == '-') {
                // continue;
            } else {
                this._movePrev() ;
            }

            while(this._hasNext()) {
                if(!this._isDigits(this._moveNext())) {
                    this._movePrev();
                    break;
                }
            }
        } else {
            this._movePrev();
        }
    }

    //TODO: some duplicate code with _parseHexFloatingLiteral, refactor it later!!!
    if(this._hasNext()) {
        var c = this._moveNext() ;

        if( c != 'f' && c != 'F' && c != 'd' && c != 'D') {
            this._movePrev();
        } else {
            isFloating = true;
        }
    }

    if(this._hasNext() && !isFloating) {
        var c = this._moveNext();
        if(c != 'L' && c != 'l') {
            this._movePrev();
        }
    }

    var token = this._code.substring(startIndex, this._scanPos + 1) ;
    this._push(new Token(isFloating? Token.TK_FloatingLiteral : Token.TK_IntegerLiteral,token)) ;
} ;

/**
 * HexadecimalFloatingPointLiteral:
 *   HexSignificand BinaryExponent FloatTypeSuffixopt
 *
 * HexSignificand:
 *   HexNumeral
 *   HexNumeral .
 *   0 x HexDigitsopt . HexDigits
 *   0 X HexDigitsopt . HexDigits
 *
 * BinaryExponent:
 *   BinaryExponentIndicator SignedInteger
 *
 * BinaryExponentIndicator:one of
 *   p P
 */
Lexer.prototype._parseHexFloatingLiteral = function(startIndex) {
    var isFloating = false;
    while(this._hasNext()) {
        if(!this._isHexDigital(this._moveNext())) {
            this._movePrev() ;
            break;
        }
    }
    if(this._hasNext()) {
        if(this._moveNext() == '.') {
            isFloating = true;
            while(this._hasNext()) {
                if(!this._isHexDigital(this._moveNext())) {
                    this._movePrev() ;
                    break;
                }
            }
        } else {
            this._movePrev();
        }
    }

    if(this._hasNext()) {
        var c = this._moveNext() ;
        if( c == 'p' || c == 'P') {
            var c = this._moveNext() ;
            if(c == '+' || c == '-') {
                // continue;
            }
            else {
                this._movePrev() ;
            }

            while(this._hasNext()) {
                if(!this._isDigits(this._moveNext())) {
                    this._movePrev();
                    break;
                }
            }
        } else {
            this._movePrev();
        }
    }

    if(this._hasNext()) {
        var c = this._moveNext() ;

        if( c != 'f' && c != 'F' && c != 'd' && c != 'D') {
            this._movePrev();
        } else {
            isFloating = true;
        }
    }

    if(this._hasNext()){
        var c = this._moveNext();
        if(c != 'l' && c != 'L'){
            this._movePrev();
        } else {
            isFloating = false;
        }
    }

    var token = this._code.substring(startIndex, this._scanPos + 1) ;
    this._push(new Token(isFloating? Token.TK_FloatingLiteral : Token.TK_IntegerLiteral,token)) ;

} ;

Lexer.prototype._parseBinaryNumeral = function(startIndex) {
    while(this._hasNext()) {
        var c = this._moveNext() ;
        if(! this._isBinaryDigit(c) && c != '_') {
            this._movePrev();
            break;
        }
    }

    var token = this._code.substring(startIndex,this._scanPos + 1) ;
    if(token.charAt(token.length - 1) == '_') {
        throw "underscore should in mid of number" ;
    }
    this._push(new Token(Token.TK_IntegerLiteral,token)) ;
} ;

/**
 * OctalNumeral:
 *   0 OctalDigits
 *   0 Underscores OctalDigits
 *
 * OctalDigits:
 *  OctalDigit
 *   OctalDigit OctalDigitsAndUnderscoresopt OctalDigit
 *
 * OctalDigit: one of
 *   0 1 2 3 4 5 6 7
 *
 * OctalDigitsAndUnderscores:
 *   OctalDigitOrUnderscore
 *   OctalDigitsAndUnderscores OctalDigitOrUnderscore
 *
 * OctalDigitOrUnderscore:
 *   OctalDigit
 *   _
 */
Lexer.prototype._parseOctalNumeral = function(startIndex) {
    while(this._hasNext()) {
        var c = this._moveNext() ;
        if( !this._isOctalDigit(c) && c != '_') {
            this._movePrev();
            break;
        }
    }

    if(this._hasNext()) {
        var c = this._moveNext();
        if( c != 'L' && c != 'l') {
            this._movePrev();
        }
    }


    var token = this._code.substring(startIndex,this._scanPos + 1) ;

    if(token.charAt(token.length - 1) == '_') {
        throw "underscore should in mid of number" ;
    }
    this._push(new Token(Token.TK_IntegerLiteral,token)) ;
} ;

Lexer.prototype._parseWord = function() {
    var startIndex = this._scanPos ;
    var continueFlag = true ;
    do {
        switch(this._moveNext()) {
            case '$':
            case '_':
            case 'a': case 'b': case 'c': case 'd': case 'e': case 'f': case 'g': case 'h': case 'i': case 'j': case 'k': case 'l': case 'm': case 'n': case 'o': case 'p': case 'q': case 'r': case 's': case 't': case 'u': case 'v': case 'w':  case 'x':  case 'y': case 'z':
            case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': case 'H': case 'I': case 'J': case 'K': case 'L': case 'M': case 'N': case 'O': case 'P': case 'Q': case 'R': case 'S': case 'T': case 'U': case 'V': case 'W':  case 'X':  case 'Y': case 'Z':
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
            break;
            default:
                continueFlag = false;
                break;
        }
    } while(continueFlag) ;

    var word = this._code.substring(startIndex, this._scanPos) ;

    if((word in keywordDict) && typeof keywordDict[word] == 'string') {
        if(keywordDict[word] == Token.TK_BooleanLiteral) {
            this._push(new Token(keywordDict[word], word)) ;
        } else {
            this._push(new Token(keywordDict[word]));
        }

    } else {
        this._push(new Token(Token.TK_Identifier,word));
    }


    this._movePrev() ;
} ;

Lexer.prototype._parseCppComment = function() {
    try {
        while(this._moveNext() != '\n') {}
    } catch( err) {
    }
} ;

Lexer.prototype._parseCComment = function() {
    this._moveNext() ;

    var index = this._code.indexOf("*/",this._scanPos) ;
    if(index == -1) {
        throw "Parse C Comment Error" ;
    }
    this._scanPos = index + 1;
} ;

Lexer.prototype._isNum = function(c){
    switch(c) {
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
        return true;
        default:
            return false;
    }
}

Lexer.prototype._isDigits = function(c) {
    switch(c) {
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
        case '_':
            return true;
        default:
            return false;
    }
} ;

Lexer.prototype._isHexDigital = function(c) {
    switch(c) {
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
        case 'a': case 'b': case 'c': case 'd': case 'e': case 'f':
        case 'A': case 'B': case 'C': case 'D': case 'E': case 'F':
        return true;
        default:
            return false;
    }
} ;

Lexer.prototype._isBinaryDigit = function(c) {
    switch(c) {
        case '0': case '1':
        return true;
        default:
            return false;
    }
} ;


Lexer.prototype._isOctalDigit = function(c) {
    switch(c) {
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7':
        return true;
        default:
            return false;
    }
} ;

Lexer.prototype._eat = function(c,error){
    if(this._moveNext() != c) {
        throw error;
    }
};

Lexer.prototype._cur = function () {
    return this._code.charAt(this._scanPos) ;
} ;

Lexer.prototype._hasNext = function() {
    return this._scanPos < this._code.length ;
} ;

Lexer.prototype._moveNext = function() {
    this._scanPos ++ ;
    if(this._scanPos > this._code.length )  {
        throw  "EOF" ;
    }
    return this._code.charAt(this._scanPos) ;
} ;

Lexer.prototype._movePrev = function() {
    this._scanPos -- ;
    if(this._scanPos < 0 ) {
        throw "Move ahead of file" ;
    }
} ;




/**
 * An internal token visitor
 * @param tokens
 */
function InternalVisitor(tokens,original) {
    this._tokens = tokens ;
    this._pos = -1 ;
    this._isOriginal = original;
}
InternalVisitor.EOF = "internalvisitor.eof";

InternalVisitor.prototype.next = function() {
    this._pos ++ ;
    if(this._pos < this._tokens.length) {
        return this._tokens[this._pos] ;
    }
    if(this._isOriginal) {
        throw "End of file";
    }
    return InternalVisitor.EOF;
} ;

InternalVisitor.prototype.prev = function() {
    this._pos -- ;
    return this._tokens[this._pos];
} ;

InternalVisitor.prototype.mark = function() {
    return this._pos;
} ;

InternalVisitor.prototype.restore = function(pos) {
    this._pos = pos ;
} ;

InternalVisitor.prototype.cur = function(){
    return this._tokens[this._pos];
};

/**
 * a Visitor for token list
 *
 */
function TokenVisitor(tokens) {
    var visitor = new InternalVisitor(tokens,true);
    this._visitorStack = [visitor];
    this._visitorMarks = [];
}

/**
 * visit next token
 * @param flag
 * @return {*}
 */
TokenVisitor.prototype.next = function(flag) {
    var r =  this._curVisitor().next();
    if(r == InternalVisitor.EOF) {
        this._visitorStack.push(this._visitorStack[0]);
        return this.next();
    }

    if(flag) {
        var tokens = null;
        switch(r.tk) {
            case Token.TK_GTGTGT:
                tokens = [new Token(Token.TK_GT),new Token(Token.TK_GT),new Token(Token.TK_GT)];
                break;
            case Token.TK_GTGT :
                tokens = [new Token(Token.TK_GT),new Token(Token.TK_GT)];
                break;
            case this.TK_GTGTEQ:
                tokens = [new Token(Token.TK_GT),new Token(Token.TK_GT),new Token(Token.TK_EQ)];
                break;
            case this.TK_GTGTGTEQ:
                tokens = [new Token(Token.TK_GT),new Token(Token.TK_GT),new Token(Token.TK_GT),new Token(Token.TK_EQ)];
                break;
            default:
                return r;
        }
        var newVisitor = new InternalVisitor(tokens);
        this._visitorStack.push(newVisitor);
        return this.next();
    }

    return r;
} ;

/**
 * move to previouly token
 * @return {*}
 */
TokenVisitor.prototype.prev = function() {
    return this._curVisitor().prev();
} ;

/**
 * return current token;
 * @return {*}
 */
TokenVisitor.prototype.cur = function(){
    return this._curVisitor().cur();
};

/**
 * we mark current visitor stack's count + current visitor's position
 */
TokenVisitor.prototype.mark = function() {
    this._visitorMarks.push([this._visitorStack.length,this._curVisitor().mark()]);
} ;

TokenVisitor.prototype.restore = function(pass) {

    if(pass) {
        this._visitorMarks.pop();
    } else {
        var pos = this._visitorMarks.pop();
        var stackLen = pos[0];
        var visitorPos = pos[1];
        while(this._visitorStack.length != stackLen) {
            this._visitorStack.pop();
        }
        this._curVisitor().restore(visitorPos);
    }
} ;

TokenVisitor.prototype._curVisitor = function() {
    return this._visitorStack[this._visitorStack.length -1];
};

exports.Lexer = Lexer ;
exports.TokenVisitor = TokenVisitor;
