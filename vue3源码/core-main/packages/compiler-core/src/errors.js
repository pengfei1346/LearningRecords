"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMessages = exports.createCompilerError = exports.defaultOnWarn = exports.defaultOnError = void 0;
function defaultOnError(error) {
    throw error;
}
exports.defaultOnError = defaultOnError;
function defaultOnWarn(msg) {
    __DEV__ && console.warn("[Vue warn] ".concat(msg.message));
}
exports.defaultOnWarn = defaultOnWarn;
function createCompilerError(code, loc, messages, additionalMessage) {
    var msg = __DEV__ || !__BROWSER__
        ? (messages || exports.errorMessages)[code] + (additionalMessage || "")
        : code;
    var error = new SyntaxError(String(msg));
    error.code = code;
    error.loc = loc;
    return error;
}
exports.createCompilerError = createCompilerError;
exports.errorMessages = (_a = {},
    // parse errors
    _a[0 /* ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT */] = 'Illegal comment.',
    _a[1 /* ErrorCodes.CDATA_IN_HTML_CONTENT */] = 'CDATA section is allowed only in XML context.',
    _a[2 /* ErrorCodes.DUPLICATE_ATTRIBUTE */] = 'Duplicate attribute.',
    _a[3 /* ErrorCodes.END_TAG_WITH_ATTRIBUTES */] = 'End tag cannot have attributes.',
    _a[4 /* ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS */] = "Illegal '/' in tags.",
    _a[5 /* ErrorCodes.EOF_BEFORE_TAG_NAME */] = 'Unexpected EOF in tag.',
    _a[6 /* ErrorCodes.EOF_IN_CDATA */] = 'Unexpected EOF in CDATA section.',
    _a[7 /* ErrorCodes.EOF_IN_COMMENT */] = 'Unexpected EOF in comment.',
    _a[8 /* ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT */] = 'Unexpected EOF in script.',
    _a[9 /* ErrorCodes.EOF_IN_TAG */] = 'Unexpected EOF in tag.',
    _a[10 /* ErrorCodes.INCORRECTLY_CLOSED_COMMENT */] = 'Incorrectly closed comment.',
    _a[11 /* ErrorCodes.INCORRECTLY_OPENED_COMMENT */] = 'Incorrectly opened comment.',
    _a[12 /* ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME */] = "Illegal tag name. Use '&lt;' to print '<'.",
    _a[13 /* ErrorCodes.MISSING_ATTRIBUTE_VALUE */] = 'Attribute value was expected.',
    _a[14 /* ErrorCodes.MISSING_END_TAG_NAME */] = 'End tag name was expected.',
    _a[15 /* ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES */] = 'Whitespace was expected.',
    _a[16 /* ErrorCodes.NESTED_COMMENT */] = "Unexpected '<!--' in comment.",
    _a[17 /* ErrorCodes.UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME */] = 'Attribute name cannot contain U+0022 ("), U+0027 (\'), and U+003C (<).',
    _a[18 /* ErrorCodes.UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE */] = 'Unquoted attribute value cannot contain U+0022 ("), U+0027 (\'), U+003C (<), U+003D (=), and U+0060 (`).',
    _a[19 /* ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME */] = "Attribute name cannot start with '='.",
    _a[21 /* ErrorCodes.UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME */] = "'<?' is allowed only in XML context.",
    _a[20 /* ErrorCodes.UNEXPECTED_NULL_CHARACTER */] = "Unexpected null character.",
    _a[22 /* ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG */] = "Illegal '/' in tags.",
    // Vue-specific parse errors
    _a[23 /* ErrorCodes.X_INVALID_END_TAG */] = 'Invalid end tag.',
    _a[24 /* ErrorCodes.X_MISSING_END_TAG */] = 'Element is missing end tag.',
    _a[25 /* ErrorCodes.X_MISSING_INTERPOLATION_END */] = 'Interpolation end sign was not found.',
    _a[27 /* ErrorCodes.X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END */] = 'End bracket for dynamic directive argument was not found. ' +
        'Note that dynamic directive argument cannot contain spaces.',
    _a[26 /* ErrorCodes.X_MISSING_DIRECTIVE_NAME */] = 'Legal directive name was expected.',
    // transform errors
    _a[28 /* ErrorCodes.X_V_IF_NO_EXPRESSION */] = "v-if/v-else-if is missing expression.",
    _a[29 /* ErrorCodes.X_V_IF_SAME_KEY */] = "v-if/else branches must use unique keys.",
    _a[30 /* ErrorCodes.X_V_ELSE_NO_ADJACENT_IF */] = "v-else/v-else-if has no adjacent v-if or v-else-if.",
    _a[31 /* ErrorCodes.X_V_FOR_NO_EXPRESSION */] = "v-for is missing expression.",
    _a[32 /* ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION */] = "v-for has invalid expression.",
    _a[33 /* ErrorCodes.X_V_FOR_TEMPLATE_KEY_PLACEMENT */] = "<template v-for> key should be placed on the <template> tag.",
    _a[34 /* ErrorCodes.X_V_BIND_NO_EXPRESSION */] = "v-bind is missing expression.",
    _a[35 /* ErrorCodes.X_V_ON_NO_EXPRESSION */] = "v-on is missing expression.",
    _a[36 /* ErrorCodes.X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET */] = "Unexpected custom directive on <slot> outlet.",
    _a[37 /* ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE */] = "Mixed v-slot usage on both the component and nested <template>." +
        "When there are multiple named slots, all slots should use <template> " +
        "syntax to avoid scope ambiguity.",
    _a[38 /* ErrorCodes.X_V_SLOT_DUPLICATE_SLOT_NAMES */] = "Duplicate slot names found. ",
    _a[39 /* ErrorCodes.X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN */] = "Extraneous children found when component already has explicitly named " +
        "default slot. These children will be ignored.",
    _a[40 /* ErrorCodes.X_V_SLOT_MISPLACED */] = "v-slot can only be used on components or <template> tags.",
    _a[41 /* ErrorCodes.X_V_MODEL_NO_EXPRESSION */] = "v-model is missing expression.",
    _a[42 /* ErrorCodes.X_V_MODEL_MALFORMED_EXPRESSION */] = "v-model value must be a valid JavaScript member expression.",
    _a[43 /* ErrorCodes.X_V_MODEL_ON_SCOPE_VARIABLE */] = "v-model cannot be used on v-for or v-slot scope variables because they are not writable.",
    _a[44 /* ErrorCodes.X_INVALID_EXPRESSION */] = "Error parsing JavaScript expression: ",
    _a[45 /* ErrorCodes.X_KEEP_ALIVE_INVALID_CHILDREN */] = "<KeepAlive> expects exactly one child component.",
    // generic errors
    _a[46 /* ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED */] = "\"prefixIdentifiers\" option is not supported in this build of compiler.",
    _a[47 /* ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED */] = "ES module mode is not supported in this build of compiler.",
    _a[48 /* ErrorCodes.X_CACHE_HANDLER_NOT_SUPPORTED */] = "\"cacheHandlers\" option is only supported when the \"prefixIdentifiers\" option is enabled.",
    _a[49 /* ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED */] = "\"scopeId\" option is only supported in module mode.",
    // just to fulfill types
    _a[50 /* ErrorCodes.__EXTEND_POINT__ */] = "",
    _a);
