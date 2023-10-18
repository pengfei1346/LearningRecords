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
exports.createForLoopParams = exports.parseForExpression = exports.processFor = exports.transformFor = void 0;
var transform_1 = require("../transform");
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var transformExpression_1 = require("./transformExpression");
var validateExpression_1 = require("../validateExpression");
var shared_1 = require("@vue/shared");
exports.transformFor = (0, transform_1.createStructuralDirectiveTransform)('for', function (node, dir, context) {
    var helper = context.helper, removeHelper = context.removeHelper;
    return processFor(node, dir, context, function (forNode) {
        // create the loop render function expression now, and add the
        // iterator on exit after all children have been traversed
        var renderExp = (0, ast_1.createCallExpression)(helper(runtimeHelpers_1.RENDER_LIST), [
            forNode.source
        ]);
        var isTemplate = (0, utils_1.isTemplateNode)(node);
        var memo = (0, utils_1.findDir)(node, 'memo');
        var keyProp = (0, utils_1.findProp)(node, "key");
        var keyExp = keyProp &&
            (keyProp.type === 6 /* NodeTypes.ATTRIBUTE */
                ? (0, ast_1.createSimpleExpression)(keyProp.value.content, true)
                : keyProp.exp);
        var keyProperty = keyProp ? (0, ast_1.createObjectProperty)("key", keyExp) : null;
        if (!__BROWSER__ && isTemplate) {
            // #2085 / #5288 process :key and v-memo expressions need to be
            // processed on `<template v-for>`. In this case the node is discarded
            // and never traversed so its binding expressions won't be processed
            // by the normal transforms.
            if (memo) {
                memo.exp = (0, transformExpression_1.processExpression)(memo.exp, context);
            }
            if (keyProperty && keyProp.type !== 6 /* NodeTypes.ATTRIBUTE */) {
                keyProperty.value = (0, transformExpression_1.processExpression)(keyProperty.value, context);
            }
        }
        var isStableFragment = forNode.source.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ &&
            forNode.source.constType > 0 /* ConstantTypes.NOT_CONSTANT */;
        var fragmentFlag = isStableFragment
            ? shared_1.PatchFlags.STABLE_FRAGMENT
            : keyProp
                ? shared_1.PatchFlags.KEYED_FRAGMENT
                : shared_1.PatchFlags.UNKEYED_FRAGMENT;
        forNode.codegenNode = (0, ast_1.createVNodeCall)(context, helper(runtimeHelpers_1.FRAGMENT), undefined, renderExp, fragmentFlag +
            (__DEV__ ? " /* ".concat(shared_1.PatchFlagNames[fragmentFlag], " */") : ""), undefined, undefined, true /* isBlock */, !isStableFragment /* disableTracking */, false /* isComponent */, node.loc);
        return function () {
            // finish the codegen now that all children have been traversed
            var childBlock;
            var children = forNode.children;
            // check <template v-for> key placement
            if ((__DEV__ || !__BROWSER__) && isTemplate) {
                node.children.some(function (c) {
                    if (c.type === 1 /* NodeTypes.ELEMENT */) {
                        var key = (0, utils_1.findProp)(c, 'key');
                        if (key) {
                            context.onError((0, errors_1.createCompilerError)(33 /* ErrorCodes.X_V_FOR_TEMPLATE_KEY_PLACEMENT */, key.loc));
                            return true;
                        }
                    }
                });
            }
            var needFragmentWrapper = children.length !== 1 || children[0].type !== 1 /* NodeTypes.ELEMENT */;
            var slotOutlet = (0, utils_1.isSlotOutlet)(node)
                ? node
                : isTemplate &&
                    node.children.length === 1 &&
                    (0, utils_1.isSlotOutlet)(node.children[0])
                    ? node.children[0] // api-extractor somehow fails to infer this
                    : null;
            if (slotOutlet) {
                // <slot v-for="..."> or <template v-for="..."><slot/></template>
                childBlock = slotOutlet.codegenNode;
                if (isTemplate && keyProperty) {
                    // <template v-for="..." :key="..."><slot/></template>
                    // we need to inject the key to the renderSlot() call.
                    // the props for renderSlot is passed as the 3rd argument.
                    (0, utils_1.injectProp)(childBlock, keyProperty, context);
                }
            }
            else if (needFragmentWrapper) {
                // <template v-for="..."> with text or multi-elements
                // should generate a fragment block for each loop
                childBlock = (0, ast_1.createVNodeCall)(context, helper(runtimeHelpers_1.FRAGMENT), keyProperty ? (0, ast_1.createObjectExpression)([keyProperty]) : undefined, node.children, shared_1.PatchFlags.STABLE_FRAGMENT +
                    (__DEV__
                        ? " /* ".concat(shared_1.PatchFlagNames[shared_1.PatchFlags.STABLE_FRAGMENT], " */")
                        : ""), undefined, undefined, true, undefined, false /* isComponent */);
            }
            else {
                // Normal element v-for. Directly use the child's codegenNode
                // but mark it as a block.
                childBlock = children[0]
                    .codegenNode;
                if (isTemplate && keyProperty) {
                    (0, utils_1.injectProp)(childBlock, keyProperty, context);
                }
                if (childBlock.isBlock !== !isStableFragment) {
                    if (childBlock.isBlock) {
                        // switch from block to vnode
                        removeHelper(runtimeHelpers_1.OPEN_BLOCK);
                        removeHelper((0, utils_1.getVNodeBlockHelper)(context.inSSR, childBlock.isComponent));
                    }
                    else {
                        // switch from vnode to block
                        removeHelper((0, utils_1.getVNodeHelper)(context.inSSR, childBlock.isComponent));
                    }
                }
                childBlock.isBlock = !isStableFragment;
                if (childBlock.isBlock) {
                    helper(runtimeHelpers_1.OPEN_BLOCK);
                    helper((0, utils_1.getVNodeBlockHelper)(context.inSSR, childBlock.isComponent));
                }
                else {
                    helper((0, utils_1.getVNodeHelper)(context.inSSR, childBlock.isComponent));
                }
            }
            if (memo) {
                var loop = (0, ast_1.createFunctionExpression)(createForLoopParams(forNode.parseResult, [
                    (0, ast_1.createSimpleExpression)("_cached")
                ]));
                loop.body = (0, ast_1.createBlockStatement)([
                    (0, ast_1.createCompoundExpression)(["const _memo = (", memo.exp, ")"]),
                    (0, ast_1.createCompoundExpression)(__spreadArray(__spreadArray([
                        "if (_cached"
                    ], (keyExp ? [" && _cached.key === ", keyExp] : []), true), [
                        " && ".concat(context.helperString(runtimeHelpers_1.IS_MEMO_SAME), "(_cached, _memo)) return _cached")
                    ], false)),
                    (0, ast_1.createCompoundExpression)(["const _item = ", childBlock]),
                    (0, ast_1.createSimpleExpression)("_item.memo = _memo"),
                    (0, ast_1.createSimpleExpression)("return _item")
                ]);
                renderExp.arguments.push(loop, (0, ast_1.createSimpleExpression)("_cache"), (0, ast_1.createSimpleExpression)(String(context.cached++)));
            }
            else {
                renderExp.arguments.push((0, ast_1.createFunctionExpression)(createForLoopParams(forNode.parseResult), childBlock, true /* force newline */));
            }
        };
    });
});
// target-agnostic transform used for both Client and SSR
function processFor(node, dir, context, processCodegen) {
    if (!dir.exp) {
        context.onError((0, errors_1.createCompilerError)(31 /* ErrorCodes.X_V_FOR_NO_EXPRESSION */, dir.loc));
        return;
    }
    var parseResult = parseForExpression(
    // can only be simple expression because vFor transform is applied
    // before expression transform.
    dir.exp, context);
    if (!parseResult) {
        context.onError((0, errors_1.createCompilerError)(32 /* ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION */, dir.loc));
        return;
    }
    var addIdentifiers = context.addIdentifiers, removeIdentifiers = context.removeIdentifiers, scopes = context.scopes;
    var source = parseResult.source, value = parseResult.value, key = parseResult.key, index = parseResult.index;
    var forNode = {
        type: 11 /* NodeTypes.FOR */,
        loc: dir.loc,
        source: source,
        valueAlias: value,
        keyAlias: key,
        objectIndexAlias: index,
        parseResult: parseResult,
        children: (0, utils_1.isTemplateNode)(node) ? node.children : [node]
    };
    context.replaceNode(forNode);
    // bookkeeping
    scopes.vFor++;
    if (!__BROWSER__ && context.prefixIdentifiers) {
        // scope management
        // inject identifiers to context
        value && addIdentifiers(value);
        key && addIdentifiers(key);
        index && addIdentifiers(index);
    }
    var onExit = processCodegen && processCodegen(forNode);
    return function () {
        scopes.vFor--;
        if (!__BROWSER__ && context.prefixIdentifiers) {
            value && removeIdentifiers(value);
            key && removeIdentifiers(key);
            index && removeIdentifiers(index);
        }
        if (onExit)
            onExit();
    };
}
exports.processFor = processFor;
var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
// This regex doesn't cover the case if key or index aliases have destructuring,
// but those do not make sense in the first place, so this works in practice.
var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
var stripParensRE = /^\(|\)$/g;
function parseForExpression(input, context) {
    var loc = input.loc;
    var exp = input.content;
    var inMatch = exp.match(forAliasRE);
    if (!inMatch)
        return;
    var LHS = inMatch[1], RHS = inMatch[2];
    var result = {
        source: createAliasExpression(loc, RHS.trim(), exp.indexOf(RHS, LHS.length)),
        value: undefined,
        key: undefined,
        index: undefined
    };
    if (!__BROWSER__ && context.prefixIdentifiers) {
        result.source = (0, transformExpression_1.processExpression)(result.source, context);
    }
    if (__DEV__ && __BROWSER__) {
        (0, validateExpression_1.validateBrowserExpression)(result.source, context);
    }
    var valueContent = LHS.trim().replace(stripParensRE, '').trim();
    var trimmedOffset = LHS.indexOf(valueContent);
    var iteratorMatch = valueContent.match(forIteratorRE);
    if (iteratorMatch) {
        valueContent = valueContent.replace(forIteratorRE, '').trim();
        var keyContent = iteratorMatch[1].trim();
        var keyOffset = void 0;
        if (keyContent) {
            keyOffset = exp.indexOf(keyContent, trimmedOffset + valueContent.length);
            result.key = createAliasExpression(loc, keyContent, keyOffset);
            if (!__BROWSER__ && context.prefixIdentifiers) {
                result.key = (0, transformExpression_1.processExpression)(result.key, context, true);
            }
            if (__DEV__ && __BROWSER__) {
                (0, validateExpression_1.validateBrowserExpression)(result.key, context, true);
            }
        }
        if (iteratorMatch[2]) {
            var indexContent = iteratorMatch[2].trim();
            if (indexContent) {
                result.index = createAliasExpression(loc, indexContent, exp.indexOf(indexContent, result.key
                    ? keyOffset + keyContent.length
                    : trimmedOffset + valueContent.length));
                if (!__BROWSER__ && context.prefixIdentifiers) {
                    result.index = (0, transformExpression_1.processExpression)(result.index, context, true);
                }
                if (__DEV__ && __BROWSER__) {
                    (0, validateExpression_1.validateBrowserExpression)(result.index, context, true);
                }
            }
        }
    }
    if (valueContent) {
        result.value = createAliasExpression(loc, valueContent, trimmedOffset);
        if (!__BROWSER__ && context.prefixIdentifiers) {
            result.value = (0, transformExpression_1.processExpression)(result.value, context, true);
        }
        if (__DEV__ && __BROWSER__) {
            (0, validateExpression_1.validateBrowserExpression)(result.value, context, true);
        }
    }
    return result;
}
exports.parseForExpression = parseForExpression;
function createAliasExpression(range, content, offset) {
    return (0, ast_1.createSimpleExpression)(content, false, (0, utils_1.getInnerRange)(range, offset, content.length));
}
function createForLoopParams(_a, memoArgs) {
    var value = _a.value, key = _a.key, index = _a.index;
    if (memoArgs === void 0) { memoArgs = []; }
    return createParamsList(__spreadArray([value, key, index], memoArgs, true));
}
exports.createForLoopParams = createForLoopParams;
function createParamsList(args) {
    var i = args.length;
    while (i--) {
        if (args[i])
            break;
    }
    return args
        .slice(0, i + 1)
        .map(function (arg, i) { return arg || (0, ast_1.createSimpleExpression)("_".repeat(i + 1), false); });
}
