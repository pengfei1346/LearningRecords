"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformOnce = void 0;
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var seen = new WeakSet();
var transformOnce = function (node, context) {
    if (node.type === 1 /* NodeTypes.ELEMENT */ && (0, utils_1.findDir)(node, 'once', true)) {
        if (seen.has(node) || context.inVOnce) {
            return;
        }
        seen.add(node);
        context.inVOnce = true;
        context.helper(runtimeHelpers_1.SET_BLOCK_TRACKING);
        return function () {
            context.inVOnce = false;
            var cur = context.currentNode;
            if (cur.codegenNode) {
                cur.codegenNode = context.cache(cur.codegenNode, true /* isVNode */);
            }
        };
    }
};
exports.transformOnce = transformOnce;
