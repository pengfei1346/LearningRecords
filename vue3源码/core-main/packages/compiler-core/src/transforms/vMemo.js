"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMemo = void 0;
var utils_1 = require("../utils");
var ast_1 = require("../ast");
var runtimeHelpers_1 = require("../runtimeHelpers");
var seen = new WeakSet();
var transformMemo = function (node, context) {
    if (node.type === 1 /* NodeTypes.ELEMENT */) {
        var dir_1 = (0, utils_1.findDir)(node, 'memo');
        if (!dir_1 || seen.has(node)) {
            return;
        }
        seen.add(node);
        return function () {
            var codegenNode = node.codegenNode ||
                context.currentNode.codegenNode;
            if (codegenNode && codegenNode.type === 13 /* NodeTypes.VNODE_CALL */) {
                // non-component sub tree should be turned into a block
                if (node.tagType !== 1 /* ElementTypes.COMPONENT */) {
                    (0, utils_1.makeBlock)(codegenNode, context);
                }
                node.codegenNode = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.WITH_MEMO), [
                    dir_1.exp,
                    (0, ast_1.createFunctionExpression)(undefined, codegenNode),
                    "_cache",
                    String(context.cached++)
                ]);
            }
        };
    }
};
exports.transformMemo = transformMemo;
