"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
var ast_1 = require("./ast");
var source_map_1 = require("source-map");
var utils_1 = require("./utils");
var shared_1 = require("@vue/shared");
var runtimeHelpers_1 = require("./runtimeHelpers");
var PURE_ANNOTATION = "/*#__PURE__*/";
var aliasHelper = function (s) { return "".concat(runtimeHelpers_1.helperNameMap[s], ": _").concat(runtimeHelpers_1.helperNameMap[s]); };
function createCodegenContext(ast, _a) {
    var _b = _a.mode, mode = _b === void 0 ? 'function' : _b, _c = _a.prefixIdentifiers, prefixIdentifiers = _c === void 0 ? mode === 'module' : _c, _d = _a.sourceMap, sourceMap = _d === void 0 ? false : _d, _e = _a.filename, filename = _e === void 0 ? "template.vue.html" : _e, _f = _a.scopeId, scopeId = _f === void 0 ? null : _f, _g = _a.optimizeImports, optimizeImports = _g === void 0 ? false : _g, _h = _a.runtimeGlobalName, runtimeGlobalName = _h === void 0 ? "Vue" : _h, _j = _a.runtimeModuleName, runtimeModuleName = _j === void 0 ? "vue" : _j, _k = _a.ssrRuntimeModuleName, ssrRuntimeModuleName = _k === void 0 ? 'vue/server-renderer' : _k, _l = _a.ssr, ssr = _l === void 0 ? false : _l, _m = _a.isTS, isTS = _m === void 0 ? false : _m, _o = _a.inSSR, inSSR = _o === void 0 ? false : _o;
    var context = {
        mode: mode,
        prefixIdentifiers: prefixIdentifiers,
        sourceMap: sourceMap,
        filename: filename,
        scopeId: scopeId,
        optimizeImports: optimizeImports,
        runtimeGlobalName: runtimeGlobalName,
        runtimeModuleName: runtimeModuleName,
        ssrRuntimeModuleName: ssrRuntimeModuleName,
        ssr: ssr,
        isTS: isTS,
        inSSR: inSSR,
        source: ast.loc.source,
        code: "",
        column: 1,
        line: 1,
        offset: 0,
        indentLevel: 0,
        pure: false,
        map: undefined,
        helper: function (key) {
            return "_".concat(runtimeHelpers_1.helperNameMap[key]);
        },
        push: function (code, node) {
            context.code += code;
            if (!__BROWSER__ && context.map) {
                if (node) {
                    var name_1;
                    if (node.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ && !node.isStatic) {
                        var content = node.content.replace(/^_ctx\./, '');
                        if (content !== node.content && (0, utils_1.isSimpleIdentifier)(content)) {
                            name_1 = content;
                        }
                    }
                    addMapping(node.loc.start, name_1);
                }
                (0, utils_1.advancePositionWithMutation)(context, code);
                if (node && node.loc !== ast_1.locStub) {
                    addMapping(node.loc.end);
                }
            }
        },
        indent: function () {
            newline(++context.indentLevel);
        },
        deindent: function (withoutNewLine) {
            if (withoutNewLine === void 0) { withoutNewLine = false; }
            if (withoutNewLine) {
                --context.indentLevel;
            }
            else {
                newline(--context.indentLevel);
            }
        },
        newline: function () {
            newline(context.indentLevel);
        }
    };
    function newline(n) {
        context.push('\n' + "  ".repeat(n));
    }
    function addMapping(loc, name) {
        context.map.addMapping({
            name: name,
            source: context.filename,
            original: {
                line: loc.line,
                column: loc.column - 1 // source-map column is 0 based
            },
            generated: {
                line: context.line,
                column: context.column - 1
            }
        });
    }
    if (!__BROWSER__ && sourceMap) {
        // lazy require source-map implementation, only in non-browser builds
        context.map = new source_map_1.SourceMapGenerator();
        context.map.setSourceContent(filename, context.source);
    }
    return context;
}
function generate(ast, options) {
    if (options === void 0) { options = {}; }
    var context = createCodegenContext(ast, options);
    if (options.onContextCreated)
        options.onContextCreated(context);
    var mode = context.mode, push = context.push, prefixIdentifiers = context.prefixIdentifiers, indent = context.indent, deindent = context.deindent, newline = context.newline, scopeId = context.scopeId, ssr = context.ssr;
    var hasHelpers = ast.helpers.length > 0;
    var useWithBlock = !prefixIdentifiers && mode !== 'module';
    var genScopeId = !__BROWSER__ && scopeId != null && mode === 'module';
    var isSetupInlined = !__BROWSER__ && !!options.inline;
    // preambles
    // in setup() inline mode, the preamble is generated in a sub context
    // and returned separately.
    var preambleContext = isSetupInlined
        ? createCodegenContext(ast, options)
        : context;
    if (!__BROWSER__ && mode === 'module') {
        genModulePreamble(ast, preambleContext, genScopeId, isSetupInlined);
    }
    else {
        genFunctionPreamble(ast, preambleContext);
    }
    // enter render function
    var functionName = ssr ? "ssrRender" : "render";
    var args = ssr ? ['_ctx', '_push', '_parent', '_attrs'] : ['_ctx', '_cache'];
    if (!__BROWSER__ && options.bindingMetadata && !options.inline) {
        // binding optimization args
        args.push('$props', '$setup', '$data', '$options');
    }
    var signature = !__BROWSER__ && options.isTS
        ? args.map(function (arg) { return "".concat(arg, ": any"); }).join(',')
        : args.join(', ');
    if (isSetupInlined) {
        push("(".concat(signature, ") => {"));
    }
    else {
        push("function ".concat(functionName, "(").concat(signature, ") {"));
    }
    indent();
    if (useWithBlock) {
        push("with (_ctx) {");
        indent();
        // function mode const declarations should be inside with block
        // also they should be renamed to avoid collision with user properties
        if (hasHelpers) {
            push("const { ".concat(ast.helpers.map(aliasHelper).join(', '), " } = _Vue"));
            push("\n");
            newline();
        }
    }
    // generate asset resolution statements
    if (ast.components.length) {
        genAssets(ast.components, 'component', context);
        if (ast.directives.length || ast.temps > 0) {
            newline();
        }
    }
    if (ast.directives.length) {
        genAssets(ast.directives, 'directive', context);
        if (ast.temps > 0) {
            newline();
        }
    }
    if (__COMPAT__ && ast.filters && ast.filters.length) {
        newline();
        genAssets(ast.filters, 'filter', context);
        newline();
    }
    if (ast.temps > 0) {
        push("let ");
        for (var i = 0; i < ast.temps; i++) {
            push("".concat(i > 0 ? ", " : "", "_temp").concat(i));
        }
    }
    if (ast.components.length || ast.directives.length || ast.temps) {
        push("\n");
        newline();
    }
    // generate the VNode tree expression
    if (!ssr) {
        push("return ");
    }
    if (ast.codegenNode) {
        genNode(ast.codegenNode, context);
    }
    else {
        push("null");
    }
    if (useWithBlock) {
        deindent();
        push("}");
    }
    deindent();
    push("}");
    return {
        ast: ast,
        code: context.code,
        preamble: isSetupInlined ? preambleContext.code : "",
        // SourceMapGenerator does have toJSON() method but it's not in the types
        map: context.map ? context.map.toJSON() : undefined
    };
}
exports.generate = generate;
function genFunctionPreamble(ast, context) {
    var ssr = context.ssr, prefixIdentifiers = context.prefixIdentifiers, push = context.push, newline = context.newline, runtimeModuleName = context.runtimeModuleName, runtimeGlobalName = context.runtimeGlobalName, ssrRuntimeModuleName = context.ssrRuntimeModuleName;
    var VueBinding = !__BROWSER__ && ssr
        ? "require(".concat(JSON.stringify(runtimeModuleName), ")")
        : runtimeGlobalName;
    // Generate const declaration for helpers
    // In prefix mode, we place the const declaration at top so it's done
    // only once; But if we not prefixing, we place the declaration inside the
    // with block so it doesn't incur the `in` check cost for every helper access.
    if (ast.helpers.length > 0) {
        if (!__BROWSER__ && prefixIdentifiers) {
            push("const { ".concat(ast.helpers.map(aliasHelper).join(', '), " } = ").concat(VueBinding, "\n"));
        }
        else {
            // "with" mode.
            // save Vue in a separate variable to avoid collision
            push("const _Vue = ".concat(VueBinding, "\n"));
            // in "with" mode, helpers are declared inside the with block to avoid
            // has check cost, but hoists are lifted out of the function - we need
            // to provide the helper here.
            if (ast.hoists.length) {
                var staticHelpers = [
                    runtimeHelpers_1.CREATE_VNODE,
                    runtimeHelpers_1.CREATE_ELEMENT_VNODE,
                    runtimeHelpers_1.CREATE_COMMENT,
                    runtimeHelpers_1.CREATE_TEXT,
                    runtimeHelpers_1.CREATE_STATIC
                ]
                    .filter(function (helper) { return ast.helpers.includes(helper); })
                    .map(aliasHelper)
                    .join(', ');
                push("const { ".concat(staticHelpers, " } = _Vue\n"));
            }
        }
    }
    // generate variables for ssr helpers
    if (!__BROWSER__ && ast.ssrHelpers && ast.ssrHelpers.length) {
        // ssr guarantees prefixIdentifier: true
        push("const { ".concat(ast.ssrHelpers
            .map(aliasHelper)
            .join(', '), " } = require(\"").concat(ssrRuntimeModuleName, "\")\n"));
    }
    genHoists(ast.hoists, context);
    newline();
    push("return ");
}
function genModulePreamble(ast, context, genScopeId, inline) {
    var push = context.push, newline = context.newline, optimizeImports = context.optimizeImports, runtimeModuleName = context.runtimeModuleName, ssrRuntimeModuleName = context.ssrRuntimeModuleName;
    if (genScopeId && ast.hoists.length) {
        ast.helpers.push(runtimeHelpers_1.PUSH_SCOPE_ID, runtimeHelpers_1.POP_SCOPE_ID);
    }
    // generate import statements for helpers
    if (ast.helpers.length) {
        if (optimizeImports) {
            // when bundled with webpack with code-split, calling an import binding
            // as a function leads to it being wrapped with `Object(a.b)` or `(0,a.b)`,
            // incurring both payload size increase and potential perf overhead.
            // therefore we assign the imports to variables (which is a constant ~50b
            // cost per-component instead of scaling with template size)
            push("import { ".concat(ast.helpers
                .map(function (s) { return runtimeHelpers_1.helperNameMap[s]; })
                .join(', '), " } from ").concat(JSON.stringify(runtimeModuleName), "\n"));
            push("\n// Binding optimization for webpack code-split\nconst ".concat(ast.helpers
                .map(function (s) { return "_".concat(runtimeHelpers_1.helperNameMap[s], " = ").concat(runtimeHelpers_1.helperNameMap[s]); })
                .join(', '), "\n"));
        }
        else {
            push("import { ".concat(ast.helpers
                .map(function (s) { return "".concat(runtimeHelpers_1.helperNameMap[s], " as _").concat(runtimeHelpers_1.helperNameMap[s]); })
                .join(', '), " } from ").concat(JSON.stringify(runtimeModuleName), "\n"));
        }
    }
    if (ast.ssrHelpers && ast.ssrHelpers.length) {
        push("import { ".concat(ast.ssrHelpers
            .map(function (s) { return "".concat(runtimeHelpers_1.helperNameMap[s], " as _").concat(runtimeHelpers_1.helperNameMap[s]); })
            .join(', '), " } from \"").concat(ssrRuntimeModuleName, "\"\n"));
    }
    if (ast.imports.length) {
        genImports(ast.imports, context);
        newline();
    }
    genHoists(ast.hoists, context);
    newline();
    if (!inline) {
        push("export ");
    }
}
function genAssets(assets, type, _a) {
    var helper = _a.helper, push = _a.push, newline = _a.newline, isTS = _a.isTS;
    var resolver = helper(__COMPAT__ && type === 'filter'
        ? runtimeHelpers_1.RESOLVE_FILTER
        : type === 'component'
            ? runtimeHelpers_1.RESOLVE_COMPONENT
            : runtimeHelpers_1.RESOLVE_DIRECTIVE);
    for (var i = 0; i < assets.length; i++) {
        var id = assets[i];
        // potential component implicit self-reference inferred from SFC filename
        var maybeSelfReference = id.endsWith('__self');
        if (maybeSelfReference) {
            id = id.slice(0, -6);
        }
        push("const ".concat((0, utils_1.toValidAssetId)(id, type), " = ").concat(resolver, "(").concat(JSON.stringify(id)).concat(maybeSelfReference ? ", true" : "", ")").concat(isTS ? "!" : ""));
        if (i < assets.length - 1) {
            newline();
        }
    }
}
function genHoists(hoists, context) {
    if (!hoists.length) {
        return;
    }
    context.pure = true;
    var push = context.push, newline = context.newline, helper = context.helper, scopeId = context.scopeId, mode = context.mode;
    var genScopeId = !__BROWSER__ && scopeId != null && mode !== 'function';
    newline();
    // generate inlined withScopeId helper
    if (genScopeId) {
        push("const _withScopeId = n => (".concat(helper(runtimeHelpers_1.PUSH_SCOPE_ID), "(\"").concat(scopeId, "\"),n=n(),").concat(helper(runtimeHelpers_1.POP_SCOPE_ID), "(),n)"));
        newline();
    }
    for (var i = 0; i < hoists.length; i++) {
        var exp = hoists[i];
        if (exp) {
            var needScopeIdWrapper = genScopeId && exp.type === 13 /* NodeTypes.VNODE_CALL */;
            push("const _hoisted_".concat(i + 1, " = ").concat(needScopeIdWrapper ? "".concat(PURE_ANNOTATION, " _withScopeId(() => ") : ""));
            genNode(exp, context);
            if (needScopeIdWrapper) {
                push(")");
            }
            newline();
        }
    }
    context.pure = false;
}
function genImports(importsOptions, context) {
    if (!importsOptions.length) {
        return;
    }
    importsOptions.forEach(function (imports) {
        context.push("import ");
        genNode(imports.exp, context);
        context.push(" from '".concat(imports.path, "'"));
        context.newline();
    });
}
function isText(n) {
    return ((0, shared_1.isString)(n) ||
        n.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ ||
        n.type === 2 /* NodeTypes.TEXT */ ||
        n.type === 5 /* NodeTypes.INTERPOLATION */ ||
        n.type === 8 /* NodeTypes.COMPOUND_EXPRESSION */);
}
function genNodeListAsArray(nodes, context) {
    var multilines = nodes.length > 3 ||
        ((!__BROWSER__ || __DEV__) && nodes.some(function (n) { return (0, shared_1.isArray)(n) || !isText(n); }));
    context.push("[");
    multilines && context.indent();
    genNodeList(nodes, context, multilines);
    multilines && context.deindent();
    context.push("]");
}
function genNodeList(nodes, context, multilines, comma) {
    if (multilines === void 0) { multilines = false; }
    if (comma === void 0) { comma = true; }
    var push = context.push, newline = context.newline;
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if ((0, shared_1.isString)(node)) {
            push(node);
        }
        else if ((0, shared_1.isArray)(node)) {
            genNodeListAsArray(node, context);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            if (multilines) {
                comma && push(',');
                newline();
            }
            else {
                comma && push(', ');
            }
        }
    }
}
function genNode(node, context) {
    if ((0, shared_1.isString)(node)) {
        context.push(node);
        return;
    }
    if ((0, shared_1.isSymbol)(node)) {
        context.push(context.helper(node));
        return;
    }
    switch (node.type) {
        case 1 /* NodeTypes.ELEMENT */:
        case 9 /* NodeTypes.IF */:
        case 11 /* NodeTypes.FOR */:
            __DEV__ &&
                (0, utils_1.assert)(node.codegenNode != null, "Codegen node is missing for element/if/for node. " +
                    "Apply appropriate transforms first.");
            genNode(node.codegenNode, context);
            break;
        case 2 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 4 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 5 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 12 /* NodeTypes.TEXT_CALL */:
            genNode(node.codegenNode, context);
            break;
        case 8 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
        case 3 /* NodeTypes.COMMENT */:
            genComment(node, context);
            break;
        case 13 /* NodeTypes.VNODE_CALL */:
            genVNodeCall(node, context);
            break;
        case 14 /* NodeTypes.JS_CALL_EXPRESSION */:
            genCallExpression(node, context);
            break;
        case 15 /* NodeTypes.JS_OBJECT_EXPRESSION */:
            genObjectExpression(node, context);
            break;
        case 17 /* NodeTypes.JS_ARRAY_EXPRESSION */:
            genArrayExpression(node, context);
            break;
        case 18 /* NodeTypes.JS_FUNCTION_EXPRESSION */:
            genFunctionExpression(node, context);
            break;
        case 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */:
            genConditionalExpression(node, context);
            break;
        case 20 /* NodeTypes.JS_CACHE_EXPRESSION */:
            genCacheExpression(node, context);
            break;
        case 21 /* NodeTypes.JS_BLOCK_STATEMENT */:
            genNodeList(node.body, context, true, false);
            break;
        // SSR only types
        case 22 /* NodeTypes.JS_TEMPLATE_LITERAL */:
            !__BROWSER__ && genTemplateLiteral(node, context);
            break;
        case 23 /* NodeTypes.JS_IF_STATEMENT */:
            !__BROWSER__ && genIfStatement(node, context);
            break;
        case 24 /* NodeTypes.JS_ASSIGNMENT_EXPRESSION */:
            !__BROWSER__ && genAssignmentExpression(node, context);
            break;
        case 25 /* NodeTypes.JS_SEQUENCE_EXPRESSION */:
            !__BROWSER__ && genSequenceExpression(node, context);
            break;
        case 26 /* NodeTypes.JS_RETURN_STATEMENT */:
            !__BROWSER__ && genReturnStatement(node, context);
            break;
        /* istanbul ignore next */
        case 10 /* NodeTypes.IF_BRANCH */:
            // noop
            break;
        default:
            if (__DEV__) {
                (0, utils_1.assert)(false, "unhandled codegen node type: ".concat(node.type));
                // make sure we exhaust all possible types
                var exhaustiveCheck = node;
                return exhaustiveCheck;
            }
    }
}
function genText(node, context) {
    context.push(JSON.stringify(node.content), node);
}
function genExpression(node, context) {
    var content = node.content, isStatic = node.isStatic;
    context.push(isStatic ? JSON.stringify(content) : content, node);
}
function genInterpolation(node, context) {
    var push = context.push, helper = context.helper, pure = context.pure;
    if (pure)
        push(PURE_ANNOTATION);
    push("".concat(helper(runtimeHelpers_1.TO_DISPLAY_STRING), "("));
    genNode(node.content, context);
    push(")");
}
function genCompoundExpression(node, context) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
        if ((0, shared_1.isString)(child)) {
            context.push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genExpressionAsPropertyKey(node, context) {
    var push = context.push;
    if (node.type === 8 /* NodeTypes.COMPOUND_EXPRESSION */) {
        push("[");
        genCompoundExpression(node, context);
        push("]");
    }
    else if (node.isStatic) {
        // only quote keys if necessary
        var text = (0, utils_1.isSimpleIdentifier)(node.content)
            ? node.content
            : JSON.stringify(node.content);
        push(text, node);
    }
    else {
        push("[".concat(node.content, "]"), node);
    }
}
function genComment(node, context) {
    var push = context.push, helper = context.helper, pure = context.pure;
    if (pure) {
        push(PURE_ANNOTATION);
    }
    push("".concat(helper(runtimeHelpers_1.CREATE_COMMENT), "(").concat(JSON.stringify(node.content), ")"), node);
}
function genVNodeCall(node, context) {
    var push = context.push, helper = context.helper, pure = context.pure;
    var tag = node.tag, props = node.props, children = node.children, patchFlag = node.patchFlag, dynamicProps = node.dynamicProps, directives = node.directives, isBlock = node.isBlock, disableTracking = node.disableTracking, isComponent = node.isComponent;
    if (directives) {
        push(helper(runtimeHelpers_1.WITH_DIRECTIVES) + "(");
    }
    if (isBlock) {
        push("(".concat(helper(runtimeHelpers_1.OPEN_BLOCK), "(").concat(disableTracking ? "true" : "", "), "));
    }
    if (pure) {
        push(PURE_ANNOTATION);
    }
    var callHelper = isBlock
        ? (0, utils_1.getVNodeBlockHelper)(context.inSSR, isComponent)
        : (0, utils_1.getVNodeHelper)(context.inSSR, isComponent);
    push(helper(callHelper) + "(", node);
    genNodeList(genNullableArgs([tag, props, children, patchFlag, dynamicProps]), context);
    push(")");
    if (isBlock) {
        push(")");
    }
    if (directives) {
        push(", ");
        genNode(directives, context);
        push(")");
    }
}
function genNullableArgs(args) {
    var i = args.length;
    while (i--) {
        if (args[i] != null)
            break;
    }
    return args.slice(0, i + 1).map(function (arg) { return arg || "null"; });
}
// JavaScript
function genCallExpression(node, context) {
    var push = context.push, helper = context.helper, pure = context.pure;
    var callee = (0, shared_1.isString)(node.callee) ? node.callee : helper(node.callee);
    if (pure) {
        push(PURE_ANNOTATION);
    }
    push(callee + "(", node);
    genNodeList(node.arguments, context);
    push(")");
}
function genObjectExpression(node, context) {
    var push = context.push, indent = context.indent, deindent = context.deindent, newline = context.newline;
    var properties = node.properties;
    if (!properties.length) {
        push("{}", node);
        return;
    }
    var multilines = properties.length > 1 ||
        ((!__BROWSER__ || __DEV__) &&
            properties.some(function (p) { return p.value.type !== 4 /* NodeTypes.SIMPLE_EXPRESSION */; }));
    push(multilines ? "{" : "{ ");
    multilines && indent();
    for (var i = 0; i < properties.length; i++) {
        var _a = properties[i], key = _a.key, value = _a.value;
        // key
        genExpressionAsPropertyKey(key, context);
        push(": ");
        // value
        genNode(value, context);
        if (i < properties.length - 1) {
            // will only reach this if it's multilines
            push(",");
            newline();
        }
    }
    multilines && deindent();
    push(multilines ? "}" : " }");
}
function genArrayExpression(node, context) {
    genNodeListAsArray(node.elements, context);
}
function genFunctionExpression(node, context) {
    var push = context.push, indent = context.indent, deindent = context.deindent;
    var params = node.params, returns = node.returns, body = node.body, newline = node.newline, isSlot = node.isSlot;
    if (isSlot) {
        // wrap slot functions with owner context
        push("_".concat(runtimeHelpers_1.helperNameMap[runtimeHelpers_1.WITH_CTX], "("));
    }
    push("(", node);
    if ((0, shared_1.isArray)(params)) {
        genNodeList(params, context);
    }
    else if (params) {
        genNode(params, context);
    }
    push(") => ");
    if (newline || body) {
        push("{");
        indent();
    }
    if (returns) {
        if (newline) {
            push("return ");
        }
        if ((0, shared_1.isArray)(returns)) {
            genNodeListAsArray(returns, context);
        }
        else {
            genNode(returns, context);
        }
    }
    else if (body) {
        genNode(body, context);
    }
    if (newline || body) {
        deindent();
        push("}");
    }
    if (isSlot) {
        if (__COMPAT__ && node.isNonScopedSlot) {
            push(", undefined, true");
        }
        push(")");
    }
}
function genConditionalExpression(node, context) {
    var test = node.test, consequent = node.consequent, alternate = node.alternate, needNewline = node.newline;
    var push = context.push, indent = context.indent, deindent = context.deindent, newline = context.newline;
    if (test.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
        var needsParens = !(0, utils_1.isSimpleIdentifier)(test.content);
        needsParens && push("(");
        genExpression(test, context);
        needsParens && push(")");
    }
    else {
        push("(");
        genNode(test, context);
        push(")");
    }
    needNewline && indent();
    context.indentLevel++;
    needNewline || push(" ");
    push("? ");
    genNode(consequent, context);
    context.indentLevel--;
    needNewline && newline();
    needNewline || push(" ");
    push(": ");
    var isNested = alternate.type === 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */;
    if (!isNested) {
        context.indentLevel++;
    }
    genNode(alternate, context);
    if (!isNested) {
        context.indentLevel--;
    }
    needNewline && deindent(true /* without newline */);
}
function genCacheExpression(node, context) {
    var push = context.push, helper = context.helper, indent = context.indent, deindent = context.deindent, newline = context.newline;
    push("_cache[".concat(node.index, "] || ("));
    if (node.isVNode) {
        indent();
        push("".concat(helper(runtimeHelpers_1.SET_BLOCK_TRACKING), "(-1),"));
        newline();
    }
    push("_cache[".concat(node.index, "] = "));
    genNode(node.value, context);
    if (node.isVNode) {
        push(",");
        newline();
        push("".concat(helper(runtimeHelpers_1.SET_BLOCK_TRACKING), "(1),"));
        newline();
        push("_cache[".concat(node.index, "]"));
        deindent();
    }
    push(")");
}
function genTemplateLiteral(node, context) {
    var push = context.push, indent = context.indent, deindent = context.deindent;
    push('`');
    var l = node.elements.length;
    var multilines = l > 3;
    for (var i = 0; i < l; i++) {
        var e = node.elements[i];
        if ((0, shared_1.isString)(e)) {
            push(e.replace(/(`|\$|\\)/g, '\\$1'));
        }
        else {
            push('${');
            if (multilines)
                indent();
            genNode(e, context);
            if (multilines)
                deindent();
            push('}');
        }
    }
    push('`');
}
function genIfStatement(node, context) {
    var push = context.push, indent = context.indent, deindent = context.deindent;
    var test = node.test, consequent = node.consequent, alternate = node.alternate;
    push("if (");
    genNode(test, context);
    push(") {");
    indent();
    genNode(consequent, context);
    deindent();
    push("}");
    if (alternate) {
        push(" else ");
        if (alternate.type === 23 /* NodeTypes.JS_IF_STATEMENT */) {
            genIfStatement(alternate, context);
        }
        else {
            push("{");
            indent();
            genNode(alternate, context);
            deindent();
            push("}");
        }
    }
}
function genAssignmentExpression(node, context) {
    genNode(node.left, context);
    context.push(" = ");
    genNode(node.right, context);
}
function genSequenceExpression(node, context) {
    context.push("(");
    genNodeList(node.expressions, context);
    context.push(")");
}
function genReturnStatement(_a, context) {
    var returns = _a.returns;
    context.push("return ");
    if ((0, shared_1.isArray)(returns)) {
        genNodeListAsArray(returns, context);
    }
    else {
        genNode(returns, context);
    }
}
