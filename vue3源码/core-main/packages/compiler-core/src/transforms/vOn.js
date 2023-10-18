"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformOn = void 0;
var ast_1 = require("../ast");
var shared_1 = require("@vue/shared");
var errors_1 = require("../errors");
var transformExpression_1 = require("./transformExpression");
var validateExpression_1 = require("../validateExpression");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var fnExpRE = /^\s*([\w$_]+|(async\s*)?\([^)]*?\))\s*(:[^=]+)?=>|^\s*(async\s+)?function(?:\s+[\w$]+)?\s*\(/;
var transformOn = function (dir, node, context, augmentor) {
    var _a = dir, loc = _a.loc, modifiers = _a.modifiers, arg = _a.arg;
    if (!dir.exp && !modifiers.length) {
        context.onError((0, errors_1.createCompilerError)(35 /* ErrorCodes.X_V_ON_NO_EXPRESSION */, loc));
    }
    var eventName;
    if (arg.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
        if (arg.isStatic) {
            var rawName = arg.content;
            // TODO deprecate @vnodeXXX usage
            if (rawName.startsWith('vue:')) {
                rawName = "vnode-".concat(rawName.slice(4));
            }
            var eventString = node.tagType === 1 /* ElementTypes.COMPONENT */ ||
                rawName.startsWith('vnode') ||
                !/[A-Z]/.test(rawName)
                ? // for component and vnode lifecycle event listeners, auto convert
                    // it to camelCase. See issue #2249
                    (0, shared_1.toHandlerKey)((0, shared_1.camelize)(rawName))
                : // preserve case for plain element listeners that have uppercase
                    // letters, as these may be custom elements' custom events
                    "on:".concat(rawName);
            eventName = (0, ast_1.createSimpleExpression)(eventString, true, arg.loc);
        }
        else {
            // #2388
            eventName = (0, ast_1.createCompoundExpression)([
                "".concat(context.helperString(runtimeHelpers_1.TO_HANDLER_KEY), "("),
                arg,
                ")"
            ]);
        }
    }
    else {
        // already a compound expression.
        eventName = arg;
        eventName.children.unshift("".concat(context.helperString(runtimeHelpers_1.TO_HANDLER_KEY), "("));
        eventName.children.push(")");
    }
    // handler processing
    var exp = dir.exp;
    if (exp && !exp.content.trim()) {
        exp = undefined;
    }
    var shouldCache = context.cacheHandlers && !exp && !context.inVOnce;
    if (exp) {
        var isMemberExp = (0, utils_1.isMemberExpression)(exp.content, context);
        var isInlineStatement = !(isMemberExp || fnExpRE.test(exp.content));
        var hasMultipleStatements = exp.content.includes(";");
        // process the expression since it's been skipped
        if (!__BROWSER__ && context.prefixIdentifiers) {
            isInlineStatement && context.addIdentifiers("$event");
            exp = dir.exp = (0, transformExpression_1.processExpression)(exp, context, false, hasMultipleStatements);
            isInlineStatement && context.removeIdentifiers("$event");
            // with scope analysis, the function is hoistable if it has no reference
            // to scope variables.
            shouldCache =
                context.cacheHandlers &&
                    // unnecessary to cache inside v-once
                    !context.inVOnce &&
                    // runtime constants don't need to be cached
                    // (this is analyzed by compileScript in SFC <script setup>)
                    !(exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ && exp.constType > 0) &&
                    // #1541 bail if this is a member exp handler passed to a component -
                    // we need to use the original function to preserve arity,
                    // e.g. <transition> relies on checking cb.length to determine
                    // transition end handling. Inline function is ok since its arity
                    // is preserved even when cached.
                    !(isMemberExp && node.tagType === 1 /* ElementTypes.COMPONENT */) &&
                    // bail if the function references closure variables (v-for, v-slot)
                    // it must be passed fresh to avoid stale values.
                    !(0, utils_1.hasScopeRef)(exp, context.identifiers);
            // If the expression is optimizable and is a member expression pointing
            // to a function, turn it into invocation (and wrap in an arrow function
            // below) so that it always accesses the latest value when called - thus
            // avoiding the need to be patched.
            if (shouldCache && isMemberExp) {
                if (exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
                    exp.content = "".concat(exp.content, " && ").concat(exp.content, "(...args)");
                }
                else {
                    exp.children = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], exp.children, true), [" && "], false), exp.children, true), ["(...args)"], false);
                }
            }
        }
        if (__DEV__ && __BROWSER__) {
            (0, validateExpression_1.validateBrowserExpression)(exp, context, false, hasMultipleStatements);
        }
        if (isInlineStatement || (shouldCache && isMemberExp)) {
            // wrap inline statement in a function expression
            exp = (0, ast_1.createCompoundExpression)([
                "".concat(isInlineStatement
                    ? !__BROWSER__ && context.isTS
                        ? "($event: any)"
                        : "$event"
                    : "".concat(!__BROWSER__ && context.isTS ? "\n//@ts-ignore\n" : "", "(...args)"), " => ").concat(hasMultipleStatements ? "{" : "("),
                exp,
                hasMultipleStatements ? "}" : ")"
            ]);
        }
    }
    var ret = {
        props: [
            (0, ast_1.createObjectProperty)(eventName, exp || (0, ast_1.createSimpleExpression)("() => {}", false, loc))
        ]
    };
    // apply extended compiler augmentor
    if (augmentor) {
        ret = augmentor(ret);
    }
    if (shouldCache) {
        // cache handlers so that it's always the same handler being passed down.
        // this avoids unnecessary re-renders when users use inline handlers on
        // components.
        ret.props[0].value = context.cache(ret.props[0].value);
    }
    // mark the key as handler for props normalization check
    ret.props.forEach(function (p) { return (p.key.isHandlerKey = true); });
    return ret;
};
exports.transformOn = transformOn;
