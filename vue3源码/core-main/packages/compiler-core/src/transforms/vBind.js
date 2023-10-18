"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformBind = void 0;
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var shared_1 = require("@vue/shared");
var runtimeHelpers_1 = require("../runtimeHelpers");
// v-bind without arg is handled directly in ./transformElements.ts due to it affecting
// codegen for the entire props object. This transform here is only for v-bind
// *with* args.
var transformBind = function (dir, _node, context) {
    var exp = dir.exp, modifiers = dir.modifiers, loc = dir.loc;
    var arg = dir.arg;
    if (arg.type !== 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
        arg.children.unshift("(");
        arg.children.push(") || \"\"");
    }
    else if (!arg.isStatic) {
        arg.content = "".concat(arg.content, " || \"\"");
    }
    // .sync is replaced by v-model:arg
    if (modifiers.includes('camel')) {
        if (arg.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
            if (arg.isStatic) {
                arg.content = (0, shared_1.camelize)(arg.content);
            }
            else {
                arg.content = "".concat(context.helperString(runtimeHelpers_1.CAMELIZE), "(").concat(arg.content, ")");
            }
        }
        else {
            arg.children.unshift("".concat(context.helperString(runtimeHelpers_1.CAMELIZE), "("));
            arg.children.push(")");
        }
    }
    if (!context.inSSR) {
        if (modifiers.includes('prop')) {
            injectPrefix(arg, '.');
        }
        if (modifiers.includes('attr')) {
            injectPrefix(arg, '^');
        }
    }
    if (!exp ||
        (exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ && !exp.content.trim())) {
        context.onError((0, errors_1.createCompilerError)(34 /* ErrorCodes.X_V_BIND_NO_EXPRESSION */, loc));
        return {
            props: [(0, ast_1.createObjectProperty)(arg, (0, ast_1.createSimpleExpression)('', true, loc))]
        };
    }
    return {
        props: [(0, ast_1.createObjectProperty)(arg, exp)]
    };
};
exports.transformBind = transformBind;
var injectPrefix = function (arg, prefix) {
    if (arg.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
        if (arg.isStatic) {
            arg.content = prefix + arg.content;
        }
        else {
            arg.content = "`".concat(prefix, "${").concat(arg.content, "}`");
        }
    }
    else {
        arg.children.unshift("'".concat(prefix, "' + ("));
        arg.children.push(")");
    }
};
