"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformModel = void 0;
var ast_1 = require("../ast");
var errors_1 = require("../errors");
var utils_1 = require("../utils");
var runtimeHelpers_1 = require("../runtimeHelpers");
var transformModel = function (dir, node, context) {
    var exp = dir.exp, arg = dir.arg;
    if (!exp) {
        context.onError((0, errors_1.createCompilerError)(41 /* ErrorCodes.X_V_MODEL_NO_EXPRESSION */, dir.loc));
        return createTransformProps();
    }
    var rawExp = exp.loc.source;
    var expString = exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ ? exp.content : rawExp;
    // im SFC <script setup> inline mode, the exp may have been transformed into
    // _unref(exp)
    var bindingType = context.bindingMetadata[rawExp];
    var maybeRef = !__BROWSER__ &&
        context.inline &&
        bindingType &&
        bindingType !== "setup-const" /* BindingTypes.SETUP_CONST */;
    if (!expString.trim() ||
        (!(0, utils_1.isMemberExpression)(expString, context) && !maybeRef)) {
        context.onError((0, errors_1.createCompilerError)(42 /* ErrorCodes.X_V_MODEL_MALFORMED_EXPRESSION */, exp.loc));
        return createTransformProps();
    }
    if (!__BROWSER__ &&
        context.prefixIdentifiers &&
        (0, utils_1.isSimpleIdentifier)(expString) &&
        context.identifiers[expString]) {
        context.onError((0, errors_1.createCompilerError)(43 /* ErrorCodes.X_V_MODEL_ON_SCOPE_VARIABLE */, exp.loc));
        return createTransformProps();
    }
    var propName = arg ? arg : (0, ast_1.createSimpleExpression)('modelValue', true);
    var eventName = arg
        ? (0, utils_1.isStaticExp)(arg)
            ? "onUpdate:".concat(arg.content)
            : (0, ast_1.createCompoundExpression)(['"onUpdate:" + ', arg])
        : "onUpdate:modelValue";
    var assignmentExp;
    var eventArg = context.isTS ? "($event: any)" : "$event";
    if (maybeRef) {
        if (bindingType === "setup-ref" /* BindingTypes.SETUP_REF */) {
            // v-model used on known ref.
            assignmentExp = (0, ast_1.createCompoundExpression)([
                "".concat(eventArg, " => (("),
                (0, ast_1.createSimpleExpression)(rawExp, false, exp.loc),
                ").value = $event)"
            ]);
        }
        else {
            // v-model used on a potentially ref binding in <script setup> inline mode.
            // the assignment needs to check whether the binding is actually a ref.
            var altAssignment = bindingType === "setup-let" /* BindingTypes.SETUP_LET */ ? "".concat(rawExp, " = $event") : "null";
            assignmentExp = (0, ast_1.createCompoundExpression)([
                "".concat(eventArg, " => (").concat(context.helperString(runtimeHelpers_1.IS_REF), "(").concat(rawExp, ") ? ("),
                (0, ast_1.createSimpleExpression)(rawExp, false, exp.loc),
                ").value = $event : ".concat(altAssignment, ")")
            ]);
        }
    }
    else {
        assignmentExp = (0, ast_1.createCompoundExpression)([
            "".concat(eventArg, " => (("),
            exp,
            ") = $event)"
        ]);
    }
    var props = [
        // modelValue: foo
        (0, ast_1.createObjectProperty)(propName, dir.exp),
        // "onUpdate:modelValue": $event => (foo = $event)
        (0, ast_1.createObjectProperty)(eventName, assignmentExp)
    ];
    // cache v-model handler if applicable (when it doesn't refer any scope vars)
    if (!__BROWSER__ &&
        context.prefixIdentifiers &&
        !context.inVOnce &&
        context.cacheHandlers &&
        !(0, utils_1.hasScopeRef)(exp, context.identifiers)) {
        props[1].value = context.cache(props[1].value);
    }
    // modelModifiers: { foo: true, "bar-baz": true }
    if (dir.modifiers.length && node.tagType === 1 /* ElementTypes.COMPONENT */) {
        var modifiers = dir.modifiers
            .map(function (m) { return ((0, utils_1.isSimpleIdentifier)(m) ? m : JSON.stringify(m)) + ": true"; })
            .join(", ");
        var modifiersKey = arg
            ? (0, utils_1.isStaticExp)(arg)
                ? "".concat(arg.content, "Modifiers")
                : (0, ast_1.createCompoundExpression)([arg, ' + "Modifiers"'])
            : "modelModifiers";
        props.push((0, ast_1.createObjectProperty)(modifiersKey, (0, ast_1.createSimpleExpression)("{ ".concat(modifiers, " }"), false, dir.loc, 2 /* ConstantTypes.CAN_HOIST */)));
    }
    return createTransformProps(props);
};
exports.transformModel = transformModel;
function createTransformProps(props) {
    if (props === void 0) { props = []; }
    return { props: props };
}
