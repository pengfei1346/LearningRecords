"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyExpression = exports.processExpression = exports.transformExpression = void 0;
var ast_1 = require("../ast");
var babelUtils_1 = require("../babelUtils");
var utils_1 = require("../utils");
var shared_1 = require("@vue/shared");
var errors_1 = require("../errors");
var validateExpression_1 = require("../validateExpression");
var parser_1 = require("@babel/parser");
var runtimeHelpers_1 = require("../runtimeHelpers");
var isLiteralWhitelisted = /*#__PURE__*/ (0, shared_1.makeMap)('true,false,null,this');
var transformExpression = function (node, context) {
    if (node.type === 5 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content, context);
    }
    else if (node.type === 1 /* NodeTypes.ELEMENT */) {
        // handle directives on element
        for (var i = 0; i < node.props.length; i++) {
            var dir = node.props[i];
            // do not process for v-on & v-for since they are special handled
            if (dir.type === 7 /* NodeTypes.DIRECTIVE */ && dir.name !== 'for') {
                var exp = dir.exp;
                var arg = dir.arg;
                // do not process exp if this is v-on:arg - we need special handling
                // for wrapping inline statements.
                if (exp &&
                    exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ &&
                    !(dir.name === 'on' && arg)) {
                    dir.exp = processExpression(exp, context, 
                    // slot args must be processed as function params
                    dir.name === 'slot');
                }
                if (arg && arg.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ && !arg.isStatic) {
                    dir.arg = processExpression(arg, context);
                }
            }
        }
    }
};
exports.transformExpression = transformExpression;
// Important: since this function uses Node.js only dependencies, it should
// always be used with a leading !__BROWSER__ check so that it can be
// tree-shaken from the browser build.
function processExpression(node, context, 
// some expressions like v-slot props & v-for aliases should be parsed as
// function params
asParams, 
// v-on handler values may contain multiple statements
asRawStatements, localVars) {
    if (asParams === void 0) { asParams = false; }
    if (asRawStatements === void 0) { asRawStatements = false; }
    if (localVars === void 0) { localVars = Object.create(context.identifiers); }
    if (__BROWSER__) {
        if (__DEV__) {
            // simple in-browser validation (same logic in 2.x)
            (0, validateExpression_1.validateBrowserExpression)(node, context, asParams, asRawStatements);
        }
        return node;
    }
    if (!context.prefixIdentifiers || !node.content.trim()) {
        return node;
    }
    var inline = context.inline, bindingMetadata = context.bindingMetadata;
    var rewriteIdentifier = function (raw, parent, id) {
        var type = (0, shared_1.hasOwn)(bindingMetadata, raw) && bindingMetadata[raw];
        if (inline) {
            // x = y
            var isAssignmentLVal = parent && parent.type === 'AssignmentExpression' && parent.left === id;
            // x++
            var isUpdateArg = parent && parent.type === 'UpdateExpression' && parent.argument === id;
            // ({ x } = y)
            var isDestructureAssignment = parent && (0, babelUtils_1.isInDestructureAssignment)(parent, parentStack);
            if (type === "setup-const" /* BindingTypes.SETUP_CONST */ ||
                type === "setup-reactive-const" /* BindingTypes.SETUP_REACTIVE_CONST */ ||
                localVars[raw]) {
                return raw;
            }
            else if (type === "setup-ref" /* BindingTypes.SETUP_REF */) {
                return "".concat(raw, ".value");
            }
            else if (type === "setup-maybe-ref" /* BindingTypes.SETUP_MAYBE_REF */) {
                // const binding that may or may not be ref
                // if it's not a ref, then assignments don't make sense -
                // so we ignore the non-ref assignment case and generate code
                // that assumes the value to be a ref for more efficiency
                return isAssignmentLVal || isUpdateArg || isDestructureAssignment
                    ? "".concat(raw, ".value")
                    : "".concat(context.helperString(runtimeHelpers_1.UNREF), "(").concat(raw, ")");
            }
            else if (type === "setup-let" /* BindingTypes.SETUP_LET */) {
                if (isAssignmentLVal) {
                    // let binding.
                    // this is a bit more tricky as we need to cover the case where
                    // let is a local non-ref value, and we need to replicate the
                    // right hand side value.
                    // x = y --> isRef(x) ? x.value = y : x = y
                    var _a = parent, rVal = _a.right, operator = _a.operator;
                    var rExp = rawExp.slice(rVal.start - 1, rVal.end - 1);
                    var rExpString = stringifyExpression(processExpression((0, ast_1.createSimpleExpression)(rExp, false), context, false, false, knownIds));
                    return "".concat(context.helperString(runtimeHelpers_1.IS_REF), "(").concat(raw, ")").concat(context.isTS ? " //@ts-ignore\n" : "", " ? ").concat(raw, ".value ").concat(operator, " ").concat(rExpString, " : ").concat(raw);
                }
                else if (isUpdateArg) {
                    // make id replace parent in the code range so the raw update operator
                    // is removed
                    id.start = parent.start;
                    id.end = parent.end;
                    var _b = parent, isPrefix = _b.prefix, operator = _b.operator;
                    var prefix = isPrefix ? operator : "";
                    var postfix = isPrefix ? "" : operator;
                    // let binding.
                    // x++ --> isRef(a) ? a.value++ : a++
                    return "".concat(context.helperString(runtimeHelpers_1.IS_REF), "(").concat(raw, ")").concat(context.isTS ? " //@ts-ignore\n" : "", " ? ").concat(prefix).concat(raw, ".value").concat(postfix, " : ").concat(prefix).concat(raw).concat(postfix);
                }
                else if (isDestructureAssignment) {
                    // TODO
                    // let binding in a destructure assignment - it's very tricky to
                    // handle both possible cases here without altering the original
                    // structure of the code, so we just assume it's not a ref here
                    // for now
                    return raw;
                }
                else {
                    return "".concat(context.helperString(runtimeHelpers_1.UNREF), "(").concat(raw, ")");
                }
            }
            else if (type === "props" /* BindingTypes.PROPS */) {
                // use __props which is generated by compileScript so in ts mode
                // it gets correct type
                return (0, shared_1.genPropsAccessExp)(raw);
            }
            else if (type === "props-aliased" /* BindingTypes.PROPS_ALIASED */) {
                // prop with a different local alias (from defineProps() destructure)
                return (0, shared_1.genPropsAccessExp)(bindingMetadata.__propsAliases[raw]);
            }
        }
        else {
            if (type && type.startsWith('setup')) {
                // setup bindings in non-inline mode
                return "$setup.".concat(raw);
            }
            else if (type === "props-aliased" /* BindingTypes.PROPS_ALIASED */) {
                return "$props['".concat(bindingMetadata.__propsAliases[raw], "']");
            }
            else if (type) {
                return "$".concat(type, ".").concat(raw);
            }
        }
        // fallback to ctx
        return "_ctx.".concat(raw);
    };
    // fast path if expression is a simple identifier.
    var rawExp = node.content;
    // bail constant on parens (function invocation) and dot (member access)
    var bailConstant = rawExp.indexOf("(") > -1 || rawExp.indexOf('.') > 0;
    if ((0, utils_1.isSimpleIdentifier)(rawExp)) {
        var isScopeVarReference = context.identifiers[rawExp];
        var isAllowedGlobal = (0, shared_1.isGloballyWhitelisted)(rawExp);
        var isLiteral = isLiteralWhitelisted(rawExp);
        if (!asParams && !isScopeVarReference && !isAllowedGlobal && !isLiteral) {
            // const bindings exposed from setup can be skipped for patching but
            // cannot be hoisted to module scope
            if (bindingMetadata[node.content] === "setup-const" /* BindingTypes.SETUP_CONST */) {
                node.constType = 1 /* ConstantTypes.CAN_SKIP_PATCH */;
            }
            node.content = rewriteIdentifier(rawExp);
        }
        else if (!isScopeVarReference) {
            if (isLiteral) {
                node.constType = 3 /* ConstantTypes.CAN_STRINGIFY */;
            }
            else {
                node.constType = 2 /* ConstantTypes.CAN_HOIST */;
            }
        }
        return node;
    }
    var ast;
    // exp needs to be parsed differently:
    // 1. Multiple inline statements (v-on, with presence of `;`): parse as raw
    //    exp, but make sure to pad with spaces for consistent ranges
    // 2. Expressions: wrap with parens (for e.g. object expressions)
    // 3. Function arguments (v-for, v-slot): place in a function argument position
    var source = asRawStatements
        ? " ".concat(rawExp, " ")
        : "(".concat(rawExp, ")").concat(asParams ? "=>{}" : "");
    try {
        ast = (0, parser_1.parse)(source, {
            plugins: context.expressionPlugins
        }).program;
    }
    catch (e) {
        context.onError((0, errors_1.createCompilerError)(44 /* ErrorCodes.X_INVALID_EXPRESSION */, node.loc, undefined, e.message));
        return node;
    }
    var ids = [];
    var parentStack = [];
    var knownIds = Object.create(context.identifiers);
    (0, babelUtils_1.walkIdentifiers)(ast, function (node, parent, _, isReferenced, isLocal) {
        if ((0, babelUtils_1.isStaticPropertyKey)(node, parent)) {
            return;
        }
        // v2 wrapped filter call
        if (__COMPAT__ && node.name.startsWith('_filter_')) {
            return;
        }
        var needPrefix = isReferenced && canPrefix(node);
        if (needPrefix && !isLocal) {
            if ((0, babelUtils_1.isStaticProperty)(parent) && parent.shorthand) {
                // property shorthand like { foo }, we need to add the key since
                // we rewrite the value
                ;
                node.prefix = "".concat(node.name, ": ");
            }
            node.name = rewriteIdentifier(node.name, parent, node);
            ids.push(node);
        }
        else {
            // The identifier is considered constant unless it's pointing to a
            // local scope variable (a v-for alias, or a v-slot prop)
            if (!(needPrefix && isLocal) && !bailConstant) {
                ;
                node.isConstant = true;
            }
            // also generate sub-expressions for other identifiers for better
            // source map support. (except for property keys which are static)
            ids.push(node);
        }
    }, true, // invoke on ALL identifiers
    parentStack, knownIds);
    // We break up the compound expression into an array of strings and sub
    // expressions (for identifiers that have been prefixed). In codegen, if
    // an ExpressionNode has the `.children` property, it will be used instead of
    // `.content`.
    var children = [];
    ids.sort(function (a, b) { return a.start - b.start; });
    ids.forEach(function (id, i) {
        // range is offset by -1 due to the wrapping parens when parsed
        var start = id.start - 1;
        var end = id.end - 1;
        var last = ids[i - 1];
        var leadingText = rawExp.slice(last ? last.end - 1 : 0, start);
        if (leadingText.length || id.prefix) {
            children.push(leadingText + (id.prefix || ""));
        }
        var source = rawExp.slice(start, end);
        children.push((0, ast_1.createSimpleExpression)(id.name, false, {
            source: source,
            start: (0, utils_1.advancePositionWithClone)(node.loc.start, source, start),
            end: (0, utils_1.advancePositionWithClone)(node.loc.start, source, end)
        }, id.isConstant ? 3 /* ConstantTypes.CAN_STRINGIFY */ : 0 /* ConstantTypes.NOT_CONSTANT */));
        if (i === ids.length - 1 && end < rawExp.length) {
            children.push(rawExp.slice(end));
        }
    });
    var ret;
    if (children.length) {
        ret = (0, ast_1.createCompoundExpression)(children, node.loc);
    }
    else {
        ret = node;
        ret.constType = bailConstant
            ? 0 /* ConstantTypes.NOT_CONSTANT */
            : 3 /* ConstantTypes.CAN_STRINGIFY */;
    }
    ret.identifiers = Object.keys(knownIds);
    return ret;
}
exports.processExpression = processExpression;
function canPrefix(id) {
    // skip whitelisted globals
    if ((0, shared_1.isGloballyWhitelisted)(id.name)) {
        return false;
    }
    // special case for webpack compilation
    if (id.name === 'require') {
        return false;
    }
    return true;
}
function stringifyExpression(exp) {
    if ((0, shared_1.isString)(exp)) {
        return exp;
    }
    else if (exp.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
        return exp.content;
    }
    else {
        return exp.children
            .map(stringifyExpression)
            .join('');
    }
}
exports.stringifyExpression = stringifyExpression;
