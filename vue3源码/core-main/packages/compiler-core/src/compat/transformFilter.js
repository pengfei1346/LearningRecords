"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFilter = void 0;
var runtimeHelpers_1 = require("../runtimeHelpers");
var compiler_core_1 = require("@vue/compiler-core");
var compatConfig_1 = require("./compatConfig");
var validDivisionCharRE = /[\w).+\-_$\]]/;
var transformFilter = function (node, context) {
    if (!(0, compatConfig_1.isCompatEnabled)("COMPILER_FILTER" /* CompilerDeprecationTypes.COMPILER_FILTERS */, context)) {
        return;
    }
    if (node.type === compiler_core_1.NodeTypes.INTERPOLATION) {
        // filter rewrite is applied before expression transform so only
        // simple expressions are possible at this stage
        rewriteFilter(node.content, context);
    }
    if (node.type === compiler_core_1.NodeTypes.ELEMENT) {
        node.props.forEach(function (prop) {
            if (prop.type === compiler_core_1.NodeTypes.DIRECTIVE &&
                prop.name !== 'for' &&
                prop.exp) {
                rewriteFilter(prop.exp, context);
            }
        });
    }
};
exports.transformFilter = transformFilter;
function rewriteFilter(node, context) {
    if (node.type === compiler_core_1.NodeTypes.SIMPLE_EXPRESSION) {
        parseFilter(node, context);
    }
    else {
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (typeof child !== 'object')
                continue;
            if (child.type === compiler_core_1.NodeTypes.SIMPLE_EXPRESSION) {
                parseFilter(child, context);
            }
            else if (child.type === compiler_core_1.NodeTypes.COMPOUND_EXPRESSION) {
                rewriteFilter(node, context);
            }
            else if (child.type === compiler_core_1.NodeTypes.INTERPOLATION) {
                rewriteFilter(child.content, context);
            }
        }
    }
}
function parseFilter(node, context) {
    var exp = node.content;
    var inSingle = false;
    var inDouble = false;
    var inTemplateString = false;
    var inRegex = false;
    var curly = 0;
    var square = 0;
    var paren = 0;
    var lastFilterIndex = 0;
    var c, prev, i, expression, filters = [];
    for (i = 0; i < exp.length; i++) {
        prev = c;
        c = exp.charCodeAt(i);
        if (inSingle) {
            if (c === 0x27 && prev !== 0x5c)
                inSingle = false;
        }
        else if (inDouble) {
            if (c === 0x22 && prev !== 0x5c)
                inDouble = false;
        }
        else if (inTemplateString) {
            if (c === 0x60 && prev !== 0x5c)
                inTemplateString = false;
        }
        else if (inRegex) {
            if (c === 0x2f && prev !== 0x5c)
                inRegex = false;
        }
        else if (c === 0x7c && // pipe
            exp.charCodeAt(i + 1) !== 0x7c &&
            exp.charCodeAt(i - 1) !== 0x7c &&
            !curly &&
            !square &&
            !paren) {
            if (expression === undefined) {
                // first filter, end of expression
                lastFilterIndex = i + 1;
                expression = exp.slice(0, i).trim();
            }
            else {
                pushFilter();
            }
        }
        else {
            switch (c) {
                case 0x22:
                    inDouble = true;
                    break; // "
                case 0x27:
                    inSingle = true;
                    break; // '
                case 0x60:
                    inTemplateString = true;
                    break; // `
                case 0x28:
                    paren++;
                    break; // (
                case 0x29:
                    paren--;
                    break; // )
                case 0x5b:
                    square++;
                    break; // [
                case 0x5d:
                    square--;
                    break; // ]
                case 0x7b:
                    curly++;
                    break; // {
                case 0x7d:
                    curly--;
                    break; // }
            }
            if (c === 0x2f) {
                // /
                var j = i - 1;
                var p 
                // find first non-whitespace prev char
                = void 0;
                // find first non-whitespace prev char
                for (; j >= 0; j--) {
                    p = exp.charAt(j);
                    if (p !== ' ')
                        break;
                }
                if (!p || !validDivisionCharRE.test(p)) {
                    inRegex = true;
                }
            }
        }
    }
    if (expression === undefined) {
        expression = exp.slice(0, i).trim();
    }
    else if (lastFilterIndex !== 0) {
        pushFilter();
    }
    function pushFilter() {
        filters.push(exp.slice(lastFilterIndex, i).trim());
        lastFilterIndex = i + 1;
    }
    if (filters.length) {
        __DEV__ &&
            (0, compatConfig_1.warnDeprecation)("COMPILER_FILTER" /* CompilerDeprecationTypes.COMPILER_FILTERS */, context, node.loc);
        for (i = 0; i < filters.length; i++) {
            expression = wrapFilter(expression, filters[i], context);
        }
        node.content = expression;
    }
}
function wrapFilter(exp, filter, context) {
    context.helper(runtimeHelpers_1.RESOLVE_FILTER);
    var i = filter.indexOf('(');
    if (i < 0) {
        context.filters.add(filter);
        return "".concat((0, compiler_core_1.toValidAssetId)(filter, 'filter'), "(").concat(exp, ")");
    }
    else {
        var name_1 = filter.slice(0, i);
        var args = filter.slice(i + 1);
        context.filters.add(name_1);
        return "".concat((0, compiler_core_1.toValidAssetId)(name_1, 'filter'), "(").concat(exp).concat(args !== ')' ? ',' + args : args);
    }
}
