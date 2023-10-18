"use strict";
// these keywords should not appear inside expressions, but operators like
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBrowserExpression = void 0;
var errors_1 = require("./errors");
// typeof, instanceof and in are allowed
var prohibitedKeywordRE = new RegExp('\\b' +
    ('do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
        'super,throw,while,yield,delete,export,import,return,switch,default,' +
        'extends,finally,continue,debugger,function,arguments,typeof,void')
        .split(',')
        .join('\\b|\\b') +
    '\\b');
// strip strings in expressions
var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;
/**
 * Validate a non-prefixed expression.
 * This is only called when using the in-browser runtime compiler since it
 * doesn't prefix expressions.
 */
function validateBrowserExpression(node, context, asParams, asRawStatements) {
    if (asParams === void 0) { asParams = false; }
    if (asRawStatements === void 0) { asRawStatements = false; }
    var exp = node.content;
    // empty expressions are validated per-directive since some directives
    // do allow empty expressions.
    if (!exp.trim()) {
        return;
    }
    try {
        new Function(asRawStatements
            ? " ".concat(exp, " ")
            : "return ".concat(asParams ? "(".concat(exp, ") => {}") : "(".concat(exp, ")")));
    }
    catch (e) {
        var message = e.message;
        var keywordMatch = exp
            .replace(stripStringRE, '')
            .match(prohibitedKeywordRE);
        if (keywordMatch) {
            message = "avoid using JavaScript keyword as property name: \"".concat(keywordMatch[0], "\"");
        }
        context.onError((0, errors_1.createCompilerError)(44 /* ErrorCodes.X_INVALID_EXPRESSION */, node.loc, undefined, message));
    }
}
exports.validateBrowserExpression = validateBrowserExpression;
