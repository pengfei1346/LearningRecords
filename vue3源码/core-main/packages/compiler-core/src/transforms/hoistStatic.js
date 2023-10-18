"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConstantType = exports.isSingleElementRoot = exports.hoistStatic = void 0;
var ast_1 = require("../ast");
var shared_1 = require("@vue/shared");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
function hoistStatic(root, context) {
    walk(root, context, 
    // Root node is unfortunately non-hoistable due to potential parent
    // fallthrough attributes.
    isSingleElementRoot(root, root.children[0]));
}
exports.hoistStatic = hoistStatic;
function isSingleElementRoot(root, child) {
    var children = root.children;
    return (children.length === 1 &&
        child.type === 1 /* NodeTypes.ELEMENT */ &&
        !(0, utils_1.isSlotOutlet)(child));
}
exports.isSingleElementRoot = isSingleElementRoot;
function walk(node, context, doNotHoistNode) {
    if (doNotHoistNode === void 0) { doNotHoistNode = false; }
    var children = node.children;
    var originalCount = children.length;
    var hoistedCount = 0;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        // only plain elements & text calls are eligible for hoisting.
        if (child.type === 1 /* NodeTypes.ELEMENT */ &&
            child.tagType === 0 /* ElementTypes.ELEMENT */) {
            var constantType = doNotHoistNode
                ? 0 /* ConstantTypes.NOT_CONSTANT */
                : getConstantType(child, context);
            if (constantType > 0 /* ConstantTypes.NOT_CONSTANT */) {
                if (constantType >= 2 /* ConstantTypes.CAN_HOIST */) {
                    ;
                    child.codegenNode.patchFlag =
                        shared_1.PatchFlags.HOISTED + (__DEV__ ? " /* HOISTED */" : "");
                    child.codegenNode = context.hoist(child.codegenNode);
                    hoistedCount++;
                    continue;
                }
            }
            else {
                // node may contain dynamic children, but its props may be eligible for
                // hoisting.
                var codegenNode = child.codegenNode;
                if (codegenNode.type === 13 /* NodeTypes.VNODE_CALL */) {
                    var flag = getPatchFlag(codegenNode);
                    if ((!flag ||
                        flag === shared_1.PatchFlags.NEED_PATCH ||
                        flag === shared_1.PatchFlags.TEXT) &&
                        getGeneratedPropsConstantType(child, context) >=
                            2 /* ConstantTypes.CAN_HOIST */) {
                        var props = getNodeProps(child);
                        if (props) {
                            codegenNode.props = context.hoist(props);
                        }
                    }
                    if (codegenNode.dynamicProps) {
                        codegenNode.dynamicProps = context.hoist(codegenNode.dynamicProps);
                    }
                }
            }
        }
        // walk further
        if (child.type === 1 /* NodeTypes.ELEMENT */) {
            var isComponent = child.tagType === 1 /* ElementTypes.COMPONENT */;
            if (isComponent) {
                context.scopes.vSlot++;
            }
            walk(child, context);
            if (isComponent) {
                context.scopes.vSlot--;
            }
        }
        else if (child.type === 11 /* NodeTypes.FOR */) {
            // Do not hoist v-for single child because it has to be a block
            walk(child, context, child.children.length === 1);
        }
        else if (child.type === 9 /* NodeTypes.IF */) {
            for (var i_1 = 0; i_1 < child.branches.length; i_1++) {
                // Do not hoist v-if single child because it has to be a block
                walk(child.branches[i_1], context, child.branches[i_1].children.length === 1);
            }
        }
    }
    if (hoistedCount && context.transformHoist) {
        context.transformHoist(children, context, node);
    }
    // all children were hoisted - the entire children array is hoistable.
    if (hoistedCount &&
        hoistedCount === originalCount &&
        node.type === 1 /* NodeTypes.ELEMENT */ &&
        node.tagType === 0 /* ElementTypes.ELEMENT */ &&
        node.codegenNode &&
        node.codegenNode.type === 13 /* NodeTypes.VNODE_CALL */ &&
        (0, shared_1.isArray)(node.codegenNode.children)) {
        node.codegenNode.children = context.hoist((0, ast_1.createArrayExpression)(node.codegenNode.children));
    }
}
function getConstantType(node, context) {
    var constantCache = context.constantCache;
    switch (node.type) {
        case 1 /* NodeTypes.ELEMENT */:
            if (node.tagType !== 0 /* ElementTypes.ELEMENT */) {
                return 0 /* ConstantTypes.NOT_CONSTANT */;
            }
            var cached = constantCache.get(node);
            if (cached !== undefined) {
                return cached;
            }
            var codegenNode = node.codegenNode;
            if (codegenNode.type !== 13 /* NodeTypes.VNODE_CALL */) {
                return 0 /* ConstantTypes.NOT_CONSTANT */;
            }
            if (codegenNode.isBlock &&
                node.tag !== 'svg' &&
                node.tag !== 'foreignObject') {
                return 0 /* ConstantTypes.NOT_CONSTANT */;
            }
            var flag = getPatchFlag(codegenNode);
            if (!flag) {
                var returnType_1 = 3 /* ConstantTypes.CAN_STRINGIFY */;
                // Element itself has no patch flag. However we still need to check:
                // 1. Even for a node with no patch flag, it is possible for it to contain
                // non-hoistable expressions that refers to scope variables, e.g. compiler
                // injected keys or cached event handlers. Therefore we need to always
                // check the codegenNode's props to be sure.
                var generatedPropsType = getGeneratedPropsConstantType(node, context);
                if (generatedPropsType === 0 /* ConstantTypes.NOT_CONSTANT */) {
                    constantCache.set(node, 0 /* ConstantTypes.NOT_CONSTANT */);
                    return 0 /* ConstantTypes.NOT_CONSTANT */;
                }
                if (generatedPropsType < returnType_1) {
                    returnType_1 = generatedPropsType;
                }
                // 2. its children.
                for (var i = 0; i < node.children.length; i++) {
                    var childType = getConstantType(node.children[i], context);
                    if (childType === 0 /* ConstantTypes.NOT_CONSTANT */) {
                        constantCache.set(node, 0 /* ConstantTypes.NOT_CONSTANT */);
                        return 0 /* ConstantTypes.NOT_CONSTANT */;
                    }
                    if (childType < returnType_1) {
                        returnType_1 = childType;
                    }
                }
                // 3. if the type is not already CAN_SKIP_PATCH which is the lowest non-0
                // type, check if any of the props can cause the type to be lowered
                // we can skip can_patch because it's guaranteed by the absence of a
                // patchFlag.
                if (returnType_1 > 1 /* ConstantTypes.CAN_SKIP_PATCH */) {
                    for (var i = 0; i < node.props.length; i++) {
                        var p = node.props[i];
                        if (p.type === 7 /* NodeTypes.DIRECTIVE */ && p.name === 'bind' && p.exp) {
                            var expType = getConstantType(p.exp, context);
                            if (expType === 0 /* ConstantTypes.NOT_CONSTANT */) {
                                constantCache.set(node, 0 /* ConstantTypes.NOT_CONSTANT */);
                                return 0 /* ConstantTypes.NOT_CONSTANT */;
                            }
                            if (expType < returnType_1) {
                                returnType_1 = expType;
                            }
                        }
                    }
                }
                // only svg/foreignObject could be block here, however if they are
                // static then they don't need to be blocks since there will be no
                // nested updates.
                if (codegenNode.isBlock) {
                    // except set custom directives.
                    for (var i = 0; i < node.props.length; i++) {
                        var p = node.props[i];
                        if (p.type === 7 /* NodeTypes.DIRECTIVE */) {
                            constantCache.set(node, 0 /* ConstantTypes.NOT_CONSTANT */);
                            return 0 /* ConstantTypes.NOT_CONSTANT */;
                        }
                    }
                    context.removeHelper(runtimeHelpers_1.OPEN_BLOCK);
                    context.removeHelper((0, utils_1.getVNodeBlockHelper)(context.inSSR, codegenNode.isComponent));
                    codegenNode.isBlock = false;
                    context.helper((0, utils_1.getVNodeHelper)(context.inSSR, codegenNode.isComponent));
                }
                constantCache.set(node, returnType_1);
                return returnType_1;
            }
            else {
                constantCache.set(node, 0 /* ConstantTypes.NOT_CONSTANT */);
                return 0 /* ConstantTypes.NOT_CONSTANT */;
            }
        case 2 /* NodeTypes.TEXT */:
        case 3 /* NodeTypes.COMMENT */:
            return 3 /* ConstantTypes.CAN_STRINGIFY */;
        case 9 /* NodeTypes.IF */:
        case 11 /* NodeTypes.FOR */:
        case 10 /* NodeTypes.IF_BRANCH */:
            return 0 /* ConstantTypes.NOT_CONSTANT */;
        case 5 /* NodeTypes.INTERPOLATION */:
        case 12 /* NodeTypes.TEXT_CALL */:
            return getConstantType(node.content, context);
        case 4 /* NodeTypes.SIMPLE_EXPRESSION */:
            return node.constType;
        case 8 /* NodeTypes.COMPOUND_EXPRESSION */:
            var returnType = 3 /* ConstantTypes.CAN_STRINGIFY */;
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                if ((0, shared_1.isString)(child) || (0, shared_1.isSymbol)(child)) {
                    continue;
                }
                var childType = getConstantType(child, context);
                if (childType === 0 /* ConstantTypes.NOT_CONSTANT */) {
                    return 0 /* ConstantTypes.NOT_CONSTANT */;
                }
                else if (childType < returnType) {
                    returnType = childType;
                }
            }
            return returnType;
        default:
            if (__DEV__) {
                var exhaustiveCheck = node;
                exhaustiveCheck;
            }
            return 0 /* ConstantTypes.NOT_CONSTANT */;
    }
}
exports.getConstantType = getConstantType;
var allowHoistedHelperSet = new Set([
    runtimeHelpers_1.NORMALIZE_CLASS,
    runtimeHelpers_1.NORMALIZE_STYLE,
    runtimeHelpers_1.NORMALIZE_PROPS,
    runtimeHelpers_1.GUARD_REACTIVE_PROPS
]);
function getConstantTypeOfHelperCall(value, context) {
    if (value.type === 14 /* NodeTypes.JS_CALL_EXPRESSION */ &&
        !(0, shared_1.isString)(value.callee) &&
        allowHoistedHelperSet.has(value.callee)) {
        var arg = value.arguments[0];
        if (arg.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
            return getConstantType(arg, context);
        }
        else if (arg.type === 14 /* NodeTypes.JS_CALL_EXPRESSION */) {
            // in the case of nested helper call, e.g. `normalizeProps(guardReactiveProps(exp))`
            return getConstantTypeOfHelperCall(arg, context);
        }
    }
    return 0 /* ConstantTypes.NOT_CONSTANT */;
}
function getGeneratedPropsConstantType(node, context) {
    var returnType = 3 /* ConstantTypes.CAN_STRINGIFY */;
    var props = getNodeProps(node);
    if (props && props.type === 15 /* NodeTypes.JS_OBJECT_EXPRESSION */) {
        var properties = props.properties;
        for (var i = 0; i < properties.length; i++) {
            var _a = properties[i], key = _a.key, value = _a.value;
            var keyType = getConstantType(key, context);
            if (keyType === 0 /* ConstantTypes.NOT_CONSTANT */) {
                return keyType;
            }
            if (keyType < returnType) {
                returnType = keyType;
            }
            var valueType = void 0;
            if (value.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
                valueType = getConstantType(value, context);
            }
            else if (value.type === 14 /* NodeTypes.JS_CALL_EXPRESSION */) {
                // some helper calls can be hoisted,
                // such as the `normalizeProps` generated by the compiler for pre-normalize class,
                // in this case we need to respect the ConstantType of the helper's arguments
                valueType = getConstantTypeOfHelperCall(value, context);
            }
            else {
                valueType = 0 /* ConstantTypes.NOT_CONSTANT */;
            }
            if (valueType === 0 /* ConstantTypes.NOT_CONSTANT */) {
                return valueType;
            }
            if (valueType < returnType) {
                returnType = valueType;
            }
        }
    }
    return returnType;
}
function getNodeProps(node) {
    var codegenNode = node.codegenNode;
    if (codegenNode.type === 13 /* NodeTypes.VNODE_CALL */) {
        return codegenNode.props;
    }
}
function getPatchFlag(node) {
    var flag = node.patchFlag;
    return flag ? parseInt(flag, 10) : undefined;
}
