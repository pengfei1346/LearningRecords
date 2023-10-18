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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnDeprecation = exports.checkCompatEnabled = exports.isCompatEnabled = void 0;
var deprecationData = (_a = {},
    _a["COMPILER_IS_ON_ELEMENT" /* CompilerDeprecationTypes.COMPILER_IS_ON_ELEMENT */] = {
        message: "Platform-native elements with \"is\" prop will no longer be " +
            "treated as components in Vue 3 unless the \"is\" value is explicitly " +
            "prefixed with \"vue:\".",
        link: "https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html"
    },
    _a["COMPILER_V_BIND_SYNC" /* CompilerDeprecationTypes.COMPILER_V_BIND_SYNC */] = {
        message: function (key) {
            return ".sync modifier for v-bind has been removed. Use v-model with " +
                "argument instead. `v-bind:".concat(key, ".sync` should be changed to ") +
                "`v-model:".concat(key, "`.");
        },
        link: "https://v3-migration.vuejs.org/breaking-changes/v-model.html"
    },
    _a["COMPILER_V_BIND_PROP" /* CompilerDeprecationTypes.COMPILER_V_BIND_PROP */] = {
        message: ".prop modifier for v-bind has been removed and no longer necessary. " +
            "Vue 3 will automatically set a binding as DOM property when appropriate."
    },
    _a["COMPILER_V_BIND_OBJECT_ORDER" /* CompilerDeprecationTypes.COMPILER_V_BIND_OBJECT_ORDER */] = {
        message: "v-bind=\"obj\" usage is now order sensitive and behaves like JavaScript " +
            "object spread: it will now overwrite an existing non-mergeable attribute " +
            "that appears before v-bind in the case of conflict. " +
            "To retain 2.x behavior, move v-bind to make it the first attribute. " +
            "You can also suppress this warning if the usage is intended.",
        link: "https://v3-migration.vuejs.org/breaking-changes/v-bind.html"
    },
    _a["COMPILER_V_ON_NATIVE" /* CompilerDeprecationTypes.COMPILER_V_ON_NATIVE */] = {
        message: ".native modifier for v-on has been removed as is no longer necessary.",
        link: "https://v3-migration.vuejs.org/breaking-changes/v-on-native-modifier-removed.html"
    },
    _a["COMPILER_V_IF_V_FOR_PRECEDENCE" /* CompilerDeprecationTypes.COMPILER_V_IF_V_FOR_PRECEDENCE */] = {
        message: "v-if / v-for precedence when used on the same element has changed " +
            "in Vue 3: v-if now takes higher precedence and will no longer have " +
            "access to v-for scope variables. It is best to avoid the ambiguity " +
            "with <template> tags or use a computed property that filters v-for " +
            "data source.",
        link: "https://v3-migration.vuejs.org/breaking-changes/v-if-v-for.html"
    },
    _a["COMPILER_NATIVE_TEMPLATE" /* CompilerDeprecationTypes.COMPILER_NATIVE_TEMPLATE */] = {
        message: "<template> with no special directives will render as a native template " +
            "element instead of its inner content in Vue 3."
    },
    _a["COMPILER_INLINE_TEMPLATE" /* CompilerDeprecationTypes.COMPILER_INLINE_TEMPLATE */] = {
        message: "\"inline-template\" has been removed in Vue 3.",
        link: "https://v3-migration.vuejs.org/breaking-changes/inline-template-attribute.html"
    },
    _a["COMPILER_FILTER" /* CompilerDeprecationTypes.COMPILER_FILTERS */] = {
        message: "filters have been removed in Vue 3. " +
            "The \"|\" symbol will be treated as native JavaScript bitwise OR operator. " +
            "Use method calls or computed properties instead.",
        link: "https://v3-migration.vuejs.org/breaking-changes/filters.html"
    },
    _a);
function getCompatValue(key, context) {
    var config = context.options
        ? context.options.compatConfig
        : context.compatConfig;
    var value = config && config[key];
    if (key === 'MODE') {
        return value || 3; // compiler defaults to v3 behavior
    }
    else {
        return value;
    }
}
function isCompatEnabled(key, context) {
    var mode = getCompatValue('MODE', context);
    var value = getCompatValue(key, context);
    // in v3 mode, only enable if explicitly set to true
    // otherwise enable for any non-false value
    return mode === 3 ? value === true : value !== false;
}
exports.isCompatEnabled = isCompatEnabled;
function checkCompatEnabled(key, context, loc) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    var enabled = isCompatEnabled(key, context);
    if (__DEV__ && enabled) {
        warnDeprecation.apply(void 0, __spreadArray([key, context, loc], args, false));
    }
    return enabled;
}
exports.checkCompatEnabled = checkCompatEnabled;
function warnDeprecation(key, context, loc) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    var val = getCompatValue(key, context);
    if (val === 'suppress-warning') {
        return;
    }
    var _a = deprecationData[key], message = _a.message, link = _a.link;
    var msg = "(deprecation ".concat(key, ") ").concat(typeof message === 'function' ? message.apply(void 0, args) : message).concat(link ? "\n  Details: ".concat(link) : "");
    var err = new SyntaxError(msg);
    err.code = key;
    if (loc)
        err.loc = loc;
    context.onWarn(err);
}
exports.warnDeprecation = warnDeprecation;
