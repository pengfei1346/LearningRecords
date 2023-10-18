"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRuntimeHelpers = exports.helperNameMap = exports.IS_MEMO_SAME = exports.WITH_MEMO = exports.IS_REF = exports.UNREF = exports.WITH_CTX = exports.POP_SCOPE_ID = exports.PUSH_SCOPE_ID = exports.SET_BLOCK_TRACKING = exports.TO_HANDLER_KEY = exports.CAPITALIZE = exports.CAMELIZE = exports.TO_HANDLERS = exports.GUARD_REACTIVE_PROPS = exports.NORMALIZE_PROPS = exports.NORMALIZE_STYLE = exports.NORMALIZE_CLASS = exports.MERGE_PROPS = exports.TO_DISPLAY_STRING = exports.CREATE_SLOTS = exports.RENDER_SLOT = exports.RENDER_LIST = exports.WITH_DIRECTIVES = exports.RESOLVE_FILTER = exports.RESOLVE_DIRECTIVE = exports.RESOLVE_DYNAMIC_COMPONENT = exports.RESOLVE_COMPONENT = exports.CREATE_STATIC = exports.CREATE_TEXT = exports.CREATE_COMMENT = exports.CREATE_ELEMENT_VNODE = exports.CREATE_VNODE = exports.CREATE_ELEMENT_BLOCK = exports.CREATE_BLOCK = exports.OPEN_BLOCK = exports.BASE_TRANSITION = exports.KEEP_ALIVE = exports.SUSPENSE = exports.TELEPORT = exports.FRAGMENT = void 0;
exports.FRAGMENT = Symbol(__DEV__ ? "Fragment" : "");
exports.TELEPORT = Symbol(__DEV__ ? "Teleport" : "");
exports.SUSPENSE = Symbol(__DEV__ ? "Suspense" : "");
exports.KEEP_ALIVE = Symbol(__DEV__ ? "KeepAlive" : "");
exports.BASE_TRANSITION = Symbol(__DEV__ ? "BaseTransition" : "");
exports.OPEN_BLOCK = Symbol(__DEV__ ? "openBlock" : "");
exports.CREATE_BLOCK = Symbol(__DEV__ ? "createBlock" : "");
exports.CREATE_ELEMENT_BLOCK = Symbol(__DEV__ ? "createElementBlock" : "");
exports.CREATE_VNODE = Symbol(__DEV__ ? "createVNode" : "");
exports.CREATE_ELEMENT_VNODE = Symbol(__DEV__ ? "createElementVNode" : "");
exports.CREATE_COMMENT = Symbol(__DEV__ ? "createCommentVNode" : "");
exports.CREATE_TEXT = Symbol(__DEV__ ? "createTextVNode" : "");
exports.CREATE_STATIC = Symbol(__DEV__ ? "createStaticVNode" : "");
exports.RESOLVE_COMPONENT = Symbol(__DEV__ ? "resolveComponent" : "");
exports.RESOLVE_DYNAMIC_COMPONENT = Symbol(__DEV__ ? "resolveDynamicComponent" : "");
exports.RESOLVE_DIRECTIVE = Symbol(__DEV__ ? "resolveDirective" : "");
exports.RESOLVE_FILTER = Symbol(__DEV__ ? "resolveFilter" : "");
exports.WITH_DIRECTIVES = Symbol(__DEV__ ? "withDirectives" : "");
exports.RENDER_LIST = Symbol(__DEV__ ? "renderList" : "");
exports.RENDER_SLOT = Symbol(__DEV__ ? "renderSlot" : "");
exports.CREATE_SLOTS = Symbol(__DEV__ ? "createSlots" : "");
exports.TO_DISPLAY_STRING = Symbol(__DEV__ ? "toDisplayString" : "");
exports.MERGE_PROPS = Symbol(__DEV__ ? "mergeProps" : "");
exports.NORMALIZE_CLASS = Symbol(__DEV__ ? "normalizeClass" : "");
exports.NORMALIZE_STYLE = Symbol(__DEV__ ? "normalizeStyle" : "");
exports.NORMALIZE_PROPS = Symbol(__DEV__ ? "normalizeProps" : "");
exports.GUARD_REACTIVE_PROPS = Symbol(__DEV__ ? "guardReactiveProps" : "");
exports.TO_HANDLERS = Symbol(__DEV__ ? "toHandlers" : "");
exports.CAMELIZE = Symbol(__DEV__ ? "camelize" : "");
exports.CAPITALIZE = Symbol(__DEV__ ? "capitalize" : "");
exports.TO_HANDLER_KEY = Symbol(__DEV__ ? "toHandlerKey" : "");
exports.SET_BLOCK_TRACKING = Symbol(__DEV__ ? "setBlockTracking" : "");
exports.PUSH_SCOPE_ID = Symbol(__DEV__ ? "pushScopeId" : "");
exports.POP_SCOPE_ID = Symbol(__DEV__ ? "popScopeId" : "");
exports.WITH_CTX = Symbol(__DEV__ ? "withCtx" : "");
exports.UNREF = Symbol(__DEV__ ? "unref" : "");
exports.IS_REF = Symbol(__DEV__ ? "isRef" : "");
exports.WITH_MEMO = Symbol(__DEV__ ? "withMemo" : "");
exports.IS_MEMO_SAME = Symbol(__DEV__ ? "isMemoSame" : "");
// Name mapping for runtime helpers that need to be imported from 'vue' in
// generated code. Make sure these are correctly exported in the runtime!
exports.helperNameMap = (_a = {},
    _a[exports.FRAGMENT] = "Fragment",
    _a[exports.TELEPORT] = "Teleport",
    _a[exports.SUSPENSE] = "Suspense",
    _a[exports.KEEP_ALIVE] = "KeepAlive",
    _a[exports.BASE_TRANSITION] = "BaseTransition",
    _a[exports.OPEN_BLOCK] = "openBlock",
    _a[exports.CREATE_BLOCK] = "createBlock",
    _a[exports.CREATE_ELEMENT_BLOCK] = "createElementBlock",
    _a[exports.CREATE_VNODE] = "createVNode",
    _a[exports.CREATE_ELEMENT_VNODE] = "createElementVNode",
    _a[exports.CREATE_COMMENT] = "createCommentVNode",
    _a[exports.CREATE_TEXT] = "createTextVNode",
    _a[exports.CREATE_STATIC] = "createStaticVNode",
    _a[exports.RESOLVE_COMPONENT] = "resolveComponent",
    _a[exports.RESOLVE_DYNAMIC_COMPONENT] = "resolveDynamicComponent",
    _a[exports.RESOLVE_DIRECTIVE] = "resolveDirective",
    _a[exports.RESOLVE_FILTER] = "resolveFilter",
    _a[exports.WITH_DIRECTIVES] = "withDirectives",
    _a[exports.RENDER_LIST] = "renderList",
    _a[exports.RENDER_SLOT] = "renderSlot",
    _a[exports.CREATE_SLOTS] = "createSlots",
    _a[exports.TO_DISPLAY_STRING] = "toDisplayString",
    _a[exports.MERGE_PROPS] = "mergeProps",
    _a[exports.NORMALIZE_CLASS] = "normalizeClass",
    _a[exports.NORMALIZE_STYLE] = "normalizeStyle",
    _a[exports.NORMALIZE_PROPS] = "normalizeProps",
    _a[exports.GUARD_REACTIVE_PROPS] = "guardReactiveProps",
    _a[exports.TO_HANDLERS] = "toHandlers",
    _a[exports.CAMELIZE] = "camelize",
    _a[exports.CAPITALIZE] = "capitalize",
    _a[exports.TO_HANDLER_KEY] = "toHandlerKey",
    _a[exports.SET_BLOCK_TRACKING] = "setBlockTracking",
    _a[exports.PUSH_SCOPE_ID] = "pushScopeId",
    _a[exports.POP_SCOPE_ID] = "popScopeId",
    _a[exports.WITH_CTX] = "withCtx",
    _a[exports.UNREF] = "unref",
    _a[exports.IS_REF] = "isRef",
    _a[exports.WITH_MEMO] = "withMemo",
    _a[exports.IS_MEMO_SAME] = "isMemoSame",
    _a);
function registerRuntimeHelpers(helpers) {
    Object.getOwnPropertySymbols(helpers).forEach(function (s) {
        exports.helperNameMap[s] = helpers[s];
    });
}
exports.registerRuntimeHelpers = registerRuntimeHelpers;
