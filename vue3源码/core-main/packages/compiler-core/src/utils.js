"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeBlock = exports.getMemoedVNodeCall = exports.hasScopeRef = exports.toValidAssetId = exports.injectProp = exports.getVNodeBlockHelper = exports.getVNodeHelper = exports.isSlotOutlet = exports.isTemplateNode = exports.isVSlot = exports.isText = exports.hasDynamicKeyVBind = exports.isStaticArgOf = exports.findProp = exports.findDir = exports.assert = exports.advancePositionWithMutation = exports.advancePositionWithClone = exports.getInnerRange = exports.isMemberExpression = exports.isMemberExpressionNode = exports.isMemberExpressionBrowser = exports.isSimpleIdentifier = exports.isCoreComponent = exports.isBuiltInType = exports.isStaticExp = void 0;
var ast_1 = require("./ast");
var runtimeHelpers_1 = require("./runtimeHelpers");
var shared_1 = require("@vue/shared");
var parser_1 = require("@babel/parser");
var isStaticExp = function (p) {
    return p.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ && p.isStatic;
};
exports.isStaticExp = isStaticExp;
var isBuiltInType = function (tag, expected) {
    return tag === expected || tag === (0, shared_1.hyphenate)(expected);
};
exports.isBuiltInType = isBuiltInType;
function isCoreComponent(tag) {
    if ((0, exports.isBuiltInType)(tag, 'Teleport')) {
        return runtimeHelpers_1.TELEPORT;
    }
    else if ((0, exports.isBuiltInType)(tag, 'Suspense')) {
        return runtimeHelpers_1.SUSPENSE;
    }
    else if ((0, exports.isBuiltInType)(tag, 'KeepAlive')) {
        return runtimeHelpers_1.KEEP_ALIVE;
    }
    else if ((0, exports.isBuiltInType)(tag, 'BaseTransition')) {
        return runtimeHelpers_1.BASE_TRANSITION;
    }
}
exports.isCoreComponent = isCoreComponent;
var nonIdentifierRE = /^\d|[^\$\w]/;
var isSimpleIdentifier = function (name) {
    return !nonIdentifierRE.test(name);
};
exports.isSimpleIdentifier = isSimpleIdentifier;
var validFirstIdentCharRE = /[A-Za-z_$\xA0-\uFFFF]/;
var validIdentCharRE = /[\.\?\w$\xA0-\uFFFF]/;
var whitespaceRE = /\s+[.[]\s*|\s*[.[]\s+/g;
/**
 * Simple lexer to check if an expression is a member expression. This is
 * lax and only checks validity at the root level (i.e. does not validate exps
 * inside square brackets), but it's ok since these are only used on template
 * expressions and false positives are invalid expressions in the first place.
 */
var isMemberExpressionBrowser = function (path) {
    // remove whitespaces around . or [ first
    path = path.trim().replace(whitespaceRE, function (s) { return s.trim(); });
    var state = 0 /* MemberExpLexState.inMemberExp */;
    var stateStack = [];
    var currentOpenBracketCount = 0;
    var currentOpenParensCount = 0;
    var currentStringType = null;
    for (var i = 0; i < path.length; i++) {
        var char = path.charAt(i);
        switch (state) {
            case 0 /* MemberExpLexState.inMemberExp */:
                if (char === '[') {
                    stateStack.push(state);
                    state = 1 /* MemberExpLexState.inBrackets */;
                    currentOpenBracketCount++;
                }
                else if (char === '(') {
                    stateStack.push(state);
                    state = 2 /* MemberExpLexState.inParens */;
                    currentOpenParensCount++;
                }
                else if (!(i === 0 ? validFirstIdentCharRE : validIdentCharRE).test(char)) {
                    return false;
                }
                break;
            case 1 /* MemberExpLexState.inBrackets */:
                if (char === "'" || char === "\"" || char === '`') {
                    stateStack.push(state);
                    state = 3 /* MemberExpLexState.inString */;
                    currentStringType = char;
                }
                else if (char === "[") {
                    currentOpenBracketCount++;
                }
                else if (char === "]") {
                    if (!--currentOpenBracketCount) {
                        state = stateStack.pop();
                    }
                }
                break;
            case 2 /* MemberExpLexState.inParens */:
                if (char === "'" || char === "\"" || char === '`') {
                    stateStack.push(state);
                    state = 3 /* MemberExpLexState.inString */;
                    currentStringType = char;
                }
                else if (char === "(") {
                    currentOpenParensCount++;
                }
                else if (char === ")") {
                    // if the exp ends as a call then it should not be considered valid
                    if (i === path.length - 1) {
                        return false;
                    }
                    if (!--currentOpenParensCount) {
                        state = stateStack.pop();
                    }
                }
                break;
            case 3 /* MemberExpLexState.inString */:
                if (char === currentStringType) {
                    state = stateStack.pop();
                    currentStringType = null;
                }
                break;
        }
    }
    return !currentOpenBracketCount && !currentOpenParensCount;
};
exports.isMemberExpressionBrowser = isMemberExpressionBrowser;
exports.isMemberExpressionNode = __BROWSER__
    ? shared_1.NOOP
    : function (path, context) {
        try {
            var ret = (0, parser_1.parseExpression)(path, {
                plugins: context.expressionPlugins
            });
            if (ret.type === 'TSAsExpression' || ret.type === 'TSTypeAssertion') {
                ret = ret.expression;
            }
            return (ret.type === 'MemberExpression' ||
                ret.type === 'OptionalMemberExpression' ||
                ret.type === 'Identifier');
        }
        catch (e) {
            return false;
        }
    };
exports.isMemberExpression = __BROWSER__
    ? exports.isMemberExpressionBrowser
    : exports.isMemberExpressionNode;
function getInnerRange(loc, offset, length) {
    __TEST__ && assert(offset <= loc.source.length);
    var source = loc.source.slice(offset, offset + length);
    var newLoc = {
        source: source,
        start: advancePositionWithClone(loc.start, loc.source, offset),
        end: loc.end
    };
    if (length != null) {
        __TEST__ && assert(offset + length <= loc.source.length);
        newLoc.end = advancePositionWithClone(loc.start, loc.source, offset + length);
    }
    return newLoc;
}
exports.getInnerRange = getInnerRange;
function advancePositionWithClone(pos, source, numberOfCharacters) {
    if (numberOfCharacters === void 0) { numberOfCharacters = source.length; }
    return advancePositionWithMutation((0, shared_1.extend)({}, pos), source, numberOfCharacters);
}
exports.advancePositionWithClone = advancePositionWithClone;
// advance by mutation without cloning (for performance reasons), since this
// gets called a lot in the parser
function advancePositionWithMutation(pos, source, numberOfCharacters) {
    if (numberOfCharacters === void 0) { numberOfCharacters = source.length; }
    var linesCount = 0;
    var lastNewLinePos = -1;
    for (var i = 0; i < numberOfCharacters; i++) {
        if (source.charCodeAt(i) === 10 /* newline char code */) {
            linesCount++;
            lastNewLinePos = i;
        }
    }
    pos.offset += numberOfCharacters;
    pos.line += linesCount;
    pos.column =
        lastNewLinePos === -1
            ? pos.column + numberOfCharacters
            : numberOfCharacters - lastNewLinePos;
    return pos;
}
exports.advancePositionWithMutation = advancePositionWithMutation;
function assert(condition, msg) {
    /* istanbul ignore if */
    if (!condition) {
        throw new Error(msg || "unexpected compiler condition");
    }
}
exports.assert = assert;
function findDir(node, name, allowEmpty) {
    if (allowEmpty === void 0) { allowEmpty = false; }
    for (var i = 0; i < node.props.length; i++) {
        var p = node.props[i];
        if (p.type === 7 /* NodeTypes.DIRECTIVE */ &&
            (allowEmpty || p.exp) &&
            ((0, shared_1.isString)(name) ? p.name === name : name.test(p.name))) {
            return p;
        }
    }
}
exports.findDir = findDir;
function findProp(node, name, dynamicOnly, allowEmpty) {
    if (dynamicOnly === void 0) { dynamicOnly = false; }
    if (allowEmpty === void 0) { allowEmpty = false; }
    for (var i = 0; i < node.props.length; i++) {
        var p = node.props[i];
        if (p.type === 6 /* NodeTypes.ATTRIBUTE */) {
            if (dynamicOnly)
                continue;
            if (p.name === name && (p.value || allowEmpty)) {
                return p;
            }
        }
        else if (p.name === 'bind' &&
            (p.exp || allowEmpty) &&
            isStaticArgOf(p.arg, name)) {
            return p;
        }
    }
}
exports.findProp = findProp;
function isStaticArgOf(arg, name) {
    return !!(arg && (0, exports.isStaticExp)(arg) && arg.content === name);
}
exports.isStaticArgOf = isStaticArgOf;
function hasDynamicKeyVBind(node) {
    return node.props.some(function (p) {
        return p.type === 7 /* NodeTypes.DIRECTIVE */ &&
            p.name === 'bind' &&
            (!p.arg || // v-bind="obj"
                p.arg.type !== 4 /* NodeTypes.SIMPLE_EXPRESSION */ || // v-bind:[_ctx.foo]
                !p.arg.isStatic);
    } // v-bind:[foo]
    );
}
exports.hasDynamicKeyVBind = hasDynamicKeyVBind;
function isText(node) {
    return node.type === 5 /* NodeTypes.INTERPOLATION */ || node.type === 2 /* NodeTypes.TEXT */;
}
exports.isText = isText;
function isVSlot(p) {
    return p.type === 7 /* NodeTypes.DIRECTIVE */ && p.name === 'slot';
}
exports.isVSlot = isVSlot;
function isTemplateNode(node) {
    return (node.type === 1 /* NodeTypes.ELEMENT */ && node.tagType === 3 /* ElementTypes.TEMPLATE */);
}
exports.isTemplateNode = isTemplateNode;
function isSlotOutlet(node) {
    return node.type === 1 /* NodeTypes.ELEMENT */ && node.tagType === 2 /* ElementTypes.SLOT */;
}
exports.isSlotOutlet = isSlotOutlet;
function getVNodeHelper(ssr, isComponent) {
    return ssr || isComponent ? runtimeHelpers_1.CREATE_VNODE : runtimeHelpers_1.CREATE_ELEMENT_VNODE;
}
exports.getVNodeHelper = getVNodeHelper;
function getVNodeBlockHelper(ssr, isComponent) {
    return ssr || isComponent ? runtimeHelpers_1.CREATE_BLOCK : runtimeHelpers_1.CREATE_ELEMENT_BLOCK;
}
exports.getVNodeBlockHelper = getVNodeBlockHelper;
var propsHelperSet = new Set([runtimeHelpers_1.NORMALIZE_PROPS, runtimeHelpers_1.GUARD_REACTIVE_PROPS]);
function getUnnormalizedProps(props, callPath) {
    if (callPath === void 0) { callPath = []; }
    if (props &&
        !(0, shared_1.isString)(props) &&
        props.type === 14 /* NodeTypes.JS_CALL_EXPRESSION */) {
        var callee = props.callee;
        if (!(0, shared_1.isString)(callee) && propsHelperSet.has(callee)) {
            return getUnnormalizedProps(props.arguments[0], callPath.concat(props));
        }
    }
    return [props, callPath];
}
function injectProp(node, prop, context) {
    var propsWithInjection;
    /**
     * 1. mergeProps(...)
     * 2. toHandlers(...)
     * 3. normalizeProps(...)
     * 4. normalizeProps(guardReactiveProps(...))
     *
     * we need to get the real props before normalization
     */
    var props = node.type === 13 /* NodeTypes.VNODE_CALL */ ? node.props : node.arguments[2];
    var callPath = [];
    var parentCall;
    if (props &&
        !(0, shared_1.isString)(props) &&
        props.type === 14 /* NodeTypes.JS_CALL_EXPRESSION */) {
        var ret = getUnnormalizedProps(props);
        props = ret[0];
        callPath = ret[1];
        parentCall = callPath[callPath.length - 1];
    }
    if (props == null || (0, shared_1.isString)(props)) {
        propsWithInjection = (0, ast_1.createObjectExpression)([prop]);
    }
    else if (props.type === 14 /* NodeTypes.JS_CALL_EXPRESSION */) {
        // merged props... add ours
        // only inject key to object literal if it's the first argument so that
        // if doesn't override user provided keys
        var first = props.arguments[0];
        if (!(0, shared_1.isString)(first) && first.type === 15 /* NodeTypes.JS_OBJECT_EXPRESSION */) {
            // #6631
            if (!hasProp(prop, first)) {
                first.properties.unshift(prop);
            }
        }
        else {
            if (props.callee === runtimeHelpers_1.TO_HANDLERS) {
                // #2366
                propsWithInjection = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.MERGE_PROPS), [
                    (0, ast_1.createObjectExpression)([prop]),
                    props
                ]);
            }
            else {
                props.arguments.unshift((0, ast_1.createObjectExpression)([prop]));
            }
        }
        !propsWithInjection && (propsWithInjection = props);
    }
    else if (props.type === 15 /* NodeTypes.JS_OBJECT_EXPRESSION */) {
        if (!hasProp(prop, props)) {
            props.properties.unshift(prop);
        }
        propsWithInjection = props;
    }
    else {
        // single v-bind with expression, return a merged replacement
        propsWithInjection = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.MERGE_PROPS), [
            (0, ast_1.createObjectExpression)([prop]),
            props
        ]);
        // in the case of nested helper call, e.g. `normalizeProps(guardReactiveProps(props))`,
        // it will be rewritten as `normalizeProps(mergeProps({ key: 0 }, props))`,
        // the `guardReactiveProps` will no longer be needed
        if (parentCall && parentCall.callee === runtimeHelpers_1.GUARD_REACTIVE_PROPS) {
            parentCall = callPath[callPath.length - 2];
        }
    }
    if (node.type === 13 /* NodeTypes.VNODE_CALL */) {
        if (parentCall) {
            parentCall.arguments[0] = propsWithInjection;
        }
        else {
            node.props = propsWithInjection;
        }
    }
    else {
        if (parentCall) {
            parentCall.arguments[0] = propsWithInjection;
        }
        else {
            node.arguments[2] = propsWithInjection;
        }
    }
}
exports.injectProp = injectProp;
// check existing key to avoid overriding user provided keys
function hasProp(prop, props) {
    var result = false;
    if (prop.key.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
        var propKeyName_1 = prop.key.content;
        result = props.properties.some(function (p) {
            return p.key.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ &&
                p.key.content === propKeyName_1;
        });
    }
    return result;
}
function toValidAssetId(name, type) {
    // see issue#4422, we need adding identifier on validAssetId if variable `name` has specific character
    return "_".concat(type, "_").concat(name.replace(/[^\w]/g, function (searchValue, replaceValue) {
        return searchValue === '-' ? '_' : name.charCodeAt(replaceValue).toString();
    }));
}
exports.toValidAssetId = toValidAssetId;
// Check if a node contains expressions that reference current context scope ids
function hasScopeRef(node, ids) {
    if (!node || Object.keys(ids).length === 0) {
        return false;
    }
    switch (node.type) {
        case 1 /* NodeTypes.ELEMENT */:
            for (var i = 0; i < node.props.length; i++) {
                var p = node.props[i];
                if (p.type === 7 /* NodeTypes.DIRECTIVE */ &&
                    (hasScopeRef(p.arg, ids) || hasScopeRef(p.exp, ids))) {
                    return true;
                }
            }
            return node.children.some(function (c) { return hasScopeRef(c, ids); });
        case 11 /* NodeTypes.FOR */:
            if (hasScopeRef(node.source, ids)) {
                return true;
            }
            return node.children.some(function (c) { return hasScopeRef(c, ids); });
        case 9 /* NodeTypes.IF */:
            return node.branches.some(function (b) { return hasScopeRef(b, ids); });
        case 10 /* NodeTypes.IF_BRANCH */:
            if (hasScopeRef(node.condition, ids)) {
                return true;
            }
            return node.children.some(function (c) { return hasScopeRef(c, ids); });
        case 4 /* NodeTypes.SIMPLE_EXPRESSION */:
            return (!node.isStatic &&
                (0, exports.isSimpleIdentifier)(node.content) &&
                !!ids[node.content]);
        case 8 /* NodeTypes.COMPOUND_EXPRESSION */:
            return node.children.some(function (c) { return (0, shared_1.isObject)(c) && hasScopeRef(c, ids); });
        case 5 /* NodeTypes.INTERPOLATION */:
        case 12 /* NodeTypes.TEXT_CALL */:
            return hasScopeRef(node.content, ids);
        case 2 /* NodeTypes.TEXT */:
        case 3 /* NodeTypes.COMMENT */:
            return false;
        default:
            if (__DEV__) {
                var exhaustiveCheck = node;
                exhaustiveCheck;
            }
            return false;
    }
}
exports.hasScopeRef = hasScopeRef;
function getMemoedVNodeCall(node) {
    if (node.type === 14 /* NodeTypes.JS_CALL_EXPRESSION */ && node.callee === runtimeHelpers_1.WITH_MEMO) {
        return node.arguments[1].returns;
    }
    else {
        return node;
    }
}
exports.getMemoedVNodeCall = getMemoedVNodeCall;
function makeBlock(node, _a) {
    var helper = _a.helper, removeHelper = _a.removeHelper, inSSR = _a.inSSR;
    if (!node.isBlock) {
        node.isBlock = true;
        removeHelper(getVNodeHelper(inSSR, node.isComponent));
        helper(runtimeHelpers_1.OPEN_BLOCK);
        helper(getVNodeBlockHelper(inSSR, node.isComponent));
    }
}
exports.makeBlock = makeBlock;
