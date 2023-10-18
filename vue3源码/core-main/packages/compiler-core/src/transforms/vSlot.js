"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSlots = exports.trackVForSlotScopes = exports.trackSlotScopes = void 0;
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var vFor_1 = require("./vFor");
var shared_1 = require("@vue/shared");
var defaultFallback = (0, ast_1.createSimpleExpression)("undefined", false);
// A NodeTransform that:
// 1. Tracks scope identifiers for scoped slots so that they don't get prefixed
//    by transformExpression. This is only applied in non-browser builds with
//    { prefixIdentifiers: true }.
// 2. Track v-slot depths so that we know a slot is inside another slot.
//    Note the exit callback is executed before buildSlots() on the same node,
//    so only nested slots see positive numbers.
var trackSlotScopes = function (node, context) {
    if (node.type === 1 /* NodeTypes.ELEMENT */ &&
        (node.tagType === 1 /* ElementTypes.COMPONENT */ ||
            node.tagType === 3 /* ElementTypes.TEMPLATE */)) {
        // We are only checking non-empty v-slot here
        // since we only care about slots that introduce scope variables.
        var vSlot = (0, utils_1.findDir)(node, 'slot');
        if (vSlot) {
            var slotProps_1 = vSlot.exp;
            if (!__BROWSER__ && context.prefixIdentifiers) {
                slotProps_1 && context.addIdentifiers(slotProps_1);
            }
            context.scopes.vSlot++;
            return function () {
                if (!__BROWSER__ && context.prefixIdentifiers) {
                    slotProps_1 && context.removeIdentifiers(slotProps_1);
                }
                context.scopes.vSlot--;
            };
        }
    }
};
exports.trackSlotScopes = trackSlotScopes;
// A NodeTransform that tracks scope identifiers for scoped slots with v-for.
// This transform is only applied in non-browser builds with { prefixIdentifiers: true }
var trackVForSlotScopes = function (node, context) {
    var vFor;
    if ((0, utils_1.isTemplateNode)(node) &&
        node.props.some(utils_1.isVSlot) &&
        (vFor = (0, utils_1.findDir)(node, 'for'))) {
        var result = (vFor.parseResult = (0, vFor_1.parseForExpression)(vFor.exp, context));
        if (result) {
            var value_1 = result.value, key_1 = result.key, index_1 = result.index;
            var addIdentifiers = context.addIdentifiers, removeIdentifiers_1 = context.removeIdentifiers;
            value_1 && addIdentifiers(value_1);
            key_1 && addIdentifiers(key_1);
            index_1 && addIdentifiers(index_1);
            return function () {
                value_1 && removeIdentifiers_1(value_1);
                key_1 && removeIdentifiers_1(key_1);
                index_1 && removeIdentifiers_1(index_1);
            };
        }
    }
};
exports.trackVForSlotScopes = trackVForSlotScopes;
var buildClientSlotFn = function (props, children, loc) {
    return (0, ast_1.createFunctionExpression)(props, children, false /* newline */, true /* isSlot */, children.length ? children[0].loc : loc);
};
// Instead of being a DirectiveTransform, v-slot processing is called during
// transformElement to build the slots object for a component.
function buildSlots(node, context, buildSlotFn) {
    if (buildSlotFn === void 0) { buildSlotFn = buildClientSlotFn; }
    context.helper(runtimeHelpers_1.WITH_CTX);
    var children = node.children, loc = node.loc;
    var slotsProperties = [];
    var dynamicSlots = [];
    // If the slot is inside a v-for or another v-slot, force it to be dynamic
    // since it likely uses a scope variable.
    var hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0;
    // with `prefixIdentifiers: true`, this can be further optimized to make
    // it dynamic only when the slot actually uses the scope variables.
    if (!__BROWSER__ && !context.ssr && context.prefixIdentifiers) {
        hasDynamicSlots = (0, utils_1.hasScopeRef)(node, context.identifiers);
    }
    // 1. Check for slot with slotProps on component itself.
    //    <Comp v-slot="{ prop }"/>
    var onComponentSlot = (0, utils_1.findDir)(node, 'slot', true);
    if (onComponentSlot) {
        var arg = onComponentSlot.arg, exp = onComponentSlot.exp;
        if (arg && !(0, utils_1.isStaticExp)(arg)) {
            hasDynamicSlots = true;
        }
        slotsProperties.push((0, ast_1.createObjectProperty)(arg || (0, ast_1.createSimpleExpression)('default', true), buildSlotFn(exp, children, loc)));
    }
    // 2. Iterate through children and check for template slots
    //    <template v-slot:foo="{ prop }">
    var hasTemplateSlots = false;
    var hasNamedDefaultSlot = false;
    var implicitDefaultChildren = [];
    var seenSlotNames = new Set();
    var conditionalBranchIndex = 0;
    for (var i = 0; i < children.length; i++) {
        var slotElement = children[i];
        var slotDir = void 0;
        if (!(0, utils_1.isTemplateNode)(slotElement) ||
            !(slotDir = (0, utils_1.findDir)(slotElement, 'slot', true))) {
            // not a <template v-slot>, skip.
            if (slotElement.type !== 3 /* NodeTypes.COMMENT */) {
                implicitDefaultChildren.push(slotElement);
            }
            continue;
        }
        if (onComponentSlot) {
            // already has on-component slot - this is incorrect usage.
            context.onError((0, errors_1.createCompilerError)(37 /* ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE */, slotDir.loc));
            break;
        }
        hasTemplateSlots = true;
        var slotChildren = slotElement.children, slotLoc = slotElement.loc;
        var _a = slotDir.arg, slotName = _a === void 0 ? (0, ast_1.createSimpleExpression)("default", true) : _a, slotProps = slotDir.exp, dirLoc = slotDir.loc;
        // check if name is dynamic.
        var staticSlotName = void 0;
        if ((0, utils_1.isStaticExp)(slotName)) {
            staticSlotName = slotName ? slotName.content : "default";
        }
        else {
            hasDynamicSlots = true;
        }
        var slotFunction = buildSlotFn(slotProps, slotChildren, slotLoc);
        // check if this slot is conditional (v-if/v-for)
        var vIf = void 0;
        var vElse = void 0;
        var vFor = void 0;
        if ((vIf = (0, utils_1.findDir)(slotElement, 'if'))) {
            hasDynamicSlots = true;
            dynamicSlots.push((0, ast_1.createConditionalExpression)(vIf.exp, buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++), defaultFallback));
        }
        else if ((vElse = (0, utils_1.findDir)(slotElement, /^else(-if)?$/, true /* allowEmpty */))) {
            // find adjacent v-if
            var j = i;
            var prev = void 0;
            while (j--) {
                prev = children[j];
                if (prev.type !== 3 /* NodeTypes.COMMENT */) {
                    break;
                }
            }
            if (prev && (0, utils_1.isTemplateNode)(prev) && (0, utils_1.findDir)(prev, 'if')) {
                // remove node
                children.splice(i, 1);
                i--;
                __TEST__ && (0, utils_1.assert)(dynamicSlots.length > 0);
                // attach this slot to previous conditional
                var conditional = dynamicSlots[dynamicSlots.length - 1];
                while (conditional.alternate.type === 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */) {
                    conditional = conditional.alternate;
                }
                conditional.alternate = vElse.exp
                    ? (0, ast_1.createConditionalExpression)(vElse.exp, buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++), defaultFallback)
                    : buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++);
            }
            else {
                context.onError((0, errors_1.createCompilerError)(30 /* ErrorCodes.X_V_ELSE_NO_ADJACENT_IF */, vElse.loc));
            }
        }
        else if ((vFor = (0, utils_1.findDir)(slotElement, 'for'))) {
            hasDynamicSlots = true;
            var parseResult = vFor.parseResult ||
                (0, vFor_1.parseForExpression)(vFor.exp, context);
            if (parseResult) {
                // Render the dynamic slots as an array and add it to the createSlot()
                // args. The runtime knows how to handle it appropriately.
                dynamicSlots.push((0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.RENDER_LIST), [
                    parseResult.source,
                    (0, ast_1.createFunctionExpression)((0, vFor_1.createForLoopParams)(parseResult), buildDynamicSlot(slotName, slotFunction), true /* force newline */)
                ]));
            }
            else {
                context.onError((0, errors_1.createCompilerError)(32 /* ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION */, vFor.loc));
            }
        }
        else {
            // check duplicate static names
            if (staticSlotName) {
                if (seenSlotNames.has(staticSlotName)) {
                    context.onError((0, errors_1.createCompilerError)(38 /* ErrorCodes.X_V_SLOT_DUPLICATE_SLOT_NAMES */, dirLoc));
                    continue;
                }
                seenSlotNames.add(staticSlotName);
                if (staticSlotName === 'default') {
                    hasNamedDefaultSlot = true;
                }
            }
            slotsProperties.push((0, ast_1.createObjectProperty)(slotName, slotFunction));
        }
    }
    if (!onComponentSlot) {
        var buildDefaultSlotProperty = function (props, children) {
            var fn = buildSlotFn(props, children, loc);
            if (__COMPAT__ && context.compatConfig) {
                fn.isNonScopedSlot = true;
            }
            return (0, ast_1.createObjectProperty)("default", fn);
        };
        if (!hasTemplateSlots) {
            // implicit default slot (on component)
            slotsProperties.push(buildDefaultSlotProperty(undefined, children));
        }
        else if (implicitDefaultChildren.length &&
            // #3766
            // with whitespace: 'preserve', whitespaces between slots will end up in
            // implicitDefaultChildren. Ignore if all implicit children are whitespaces.
            implicitDefaultChildren.some(function (node) { return isNonWhitespaceContent(node); })) {
            // implicit default slot (mixed with named slots)
            if (hasNamedDefaultSlot) {
                context.onError((0, errors_1.createCompilerError)(39 /* ErrorCodes.X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN */, implicitDefaultChildren[0].loc));
            }
            else {
                slotsProperties.push(buildDefaultSlotProperty(undefined, implicitDefaultChildren));
            }
        }
    }
    var slotFlag = hasDynamicSlots
        ? shared_1.SlotFlags.DYNAMIC
        : hasForwardedSlots(node.children)
            ? shared_1.SlotFlags.FORWARDED
            : shared_1.SlotFlags.STABLE;
    var slots = (0, ast_1.createObjectExpression)(slotsProperties.concat((0, ast_1.createObjectProperty)("_", 
    // 2 = compiled but dynamic = can skip normalization, but must run diff
    // 1 = compiled and static = can skip normalization AND diff as optimized
    (0, ast_1.createSimpleExpression)(slotFlag + (__DEV__ ? " /* ".concat(shared_1.slotFlagsText[slotFlag], " */") : ""), false))), loc);
    if (dynamicSlots.length) {
        slots = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.CREATE_SLOTS), [
            slots,
            (0, ast_1.createArrayExpression)(dynamicSlots)
        ]);
    }
    return {
        slots: slots,
        hasDynamicSlots: hasDynamicSlots
    };
}
exports.buildSlots = buildSlots;
function buildDynamicSlot(name, fn, index) {
    var props = [
        (0, ast_1.createObjectProperty)("name", name),
        (0, ast_1.createObjectProperty)("fn", fn)
    ];
    if (index != null) {
        props.push((0, ast_1.createObjectProperty)("key", (0, ast_1.createSimpleExpression)(String(index), true)));
    }
    return (0, ast_1.createObjectExpression)(props);
}
function hasForwardedSlots(children) {
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        switch (child.type) {
            case 1 /* NodeTypes.ELEMENT */:
                if (child.tagType === 2 /* ElementTypes.SLOT */ ||
                    hasForwardedSlots(child.children)) {
                    return true;
                }
                break;
            case 9 /* NodeTypes.IF */:
                if (hasForwardedSlots(child.branches))
                    return true;
                break;
            case 10 /* NodeTypes.IF_BRANCH */:
            case 11 /* NodeTypes.FOR */:
                if (hasForwardedSlots(child.children))
                    return true;
                break;
            default:
                break;
        }
    }
    return false;
}
function isNonWhitespaceContent(node) {
    if (node.type !== 2 /* NodeTypes.TEXT */ && node.type !== 12 /* NodeTypes.TEXT_CALL */)
        return true;
    return node.type === 2 /* NodeTypes.TEXT */
        ? !!node.content.trim()
        : isNonWhitespaceContent(node.content);
}
