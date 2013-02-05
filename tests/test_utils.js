var utils = require("../utils");

exports.textGetBaseClassName = function(test){
    test.equals(utils.getBaseClassName("java"),"java");
    test.equals(utils.getBaseClassName("java.lang.String"),"String");
    test.done();
};
