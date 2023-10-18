"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReturnStatement = exports.createSequenceExpression = exports.createAssignmentExpression = exports.createIfStatement = exports.createTemplateLiteral = exports.createBlockStatement = exports.createCacheExpression = exports.createConditionalExpression = exports.createFunctionExpression = exports.createCallExpression = exports.createCompoundExpression = exports.createInterpolation = exports.createSimpleExpression = exports.createObjectProperty = exports.createObjectExpression = exports.createArrayExpression = exports.createVNodeCall = exports.createRoot = exports.locStub = void 0;
var shared_1 = require("@vue/shared");
var runtimeHelpers_1 = require("./runtimeHelpers");
var utils_1 = require("./utils");
// AST Utilities ---------------------------------------------------------------
// Some expressions, e.g. sequence and conditional expressions, are never
// associated with template nodes, so their source locations are just a stub.
// Container types like CompoundExpression also don't need a real location.
exports.locStub = {
    source: '',
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
};
function createRoot(children, loc) {
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 0 /* NodeTypes.ROOT */,
        children: children,
        helpers: [],
        components: [],
        directives: [],
        hoists: [],
        imports: [],
        cached: 0,
        temps: 0,
        codegenNode: undefined,
        loc: loc
    };
}
exports.createRoot = createRoot;
function createVNodeCall(context, tag, props, children, patchFlag, dynamicProps, directives, isBlock, disableTracking, isComponent, loc) {
    if (isBlock === void 0) { isBlock = false; }
    if (disableTracking === void 0) { disableTracking = false; }
    if (isComponent === void 0) { isComponent = false; }
    if (loc === void 0) { loc = exports.locStub; }
    if (context) {
        if (isBlock) {
            context.helper(runtimeHelpers_1.OPEN_BLOCK);
            context.helper((0, utils_1.getVNodeBlockHelper)(context.inSSR, isComponent));
        }
        else {
            context.helper((0, utils_1.getVNodeHelper)(context.inSSR, isComponent));
        }
        if (directives) {
            context.helper(runtimeHelpers_1.WITH_DIRECTIVES);
        }
    }
    return {
        type: 13 /* NodeTypes.VNODE_CALL */,
        tag: tag,
        props: props,
        children: children,
        patchFlag: patchFlag,
        dynamicProps: dynamicProps,
        directives: directives,
        isBlock: isBlock,
        disableTracking: disableTracking,
        isComponent: isComponent,
        loc: loc
    };
}
exports.createVNodeCall = createVNodeCall;
function createArrayExpression(elements, loc) {
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 17 /* NodeTypes.JS_ARRAY_EXPRESSION */,
        loc: loc,
        elements: elements
    };
}
exports.createArrayExpression = createArrayExpression;
function createObjectExpression(properties, loc) {
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 15 /* NodeTypes.JS_OBJECT_EXPRESSION */,
        loc: loc,
        properties: properties
    };
}
exports.createObjectExpression = createObjectExpression;
function createObjectProperty(key, value) {
    return {
        type: 16 /* NodeTypes.JS_PROPERTY */,
        loc: exports.locStub,
        key: (0, shared_1.isString)(key) ? createSimpleExpression(key, true) : key,
        value: value
    };
}
exports.createObjectProperty = createObjectProperty;
function createSimpleExpression(content, isStatic, loc, constType) {
    if (isStatic === void 0) { isStatic = false; }
    if (loc === void 0) { loc = exports.locStub; }
    if (constType === void 0) { constType = 0 /* ConstantTypes.NOT_CONSTANT */; }
    return {
        type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
        loc: loc,
        content: content,
        isStatic: isStatic,
        constType: isStatic ? 3 /* ConstantTypes.CAN_STRINGIFY */ : constType
    };
}
exports.createSimpleExpression = createSimpleExpression;
function createInterpolation(content, loc) {
    return {
        type: 5 /* NodeTypes.INTERPOLATION */,
        loc: loc,
        content: (0, shared_1.isString)(content)
            ? createSimpleExpression(content, false, loc)
            : content
    };
}
exports.createInterpolation = createInterpolation;
function createCompoundExpression(children, loc) {
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 8 /* NodeTypes.COMPOUND_EXPRESSION */,
        loc: loc,
        children: children
    };
}
exports.createCompoundExpression = createCompoundExpression;
function createCallExpression(callee, args, loc) {
    if (args === void 0) { args = []; }
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 14 /* NodeTypes.JS_CALL_EXPRESSION */,
        loc: loc,
        callee: callee,
        arguments: args
    };
}
exports.createCallExpression = createCallExpression;
function createFunctionExpression(params, returns, newline, isSlot, loc) {
    if (returns === void 0) { returns = undefined; }
    if (newline === void 0) { newline = false; }
    if (isSlot === void 0) { isSlot = false; }
    if (loc === void 0) { loc = exports.locStub; }
    return {
        type: 18 /* NodeTypes.JS_FUNCTION_EXPRESSION */,
        params: params,
        returns: returns,
        newline: newline,
        isSlot: isSlot,
        loc: loc
    };
}
exports.createFunctionExpression = createFunctionExpression;
function createConditionalExpression(test, consequent, alternate, newline) {
    if (newline === void 0) { newline = true; }
    return {
        type: 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */,
        test: test,
        consequent: consequent,
        alternate: alternate,
        newline: newline,
        loc: exports.locStub
    };
}
exports.createConditionalExpression = createConditionalExpression;
function createCacheExpression(index, value, isVNode) {
    if (isVNode === void 0) { isVNode = false; }
    return {
        type: 20 /* NodeTypes.JS_CACHE_EXPRESSION */,
        index: index,
        value: value,
        isVNode: isVNode,
        loc: exports.locStub
    };
}
exports.createCacheExpression = createCacheExpression;
function createBlockStatement(body) {
    return {
        type: 21 /* NodeTypes.JS_BLOCK_STATEMENT */,
        body: body,
        loc: exports.locStub
    };
}
exports.createBlockStatement = createBlockStatement;
function createTemplateLiteral(elements) {
    return {
        type: 22 /* NodeTypes.JS_TEMPLATE_LITERAL */,
        elements: elements,
        loc: exports.locStub
    };
}
exports.createTemplateLiteral = createTemplateLiteral;
function createIfStatement(test, consequent, alternate) {
    return {
        type: 23 /* NodeTypes.JS_IF_STATEMENT */,
        test: test,
        consequent: consequent,
        alternate: alternate,
        loc: exports.locStub
    };
}
exports.createIfStatement = createIfStatement;
function createAssignmentExpression(left, right) {
    return {
        type: 24 /* NodeTypes.JS_ASSIGNMENT_EXPRESSION */,
        left: left,
        right: right,
        loc: exports.locStub
    };
}
exports.createAssignmentExpression = createAssignmentExpression;
function createSequenceExpression(expressions) {
    return {
        type: 25 /* NodeTypes.JS_SEQUENCE_EXPRESSION */,
        expressions: expressions,
        loc: exports.locStub
    };
}
exports.createSequenceExpression = createSequenceExpression;
function createReturnStatement(returns) {
    return {
        type: 26 /* NodeTypes.JS_RETURN_STATEMENT */,
        returns: returns,
        loc: exports.locStub
    };
}
exports.createReturnStatement = createReturnStatement;
