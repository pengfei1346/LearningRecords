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
exports.baseCompile = exports.getBaseTransformPreset = void 0;
var parse_1 = require("./parse");
var transform_1 = require("./transform");
var codegen_1 = require("./codegen");
var shared_1 = require("@vue/shared");
var vIf_1 = require("./transforms/vIf");
var vFor_1 = require("./transforms/vFor");
var transformExpression_1 = require("./transforms/transformExpression");
var transformSlotOutlet_1 = require("./transforms/transformSlotOutlet");
var transformElement_1 = require("./transforms/transformElement");
var vOn_1 = require("./transforms/vOn");
var vBind_1 = require("./transforms/vBind");
var vSlot_1 = require("./transforms/vSlot");
var transformText_1 = require("./transforms/transformText");
var vOnce_1 = require("./transforms/vOnce");
var vModel_1 = require("./transforms/vModel");
var transformFilter_1 = require("./compat/transformFilter");
var errors_1 = require("./errors");
var vMemo_1 = require("./transforms/vMemo");
function getBaseTransformPreset(prefixIdentifiers) {
    return [
        __spreadArray(__spreadArray(__spreadArray([
            vOnce_1.transformOnce,
            vIf_1.transformIf,
            vMemo_1.transformMemo,
            vFor_1.transformFor
        ], (__COMPAT__ ? [transformFilter_1.transformFilter] : []), true), (!__BROWSER__ && prefixIdentifiers
            ? [
                // order is important
                vSlot_1.trackVForSlotScopes,
                transformExpression_1.transformExpression
            ]
            : __BROWSER__ && __DEV__
                ? [transformExpression_1.transformExpression]
                : []), true), [
            transformSlotOutlet_1.transformSlotOutlet,
            transformElement_1.transformElement,
            vSlot_1.trackSlotScopes,
            transformText_1.transformText
        ], false),
        {
            on: vOn_1.transformOn,
            bind: vBind_1.transformBind,
            model: vModel_1.transformModel
        }
    ];
}
exports.getBaseTransformPreset = getBaseTransformPreset;
// we name it `baseCompile` so that higher order compilers like
// @vue/compiler-dom can export `compile` while re-exporting everything else.
function baseCompile(template, options) {
    if (options === void 0) { options = {}; }
    var onError = options.onError || errors_1.defaultOnError;
    var isModuleMode = options.mode === 'module';
    /* istanbul ignore if */
    if (__BROWSER__) {
        if (options.prefixIdentifiers === true) {
            onError((0, errors_1.createCompilerError)(46 /* ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED */));
        }
        else if (isModuleMode) {
            onError((0, errors_1.createCompilerError)(47 /* ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED */));
        }
    }
    var prefixIdentifiers = !__BROWSER__ && (options.prefixIdentifiers === true || isModuleMode);
    if (!prefixIdentifiers && options.cacheHandlers) {
        onError((0, errors_1.createCompilerError)(48 /* ErrorCodes.X_CACHE_HANDLER_NOT_SUPPORTED */));
    }
    if (options.scopeId && !isModuleMode) {
        onError((0, errors_1.createCompilerError)(49 /* ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED */));
    }
    var ast = (0, shared_1.isString)(template) ? (0, parse_1.baseParse)(template, options) : template;
    var _a = getBaseTransformPreset(prefixIdentifiers), nodeTransforms = _a[0], directiveTransforms = _a[1];
    if (!__BROWSER__ && options.isTS) {
        var expressionPlugins = options.expressionPlugins;
        if (!expressionPlugins || !expressionPlugins.includes('typescript')) {
            options.expressionPlugins = __spreadArray(__spreadArray([], (expressionPlugins || []), true), ['typescript'], false);
        }
    }
    (0, transform_1.transform)(ast, (0, shared_1.extend)({}, options, {
        prefixIdentifiers: prefixIdentifiers,
        nodeTransforms: __spreadArray(__spreadArray([], nodeTransforms, true), (options.nodeTransforms || []) // user transforms
        , true),
        directiveTransforms: (0, shared_1.extend)({}, directiveTransforms, options.directiveTransforms || {} // user transforms
        )
    }));
    return (0, codegen_1.generate)(ast, (0, shared_1.extend)({}, options, {
        prefixIdentifiers: prefixIdentifiers
    }));
}
exports.baseCompile = baseCompile;
