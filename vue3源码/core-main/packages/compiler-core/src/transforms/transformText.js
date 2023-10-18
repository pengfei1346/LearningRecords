"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformText = void 0;
var ast_1 = require("../ast");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var shared_1 = require("@vue/shared");
var hoistStatic_1 = require("./hoistStatic");
// Merge adjacent text nodes and expressions into a single expression
// e.g. <div>abc {{ d }} {{ e }}</div> should have a single expression node as child.
var transformText = function (node, context) {
    if (node.type === 0 /* NodeTypes.ROOT */ ||
        node.type === 1 /* NodeTypes.ELEMENT */ ||
        node.type === 11 /* NodeTypes.FOR */ ||
        node.type === 10 /* NodeTypes.IF_BRANCH */) {
        // perform the transform on node exit so that all expressions have already
        // been processed.
        return function () {
            var children = node.children;
            var currentContainer = undefined;
            var hasText = false;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if ((0, utils_1.isText)(child)) {
                    hasText = true;
                    for (var j = i + 1; j < children.length; j++) {
                        var next = children[j];
                        if ((0, utils_1.isText)(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = (0, ast_1.createCompoundExpression)([child], child.loc);
                            }
                            // merge adjacent text node into current
                            currentContainer.children.push(" + ", next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
            if (!hasText ||
                // if this is a plain element with a single text child, leave it
                // as-is since the runtime has dedicated fast path for this by directly
                // setting textContent of the element.
                // for component root it's always normalized anyway.
                (children.length === 1 &&
                    (node.type === 0 /* NodeTypes.ROOT */ ||
                        (node.type === 1 /* NodeTypes.ELEMENT */ &&
                            node.tagType === 0 /* ElementTypes.ELEMENT */ &&
                            // #3756
                            // custom directives can potentially add DOM elements arbitrarily,
                            // we need to avoid setting textContent of the element at runtime
                            // to avoid accidentally overwriting the DOM elements added
                            // by the user through custom directives.
                            !node.props.find(function (p) {
                                return p.type === 7 /* NodeTypes.DIRECTIVE */ &&
                                    !context.directiveTransforms[p.name];
                            }) &&
                            // in compat mode, <template> tags with no special directives
                            // will be rendered as a fragment so its children must be
                            // converted into vnodes.
                            !(__COMPAT__ && node.tag === 'template'))))) {
                return;
            }
            // pre-convert text nodes into createTextVNode(text) calls to avoid
            // runtime normalization.
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if ((0, utils_1.isText)(child) || child.type === 8 /* NodeTypes.COMPOUND_EXPRESSION */) {
                    var callArgs = [];
                    // createTextVNode defaults to single whitespace, so if it is a
                    // single space the code could be an empty call to save bytes.
                    if (child.type !== 2 /* NodeTypes.TEXT */ || child.content !== ' ') {
                        callArgs.push(child);
                    }
                    // mark dynamic text with flag so it gets patched inside a block
                    if (!context.ssr &&
                        (0, hoistStatic_1.getConstantType)(child, context) === 0 /* ConstantTypes.NOT_CONSTANT */) {
                        callArgs.push(shared_1.PatchFlags.TEXT +
                            (__DEV__ ? " /* ".concat(shared_1.PatchFlagNames[shared_1.PatchFlags.TEXT], " */") : ""));
                    }
                    children[i] = {
                        type: 12 /* NodeTypes.TEXT_CALL */,
                        content: child,
                        loc: child.loc,
                        codegenNode: (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.CREATE_TEXT), callArgs)
                    };
                }
            }
        };
    }
};
exports.transformText = transformText;
