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
exports.processIf = exports.transformIf = void 0;
var transform_1 = require("../transform");
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var transformExpression_1 = require("./transformExpression");
var validateExpression_1 = require("../validateExpression");
var runtimeHelpers_1 = require("../runtimeHelpers");
var utils_1 = require("../utils");
var shared_1 = require("@vue/shared");
var __1 = require("..");
exports.transformIf = (0, transform_1.createStructuralDirectiveTransform)(/^(if|else|else-if)$/, function (node, dir, context) {
    return processIf(node, dir, context, function (ifNode, branch, isRoot) {
        // #1587: We need to dynamically increment the key based on the current
        // node's sibling nodes, since chained v-if/else branches are
        // rendered at the same depth
        var siblings = context.parent.children;
        var i = siblings.indexOf(ifNode);
        var key = 0;
        while (i-- >= 0) {
            var sibling = siblings[i];
            if (sibling && sibling.type === 9 /* NodeTypes.IF */) {
                key += sibling.branches.length;
            }
        }
        // Exit callback. Complete the codegenNode when all children have been
        // transformed.
        return function () {
            if (isRoot) {
                ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
            }
            else {
                // attach this branch's codegen node to the v-if root.
                var parentCondition = getParentCondition(ifNode.codegenNode);
                parentCondition.alternate = createCodegenNodeForBranch(branch, key + ifNode.branches.length - 1, context);
            }
        };
    });
});
// target-agnostic transform used for both Client and SSR
function processIf(node, dir, context, processCodegen) {
    if (dir.name !== 'else' &&
        (!dir.exp || !dir.exp.content.trim())) {
        var loc = dir.exp ? dir.exp.loc : node.loc;
        context.onError((0, errors_1.createCompilerError)(28 /* ErrorCodes.X_V_IF_NO_EXPRESSION */, dir.loc));
        dir.exp = (0, ast_1.createSimpleExpression)("true", false, loc);
    }
    if (!__BROWSER__ && context.prefixIdentifiers && dir.exp) {
        // dir.exp can only be simple expression because vIf transform is applied
        // before expression transform.
        dir.exp = (0, transformExpression_1.processExpression)(dir.exp, context);
    }
    if (__DEV__ && __BROWSER__ && dir.exp) {
        (0, validateExpression_1.validateBrowserExpression)(dir.exp, context);
    }
    if (dir.name === 'if') {
        var branch = createIfBranch(node, dir);
        var ifNode = {
            type: 9 /* NodeTypes.IF */,
            loc: node.loc,
            branches: [branch]
        };
        context.replaceNode(ifNode);
        if (processCodegen) {
            return processCodegen(ifNode, branch, true);
        }
    }
    else {
        // locate the adjacent v-if
        var siblings = context.parent.children;
        var comments = [];
        var i = siblings.indexOf(node);
        var _loop_1 = function () {
            var sibling = siblings[i];
            if (sibling && sibling.type === 3 /* NodeTypes.COMMENT */) {
                context.removeNode(sibling);
                __DEV__ && comments.unshift(sibling);
                return "continue";
            }
            if (sibling &&
                sibling.type === 2 /* NodeTypes.TEXT */ &&
                !sibling.content.trim().length) {
                context.removeNode(sibling);
                return "continue";
            }
            if (sibling && sibling.type === 9 /* NodeTypes.IF */) {
                // Check if v-else was followed by v-else-if
                if (dir.name === 'else-if' &&
                    sibling.branches[sibling.branches.length - 1].condition === undefined) {
                    context.onError((0, errors_1.createCompilerError)(30 /* ErrorCodes.X_V_ELSE_NO_ADJACENT_IF */, node.loc));
                }
                // move the node to the if node's branches
                context.removeNode();
                var branch_1 = createIfBranch(node, dir);
                if (__DEV__ &&
                    comments.length &&
                    // #3619 ignore comments if the v-if is direct child of <transition>
                    !(context.parent &&
                        context.parent.type === 1 /* NodeTypes.ELEMENT */ &&
                        (0, utils_1.isBuiltInType)(context.parent.tag, 'transition'))) {
                    branch_1.children = __spreadArray(__spreadArray([], comments, true), branch_1.children, true);
                }
                // check if user is forcing same key on different branches
                if (__DEV__ || !__BROWSER__) {
                    var key_1 = branch_1.userKey;
                    if (key_1) {
                        sibling.branches.forEach(function (_a) {
                            var userKey = _a.userKey;
                            if (isSameKey(userKey, key_1)) {
                                context.onError((0, errors_1.createCompilerError)(29 /* ErrorCodes.X_V_IF_SAME_KEY */, branch_1.userKey.loc));
                            }
                        });
                    }
                }
                sibling.branches.push(branch_1);
                var onExit = processCodegen && processCodegen(sibling, branch_1, false);
                // since the branch was removed, it will not be traversed.
                // make sure to traverse here.
                (0, transform_1.traverseNode)(branch_1, context);
                // call on exit
                if (onExit)
                    onExit();
                // make sure to reset currentNode after traversal to indicate this
                // node has been removed.
                context.currentNode = null;
            }
            else {
                context.onError((0, errors_1.createCompilerError)(30 /* ErrorCodes.X_V_ELSE_NO_ADJACENT_IF */, node.loc));
            }
            return "break";
        };
        while (i-- >= -1) {
            var state_1 = _loop_1();
            if (state_1 === "break")
                break;
        }
    }
}
exports.processIf = processIf;
function createIfBranch(node, dir) {
    var isTemplateIf = node.tagType === 3 /* ElementTypes.TEMPLATE */;
    return {
        type: 10 /* NodeTypes.IF_BRANCH */,
        loc: node.loc,
        condition: dir.name === 'else' ? undefined : dir.exp,
        children: isTemplateIf && !(0, utils_1.findDir)(node, 'for') ? node.children : [node],
        userKey: (0, utils_1.findProp)(node, "key"),
        isTemplateIf: isTemplateIf
    };
}
function createCodegenNodeForBranch(branch, keyIndex, context) {
    if (branch.condition) {
        return (0, ast_1.createConditionalExpression)(branch.condition, createChildrenCodegenNode(branch, keyIndex, context), 
        // make sure to pass in asBlock: true so that the comment node call
        // closes the current block.
        (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.CREATE_COMMENT), [
            __DEV__ ? '"v-if"' : '""',
            'true'
        ]));
    }
    else {
        return createChildrenCodegenNode(branch, keyIndex, context);
    }
}
function createChildrenCodegenNode(branch, keyIndex, context) {
    var helper = context.helper;
    var keyProperty = (0, ast_1.createObjectProperty)("key", (0, ast_1.createSimpleExpression)("".concat(keyIndex), false, ast_1.locStub, 2 /* ConstantTypes.CAN_HOIST */));
    var children = branch.children;
    var firstChild = children[0];
    var needFragmentWrapper = children.length !== 1 || firstChild.type !== 1 /* NodeTypes.ELEMENT */;
    if (needFragmentWrapper) {
        if (children.length === 1 && firstChild.type === 11 /* NodeTypes.FOR */) {
            // optimize away nested fragments when child is a ForNode
            var vnodeCall = firstChild.codegenNode;
            (0, utils_1.injectProp)(vnodeCall, keyProperty, context);
            return vnodeCall;
        }
        else {
            var patchFlag = shared_1.PatchFlags.STABLE_FRAGMENT;
            var patchFlagText = shared_1.PatchFlagNames[shared_1.PatchFlags.STABLE_FRAGMENT];
            // check if the fragment actually contains a single valid child with
            // the rest being comments
            if (__DEV__ &&
                !branch.isTemplateIf &&
                children.filter(function (c) { return c.type !== 3 /* NodeTypes.COMMENT */; }).length === 1) {
                patchFlag |= shared_1.PatchFlags.DEV_ROOT_FRAGMENT;
                patchFlagText += ", ".concat(shared_1.PatchFlagNames[shared_1.PatchFlags.DEV_ROOT_FRAGMENT]);
            }
            return (0, ast_1.createVNodeCall)(context, helper(runtimeHelpers_1.FRAGMENT), (0, ast_1.createObjectExpression)([keyProperty]), children, patchFlag + (__DEV__ ? " /* ".concat(patchFlagText, " */") : ""), undefined, undefined, true, false, false /* isComponent */, branch.loc);
        }
    }
    else {
        var ret = firstChild.codegenNode;
        var vnodeCall = (0, __1.getMemoedVNodeCall)(ret);
        // Change createVNode to createBlock.
        if (vnodeCall.type === 13 /* NodeTypes.VNODE_CALL */) {
            (0, utils_1.makeBlock)(vnodeCall, context);
        }
        // inject branch key
        (0, utils_1.injectProp)(vnodeCall, keyProperty, context);
        return ret;
    }
}
function isSameKey(a, b) {
    if (!a || a.type !== b.type) {
        return false;
    }
    if (a.type === 6 /* NodeTypes.ATTRIBUTE */) {
        if (a.value.content !== b.value.content) {
            return false;
        }
    }
    else {
        // directive
        var exp = a.exp;
        var branchExp = b.exp;
        if (exp.type !== branchExp.type) {
            return false;
        }
        if (exp.type !== 4 /* NodeTypes.SIMPLE_EXPRESSION */ ||
            exp.isStatic !== branchExp.isStatic ||
            exp.content !== branchExp.content) {
            return false;
        }
    }
    return true;
}
function getParentCondition(node) {
    while (true) {
        if (node.type === 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */) {
            if (node.alternate.type === 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */) {
                node = node.alternate;
            }
            else {
                return node;
            }
        }
        else if (node.type === 20 /* NodeTypes.JS_CACHE_EXPRESSION */) {
            node = node.value;
        }
    }
}
