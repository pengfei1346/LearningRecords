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
exports.createStructuralDirectiveTransform = exports.traverseNode = exports.traverseChildren = exports.transform = exports.createTransformContext = void 0;
var ast_1 = require("./ast");
var shared_1 = require("@vue/shared");
var errors_1 = require("./errors");
var runtimeHelpers_1 = require("./runtimeHelpers");
var utils_1 = require("./utils");
var hoistStatic_1 = require("./transforms/hoistStatic");
function createTransformContext(root, _a) {
    var _b = _a.filename, filename = _b === void 0 ? '' : _b, _c = _a.prefixIdentifiers, prefixIdentifiers = _c === void 0 ? false : _c, _d = _a.hoistStatic, hoistStatic = _d === void 0 ? false : _d, _e = _a.cacheHandlers, cacheHandlers = _e === void 0 ? false : _e, _f = _a.nodeTransforms, nodeTransforms = _f === void 0 ? [] : _f, _g = _a.directiveTransforms, directiveTransforms = _g === void 0 ? {} : _g, _h = _a.transformHoist, transformHoist = _h === void 0 ? null : _h, _j = _a.isBuiltInComponent, isBuiltInComponent = _j === void 0 ? shared_1.NOOP : _j, _k = _a.isCustomElement, isCustomElement = _k === void 0 ? shared_1.NOOP : _k, _l = _a.expressionPlugins, expressionPlugins = _l === void 0 ? [] : _l, _m = _a.scopeId, scopeId = _m === void 0 ? null : _m, _o = _a.slotted, slotted = _o === void 0 ? true : _o, _p = _a.ssr, ssr = _p === void 0 ? false : _p, _q = _a.inSSR, inSSR = _q === void 0 ? false : _q, _r = _a.ssrCssVars, ssrCssVars = _r === void 0 ? "" : _r, _s = _a.bindingMetadata, bindingMetadata = _s === void 0 ? shared_1.EMPTY_OBJ : _s, _t = _a.inline, inline = _t === void 0 ? false : _t, _u = _a.isTS, isTS = _u === void 0 ? false : _u, _v = _a.onError, onError = _v === void 0 ? errors_1.defaultOnError : _v, _w = _a.onWarn, onWarn = _w === void 0 ? errors_1.defaultOnWarn : _w, compatConfig = _a.compatConfig;
    var nameMatch = filename.replace(/\?.*$/, '').match(/([^/\\]+)\.\w+$/);
    var context = {
        // options
        selfName: nameMatch && (0, shared_1.capitalize)((0, shared_1.camelize)(nameMatch[1])),
        prefixIdentifiers: prefixIdentifiers,
        hoistStatic: hoistStatic,
        cacheHandlers: cacheHandlers,
        nodeTransforms: nodeTransforms,
        directiveTransforms: directiveTransforms,
        transformHoist: transformHoist,
        isBuiltInComponent: isBuiltInComponent,
        isCustomElement: isCustomElement,
        expressionPlugins: expressionPlugins,
        scopeId: scopeId,
        slotted: slotted,
        ssr: ssr,
        inSSR: inSSR,
        ssrCssVars: ssrCssVars,
        bindingMetadata: bindingMetadata,
        inline: inline,
        isTS: isTS,
        onError: onError,
        onWarn: onWarn,
        compatConfig: compatConfig,
        // state
        root: root,
        helpers: new Map(),
        components: new Set(),
        directives: new Set(),
        hoists: [],
        imports: [],
        constantCache: new Map(),
        temps: 0,
        cached: 0,
        identifiers: Object.create(null),
        scopes: {
            vFor: 0,
            vSlot: 0,
            vPre: 0,
            vOnce: 0
        },
        parent: null,
        currentNode: root,
        childIndex: 0,
        inVOnce: false,
        // methods
        helper: function (name) {
            var count = context.helpers.get(name) || 0;
            context.helpers.set(name, count + 1);
            return name;
        },
        removeHelper: function (name) {
            var count = context.helpers.get(name);
            if (count) {
                var currentCount = count - 1;
                if (!currentCount) {
                    context.helpers.delete(name);
                }
                else {
                    context.helpers.set(name, currentCount);
                }
            }
        },
        helperString: function (name) {
            return "_".concat(runtimeHelpers_1.helperNameMap[context.helper(name)]);
        },
        replaceNode: function (node) {
            /* istanbul ignore if */
            if (__DEV__) {
                if (!context.currentNode) {
                    throw new Error("Node being replaced is already removed.");
                }
                if (!context.parent) {
                    throw new Error("Cannot replace root node.");
                }
            }
            context.parent.children[context.childIndex] = context.currentNode = node;
        },
        removeNode: function (node) {
            if (__DEV__ && !context.parent) {
                throw new Error("Cannot remove root node.");
            }
            var list = context.parent.children;
            var removalIndex = node
                ? list.indexOf(node)
                : context.currentNode
                    ? context.childIndex
                    : -1;
            /* istanbul ignore if */
            if (__DEV__ && removalIndex < 0) {
                throw new Error("node being removed is not a child of current parent");
            }
            if (!node || node === context.currentNode) {
                // current node removed
                context.currentNode = null;
                context.onNodeRemoved();
            }
            else {
                // sibling node removed
                if (context.childIndex > removalIndex) {
                    context.childIndex--;
                    context.onNodeRemoved();
                }
            }
            context.parent.children.splice(removalIndex, 1);
        },
        onNodeRemoved: function () { },
        addIdentifiers: function (exp) {
            // identifier tracking only happens in non-browser builds.
            if (!__BROWSER__) {
                if ((0, shared_1.isString)(exp)) {
                    addId(exp);
                }
                else if (exp.identifiers) {
                    exp.identifiers.forEach(addId);
                }
                else if (exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
                    addId(exp.content);
                }
            }
        },
        removeIdentifiers: function (exp) {
            if (!__BROWSER__) {
                if ((0, shared_1.isString)(exp)) {
                    removeId(exp);
                }
                else if (exp.identifiers) {
                    exp.identifiers.forEach(removeId);
                }
                else if (exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
                    removeId(exp.content);
                }
            }
        },
        hoist: function (exp) {
            if ((0, shared_1.isString)(exp))
                exp = (0, ast_1.createSimpleExpression)(exp);
            context.hoists.push(exp);
            var identifier = (0, ast_1.createSimpleExpression)("_hoisted_".concat(context.hoists.length), false, exp.loc, 2 /* ConstantTypes.CAN_HOIST */);
            identifier.hoisted = exp;
            return identifier;
        },
        cache: function (exp, isVNode) {
            if (isVNode === void 0) { isVNode = false; }
            return (0, ast_1.createCacheExpression)(context.cached++, exp, isVNode);
        }
    };
    if (__COMPAT__) {
        context.filters = new Set();
    }
    function addId(id) {
        var identifiers = context.identifiers;
        if (identifiers[id] === undefined) {
            identifiers[id] = 0;
        }
        identifiers[id]++;
    }
    function removeId(id) {
        context.identifiers[id]--;
    }
    return context;
}
exports.createTransformContext = createTransformContext;
function transform(root, options) {
    var context = createTransformContext(root, options);
    traverseNode(root, context);
    if (options.hoistStatic) {
        (0, hoistStatic_1.hoistStatic)(root, context);
    }
    if (!options.ssr) {
        createRootCodegen(root, context);
    }
    // finalize meta information
    root.helpers = __spreadArray([], context.helpers.keys(), true);
    root.components = __spreadArray([], context.components, true);
    root.directives = __spreadArray([], context.directives, true);
    root.imports = context.imports;
    root.hoists = context.hoists;
    root.temps = context.temps;
    root.cached = context.cached;
    if (__COMPAT__) {
        root.filters = __spreadArray([], context.filters, true);
    }
}
exports.transform = transform;
function createRootCodegen(root, context) {
    var helper = context.helper;
    var children = root.children;
    if (children.length === 1) {
        var child = children[0];
        // if the single child is an element, turn it into a block.
        if ((0, hoistStatic_1.isSingleElementRoot)(root, child) && child.codegenNode) {
            // single element root is never hoisted so codegenNode will never be
            // SimpleExpressionNode
            var codegenNode = child.codegenNode;
            if (codegenNode.type === 13 /* NodeTypes.VNODE_CALL */) {
                (0, utils_1.makeBlock)(codegenNode, context);
            }
            root.codegenNode = codegenNode;
        }
        else {
            // - single <slot/>, IfNode, ForNode: already blocks.
            // - single text node: always patched.
            // root codegen falls through via genNode()
            root.codegenNode = child;
        }
    }
    else if (children.length > 1) {
        // root has multiple nodes - return a fragment block.
        var patchFlag = shared_1.PatchFlags.STABLE_FRAGMENT;
        var patchFlagText = shared_1.PatchFlagNames[shared_1.PatchFlags.STABLE_FRAGMENT];
        // check if the fragment actually contains a single valid child with
        // the rest being comments
        if (__DEV__ &&
            children.filter(function (c) { return c.type !== 3 /* NodeTypes.COMMENT */; }).length === 1) {
            patchFlag |= shared_1.PatchFlags.DEV_ROOT_FRAGMENT;
            patchFlagText += ", ".concat(shared_1.PatchFlagNames[shared_1.PatchFlags.DEV_ROOT_FRAGMENT]);
        }
        root.codegenNode = (0, ast_1.createVNodeCall)(context, helper(runtimeHelpers_1.FRAGMENT), undefined, root.children, patchFlag + (__DEV__ ? " /* ".concat(patchFlagText, " */") : ""), undefined, undefined, true, undefined, false /* isComponent */);
    }
    else {
        // no children = noop. codegen will return null.
    }
}
function traverseChildren(parent, context) {
    var i = 0;
    var nodeRemoved = function () {
        i--;
    };
    for (; i < parent.children.length; i++) {
        var child = parent.children[i];
        if ((0, shared_1.isString)(child))
            continue;
        context.parent = parent;
        context.childIndex = i;
        context.onNodeRemoved = nodeRemoved;
        traverseNode(child, context);
    }
}
exports.traverseChildren = traverseChildren;
function traverseNode(node, context) {
    context.currentNode = node;
    // apply transform plugins
    var nodeTransforms = context.nodeTransforms;
    var exitFns = [];
    for (var i_1 = 0; i_1 < nodeTransforms.length; i_1++) {
        var onExit = nodeTransforms[i_1](node, context);
        if (onExit) {
            if ((0, shared_1.isArray)(onExit)) {
                exitFns.push.apply(exitFns, onExit);
            }
            else {
                exitFns.push(onExit);
            }
        }
        if (!context.currentNode) {
            // node was removed
            return;
        }
        else {
            // node may have been replaced
            node = context.currentNode;
        }
    }
    switch (node.type) {
        case 3 /* NodeTypes.COMMENT */:
            if (!context.ssr) {
                // inject import for the Comment symbol, which is needed for creating
                // comment nodes with `createVNode`
                context.helper(runtimeHelpers_1.CREATE_COMMENT);
            }
            break;
        case 5 /* NodeTypes.INTERPOLATION */:
            // no need to traverse, but we need to inject toString helper
            if (!context.ssr) {
                context.helper(runtimeHelpers_1.TO_DISPLAY_STRING);
            }
            break;
        // for container types, further traverse downwards
        case 9 /* NodeTypes.IF */:
            for (var i_2 = 0; i_2 < node.branches.length; i_2++) {
                traverseNode(node.branches[i_2], context);
            }
            break;
        case 10 /* NodeTypes.IF_BRANCH */:
        case 11 /* NodeTypes.FOR */:
        case 1 /* NodeTypes.ELEMENT */:
        case 0 /* NodeTypes.ROOT */:
            traverseChildren(node, context);
            break;
    }
    // exit transforms
    context.currentNode = node;
    var i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
exports.traverseNode = traverseNode;
function createStructuralDirectiveTransform(name, fn) {
    var matches = (0, shared_1.isString)(name)
        ? function (n) { return n === name; }
        : function (n) { return name.test(n); };
    return function (node, context) {
        if (node.type === 1 /* NodeTypes.ELEMENT */) {
            var props = node.props;
            // structural directive transforms are not concerned with slots
            // as they are handled separately in vSlot.ts
            if (node.tagType === 3 /* ElementTypes.TEMPLATE */ && props.some(utils_1.isVSlot)) {
                return;
            }
            var exitFns = [];
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                if (prop.type === 7 /* NodeTypes.DIRECTIVE */ && matches(prop.name)) {
                    // structural directives are removed to avoid infinite recursion
                    // also we remove them *before* applying so that it can further
                    // traverse itself in case it moves the node around
                    props.splice(i, 1);
                    i--;
                    var onExit = fn(node, prop, context);
                    if (onExit)
                        exitFns.push(onExit);
                }
            }
            return exitFns;
        }
    };
}
exports.createStructuralDirectiveTransform = createStructuralDirectiveTransform;
