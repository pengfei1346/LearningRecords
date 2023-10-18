"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseParse = exports.defaultParserOptions = void 0;
var shared_1 = require("@vue/shared");
var errors_1 = require("./errors");
var utils_1 = require("./utils");
var ast_1 = require("./ast");
var compatConfig_1 = require("./compat/compatConfig");
// The default decoder only provides escapes for characters reserved as part of
// the template syntax, and is only used if the custom renderer did not provide
// a platform-specific decoder.
var decodeRE = /&(gt|lt|amp|apos|quot);/g;
var decodeMap = {
    gt: '>',
    lt: '<',
    amp: '&',
    apos: "'",
    quot: '"'
};
exports.defaultParserOptions = {
    delimiters: ["{{", "}}"],
    getNamespace: function () { return 0 /* Namespaces.HTML */; },
    getTextMode: function () { return 0 /* TextModes.DATA */; },
    isVoidTag: shared_1.NO,
    isPreTag: shared_1.NO,
    isCustomElement: shared_1.NO,
    decodeEntities: function (rawText) {
        return rawText.replace(decodeRE, function (_, p1) { return decodeMap[p1]; });
    },
    onError: errors_1.defaultOnError,
    onWarn: errors_1.defaultOnWarn,
    comments: __DEV__
};
function baseParse(content, options) {
    if (options === void 0) { options = {}; }
    var context = createParserContext(content, options);
    var start = getCursor(context);
    return (0, ast_1.createRoot)(parseChildren(context, 0 /* TextModes.DATA */, []), getSelection(context, start));
}
exports.baseParse = baseParse;
function createParserContext(content, rawOptions) {
    var options = (0, shared_1.extend)({}, exports.defaultParserOptions);
    var key;
    for (key in rawOptions) {
        // @ts-ignore
        options[key] =
            rawOptions[key] === undefined
                ? exports.defaultParserOptions[key]
                : rawOptions[key];
    }
    return {
        options: options,
        column: 1,
        line: 1,
        offset: 0,
        originalSource: content,
        source: content,
        inPre: false,
        inVPre: false,
        onWarn: options.onWarn
    };
}
function parseChildren(context, mode, ancestors) {
    var parent = last(ancestors);
    var ns = parent ? parent.ns : 0 /* Namespaces.HTML */;
    var nodes = [];
    while (!isEnd(context, mode, ancestors)) {
        __TEST__ && (0, utils_1.assert)(context.source.length > 0);
        var s = context.source;
        var node = undefined;
        if (mode === 0 /* TextModes.DATA */ || mode === 1 /* TextModes.RCDATA */) {
            if (!context.inVPre && startsWith(s, context.options.delimiters[0])) {
                // '{{'
                node = parseInterpolation(context, mode);
            }
            else if (mode === 0 /* TextModes.DATA */ && s[0] === '<') {
                // https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
                if (s.length === 1) {
                    emitError(context, 5 /* ErrorCodes.EOF_BEFORE_TAG_NAME */, 1);
                }
                else if (s[1] === '!') {
                    // https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
                    if (startsWith(s, '<!--')) {
                        node = parseComment(context);
                    }
                    else if (startsWith(s, '<!DOCTYPE')) {
                        // Ignore DOCTYPE by a limitation.
                        node = parseBogusComment(context);
                    }
                    else if (startsWith(s, '<![CDATA[')) {
                        if (ns !== 0 /* Namespaces.HTML */) {
                            node = parseCDATA(context, ancestors);
                        }
                        else {
                            emitError(context, 1 /* ErrorCodes.CDATA_IN_HTML_CONTENT */);
                            node = parseBogusComment(context);
                        }
                    }
                    else {
                        emitError(context, 11 /* ErrorCodes.INCORRECTLY_OPENED_COMMENT */);
                        node = parseBogusComment(context);
                    }
                }
                else if (s[1] === '/') {
                    // https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
                    if (s.length === 2) {
                        emitError(context, 5 /* ErrorCodes.EOF_BEFORE_TAG_NAME */, 2);
                    }
                    else if (s[2] === '>') {
                        emitError(context, 14 /* ErrorCodes.MISSING_END_TAG_NAME */, 2);
                        advanceBy(context, 3);
                        continue;
                    }
                    else if (/[a-z]/i.test(s[2])) {
                        emitError(context, 23 /* ErrorCodes.X_INVALID_END_TAG */);
                        parseTag(context, 1 /* TagType.End */, parent);
                        continue;
                    }
                    else {
                        emitError(context, 12 /* ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME */, 2);
                        node = parseBogusComment(context);
                    }
                }
                else if (/[a-z]/i.test(s[1])) {
                    node = parseElement(context, ancestors);
                    // 2.x <template> with no directive compat
                    if (__COMPAT__ &&
                        (0, compatConfig_1.isCompatEnabled)("COMPILER_NATIVE_TEMPLATE" /* CompilerDeprecationTypes.COMPILER_NATIVE_TEMPLATE */, context) &&
                        node &&
                        node.tag === 'template' &&
                        !node.props.some(function (p) {
                            return p.type === 7 /* NodeTypes.DIRECTIVE */ &&
                                isSpecialTemplateDirective(p.name);
                        })) {
                        __DEV__ &&
                            (0, compatConfig_1.warnDeprecation)("COMPILER_NATIVE_TEMPLATE" /* CompilerDeprecationTypes.COMPILER_NATIVE_TEMPLATE */, context, node.loc);
                        node = node.children;
                    }
                }
                else if (s[1] === '?') {
                    emitError(context, 21 /* ErrorCodes.UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME */, 1);
                    node = parseBogusComment(context);
                }
                else {
                    emitError(context, 12 /* ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME */, 1);
                }
            }
        }
        if (!node) {
            node = parseText(context, mode);
        }
        if ((0, shared_1.isArray)(node)) {
            for (var i = 0; i < node.length; i++) {
                pushNode(nodes, node[i]);
            }
        }
        else {
            pushNode(nodes, node);
        }
    }
    // Whitespace handling strategy like v2
    var removedWhitespace = false;
    if (mode !== 2 /* TextModes.RAWTEXT */ && mode !== 1 /* TextModes.RCDATA */) {
        var shouldCondense = context.options.whitespace !== 'preserve';
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.type === 2 /* NodeTypes.TEXT */) {
                if (!context.inPre) {
                    if (!/[^\t\r\n\f ]/.test(node.content)) {
                        var prev = nodes[i - 1];
                        var next = nodes[i + 1];
                        // Remove if:
                        // - the whitespace is the first or last node, or:
                        // - (condense mode) the whitespace is between twos comments, or:
                        // - (condense mode) the whitespace is between comment and element, or:
                        // - (condense mode) the whitespace is between two elements AND contains newline
                        if (!prev ||
                            !next ||
                            (shouldCondense &&
                                ((prev.type === 3 /* NodeTypes.COMMENT */ &&
                                    next.type === 3 /* NodeTypes.COMMENT */) ||
                                    (prev.type === 3 /* NodeTypes.COMMENT */ &&
                                        next.type === 1 /* NodeTypes.ELEMENT */) ||
                                    (prev.type === 1 /* NodeTypes.ELEMENT */ &&
                                        next.type === 3 /* NodeTypes.COMMENT */) ||
                                    (prev.type === 1 /* NodeTypes.ELEMENT */ &&
                                        next.type === 1 /* NodeTypes.ELEMENT */ &&
                                        /[\r\n]/.test(node.content))))) {
                            removedWhitespace = true;
                            nodes[i] = null;
                        }
                        else {
                            // Otherwise, the whitespace is condensed into a single space
                            node.content = ' ';
                        }
                    }
                    else if (shouldCondense) {
                        // in condense mode, consecutive whitespaces in text are condensed
                        // down to a single space.
                        node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ');
                    }
                }
                else {
                    // #6410 normalize windows newlines in <pre>:
                    // in SSR, browsers normalize server-rendered \r\n into a single \n
                    // in the DOM
                    node.content = node.content.replace(/\r\n/g, '\n');
                }
            }
            // Remove comment nodes if desired by configuration.
            else if (node.type === 3 /* NodeTypes.COMMENT */ && !context.options.comments) {
                removedWhitespace = true;
                nodes[i] = null;
            }
        }
        if (context.inPre && parent && context.options.isPreTag(parent.tag)) {
            // remove leading newline per html spec
            // https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
            var first = nodes[0];
            if (first && first.type === 2 /* NodeTypes.TEXT */) {
                first.content = first.content.replace(/^\r?\n/, '');
            }
        }
    }
    return removedWhitespace ? nodes.filter(Boolean) : nodes;
}
function pushNode(nodes, node) {
    if (node.type === 2 /* NodeTypes.TEXT */) {
        var prev = last(nodes);
        // Merge if both this and the previous node are text and those are
        // consecutive. This happens for cases like "a < b".
        if (prev &&
            prev.type === 2 /* NodeTypes.TEXT */ &&
            prev.loc.end.offset === node.loc.start.offset) {
            prev.content += node.content;
            prev.loc.end = node.loc.end;
            prev.loc.source += node.loc.source;
            return;
        }
    }
    nodes.push(node);
}
function parseCDATA(context, ancestors) {
    __TEST__ &&
        (0, utils_1.assert)(last(ancestors) == null || last(ancestors).ns !== 0 /* Namespaces.HTML */);
    __TEST__ && (0, utils_1.assert)(startsWith(context.source, '<![CDATA['));
    advanceBy(context, 9);
    var nodes = parseChildren(context, 3 /* TextModes.CDATA */, ancestors);
    if (context.source.length === 0) {
        emitError(context, 6 /* ErrorCodes.EOF_IN_CDATA */);
    }
    else {
        __TEST__ && (0, utils_1.assert)(startsWith(context.source, ']]>'));
        advanceBy(context, 3);
    }
    return nodes;
}
function parseComment(context) {
    __TEST__ && (0, utils_1.assert)(startsWith(context.source, '<!--'));
    var start = getCursor(context);
    var content;
    // Regular comment.
    var match = /--(\!)?>/.exec(context.source);
    if (!match) {
        content = context.source.slice(4);
        advanceBy(context, context.source.length);
        emitError(context, 7 /* ErrorCodes.EOF_IN_COMMENT */);
    }
    else {
        if (match.index <= 3) {
            emitError(context, 0 /* ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT */);
        }
        if (match[1]) {
            emitError(context, 10 /* ErrorCodes.INCORRECTLY_CLOSED_COMMENT */);
        }
        content = context.source.slice(4, match.index);
        // Advancing with reporting nested comments.
        var s = context.source.slice(0, match.index);
        var prevIndex = 1, nestedIndex = 0;
        while ((nestedIndex = s.indexOf('<!--', prevIndex)) !== -1) {
            advanceBy(context, nestedIndex - prevIndex + 1);
            if (nestedIndex + 4 < s.length) {
                emitError(context, 16 /* ErrorCodes.NESTED_COMMENT */);
            }
            prevIndex = nestedIndex + 1;
        }
        advanceBy(context, match.index + match[0].length - prevIndex + 1);
    }
    return {
        type: 3 /* NodeTypes.COMMENT */,
        content: content,
        loc: getSelection(context, start)
    };
}
function parseBogusComment(context) {
    __TEST__ && (0, utils_1.assert)(/^<(?:[\!\?]|\/[^a-z>])/i.test(context.source));
    var start = getCursor(context);
    var contentStart = context.source[1] === '?' ? 1 : 2;
    var content;
    var closeIndex = context.source.indexOf('>');
    if (closeIndex === -1) {
        content = context.source.slice(contentStart);
        advanceBy(context, context.source.length);
    }
    else {
        content = context.source.slice(contentStart, closeIndex);
        advanceBy(context, closeIndex + 1);
    }
    return {
        type: 3 /* NodeTypes.COMMENT */,
        content: content,
        loc: getSelection(context, start)
    };
}
function parseElement(context, ancestors) {
    __TEST__ && (0, utils_1.assert)(/^<[a-z]/i.test(context.source));
    // Start tag.
    var wasInPre = context.inPre;
    var wasInVPre = context.inVPre;
    var parent = last(ancestors);
    var element = parseTag(context, 0 /* TagType.Start */, parent);
    var isPreBoundary = context.inPre && !wasInPre;
    var isVPreBoundary = context.inVPre && !wasInVPre;
    if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
        // #4030 self-closing <pre> tag
        if (isPreBoundary) {
            context.inPre = false;
        }
        if (isVPreBoundary) {
            context.inVPre = false;
        }
        return element;
    }
    // Children.
    ancestors.push(element);
    var mode = context.options.getTextMode(element, parent);
    var children = parseChildren(context, mode, ancestors);
    ancestors.pop();
    // 2.x inline-template compat
    if (__COMPAT__) {
        var inlineTemplateProp = element.props.find(function (p) { return p.type === 6 /* NodeTypes.ATTRIBUTE */ && p.name === 'inline-template'; });
        if (inlineTemplateProp &&
            (0, compatConfig_1.checkCompatEnabled)("COMPILER_INLINE_TEMPLATE" /* CompilerDeprecationTypes.COMPILER_INLINE_TEMPLATE */, context, inlineTemplateProp.loc)) {
            var loc = getSelection(context, element.loc.end);
            inlineTemplateProp.value = {
                type: 2 /* NodeTypes.TEXT */,
                content: loc.source,
                loc: loc
            };
        }
    }
    element.children = children;
    // End tag.
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */, parent);
    }
    else {
        emitError(context, 24 /* ErrorCodes.X_MISSING_END_TAG */, 0, element.loc.start);
        if (context.source.length === 0 && element.tag.toLowerCase() === 'script') {
            var first = children[0];
            if (first && startsWith(first.loc.source, '<!--')) {
                emitError(context, 8 /* ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT */);
            }
        }
    }
    element.loc = getSelection(context, element.loc.start);
    if (isPreBoundary) {
        context.inPre = false;
    }
    if (isVPreBoundary) {
        context.inVPre = false;
    }
    return element;
}
var isSpecialTemplateDirective = /*#__PURE__*/ (0, shared_1.makeMap)("if,else,else-if,for,slot");
function parseTag(context, type, parent) {
    __TEST__ && (0, utils_1.assert)(/^<\/?[a-z]/i.test(context.source));
    __TEST__ &&
        (0, utils_1.assert)(type === (startsWith(context.source, '</') ? 1 /* TagType.End */ : 0 /* TagType.Start */));
    // Tag open.
    var start = getCursor(context);
    var match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
    var tag = match[1];
    var ns = context.options.getNamespace(tag, parent);
    advanceBy(context, match[0].length);
    advanceSpaces(context);
    // save current state in case we need to re-parse attributes with v-pre
    var cursor = getCursor(context);
    var currentSource = context.source;
    // check <pre> tag
    if (context.options.isPreTag(tag)) {
        context.inPre = true;
    }
    // Attributes.
    var props = parseAttributes(context, type);
    // check v-pre
    if (type === 0 /* TagType.Start */ &&
        !context.inVPre &&
        props.some(function (p) { return p.type === 7 /* NodeTypes.DIRECTIVE */ && p.name === 'pre'; })) {
        context.inVPre = true;
        // reset context
        (0, shared_1.extend)(context, cursor);
        context.source = currentSource;
        // re-parse attrs and filter out v-pre itself
        props = parseAttributes(context, type).filter(function (p) { return p.name !== 'v-pre'; });
    }
    // Tag close.
    var isSelfClosing = false;
    if (context.source.length === 0) {
        emitError(context, 9 /* ErrorCodes.EOF_IN_TAG */);
    }
    else {
        isSelfClosing = startsWith(context.source, '/>');
        if (type === 1 /* TagType.End */ && isSelfClosing) {
            emitError(context, 4 /* ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS */);
        }
        advanceBy(context, isSelfClosing ? 2 : 1);
    }
    if (type === 1 /* TagType.End */) {
        return;
    }
    // 2.x deprecation checks
    if (__COMPAT__ &&
        __DEV__ &&
        (0, compatConfig_1.isCompatEnabled)("COMPILER_V_IF_V_FOR_PRECEDENCE" /* CompilerDeprecationTypes.COMPILER_V_IF_V_FOR_PRECEDENCE */, context)) {
        var hasIf = false;
        var hasFor = false;
        for (var i = 0; i < props.length; i++) {
            var p = props[i];
            if (p.type === 7 /* NodeTypes.DIRECTIVE */) {
                if (p.name === 'if') {
                    hasIf = true;
                }
                else if (p.name === 'for') {
                    hasFor = true;
                }
            }
            if (hasIf && hasFor) {
                (0, compatConfig_1.warnDeprecation)("COMPILER_V_IF_V_FOR_PRECEDENCE" /* CompilerDeprecationTypes.COMPILER_V_IF_V_FOR_PRECEDENCE */, context, getSelection(context, start));
                break;
            }
        }
    }
    var tagType = 0 /* ElementTypes.ELEMENT */;
    if (!context.inVPre) {
        if (tag === 'slot') {
            tagType = 2 /* ElementTypes.SLOT */;
        }
        else if (tag === 'template') {
            if (props.some(function (p) {
                return p.type === 7 /* NodeTypes.DIRECTIVE */ && isSpecialTemplateDirective(p.name);
            })) {
                tagType = 3 /* ElementTypes.TEMPLATE */;
            }
        }
        else if (isComponent(tag, props, context)) {
            tagType = 1 /* ElementTypes.COMPONENT */;
        }
    }
    return {
        type: 1 /* NodeTypes.ELEMENT */,
        ns: ns,
        tag: tag,
        tagType: tagType,
        props: props,
        isSelfClosing: isSelfClosing,
        children: [],
        loc: getSelection(context, start),
        codegenNode: undefined // to be created during transform phase
    };
}
function isComponent(tag, props, context) {
    var options = context.options;
    if (options.isCustomElement(tag)) {
        return false;
    }
    if (tag === 'component' ||
        /^[A-Z]/.test(tag) ||
        (0, utils_1.isCoreComponent)(tag) ||
        (options.isBuiltInComponent && options.isBuiltInComponent(tag)) ||
        (options.isNativeTag && !options.isNativeTag(tag))) {
        return true;
    }
    // at this point the tag should be a native tag, but check for potential "is"
    // casting
    for (var i = 0; i < props.length; i++) {
        var p = props[i];
        if (p.type === 6 /* NodeTypes.ATTRIBUTE */) {
            if (p.name === 'is' && p.value) {
                if (p.value.content.startsWith('vue:')) {
                    return true;
                }
                else if (__COMPAT__ &&
                    (0, compatConfig_1.checkCompatEnabled)("COMPILER_IS_ON_ELEMENT" /* CompilerDeprecationTypes.COMPILER_IS_ON_ELEMENT */, context, p.loc)) {
                    return true;
                }
            }
        }
        else {
            // directive
            // v-is (TODO Deprecate)
            if (p.name === 'is') {
                return true;
            }
            else if (
            // :is on plain element - only treat as component in compat mode
            p.name === 'bind' &&
                (0, utils_1.isStaticArgOf)(p.arg, 'is') &&
                __COMPAT__ &&
                (0, compatConfig_1.checkCompatEnabled)("COMPILER_IS_ON_ELEMENT" /* CompilerDeprecationTypes.COMPILER_IS_ON_ELEMENT */, context, p.loc)) {
                return true;
            }
        }
    }
}
function parseAttributes(context, type) {
    var props = [];
    var attributeNames = new Set();
    while (context.source.length > 0 &&
        !startsWith(context.source, '>') &&
        !startsWith(context.source, '/>')) {
        if (startsWith(context.source, '/')) {
            emitError(context, 22 /* ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG */);
            advanceBy(context, 1);
            advanceSpaces(context);
            continue;
        }
        if (type === 1 /* TagType.End */) {
            emitError(context, 3 /* ErrorCodes.END_TAG_WITH_ATTRIBUTES */);
        }
        var attr = parseAttribute(context, attributeNames);
        // Trim whitespace between class
        // https://github.com/vuejs/core/issues/4251
        if (attr.type === 6 /* NodeTypes.ATTRIBUTE */ &&
            attr.value &&
            attr.name === 'class') {
            attr.value.content = attr.value.content.replace(/\s+/g, ' ').trim();
        }
        if (type === 0 /* TagType.Start */) {
            props.push(attr);
        }
        if (/^[^\t\r\n\f />]/.test(context.source)) {
            emitError(context, 15 /* ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES */);
        }
        advanceSpaces(context);
    }
    return props;
}
function parseAttribute(context, nameSet) {
    __TEST__ && (0, utils_1.assert)(/^[^\t\r\n\f />]/.test(context.source));
    // Name.
    var start = getCursor(context);
    var match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    var name = match[0];
    if (nameSet.has(name)) {
        emitError(context, 2 /* ErrorCodes.DUPLICATE_ATTRIBUTE */);
    }
    nameSet.add(name);
    if (name[0] === '=') {
        emitError(context, 19 /* ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME */);
    }
    {
        var pattern = /["'<]/g;
        var m = void 0;
        while ((m = pattern.exec(name))) {
            emitError(context, 17 /* ErrorCodes.UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME */, m.index);
        }
    }
    advanceBy(context, name.length);
    // Value
    var value = undefined;
    if (/^[\t\r\n\f ]*=/.test(context.source)) {
        advanceSpaces(context);
        advanceBy(context, 1);
        advanceSpaces(context);
        value = parseAttributeValue(context);
        if (!value) {
            emitError(context, 13 /* ErrorCodes.MISSING_ATTRIBUTE_VALUE */);
        }
    }
    var loc = getSelection(context, start);
    if (!context.inVPre && /^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
        var match_1 = /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(name);
        var isPropShorthand = startsWith(name, '.');
        var dirName = match_1[1] ||
            (isPropShorthand || startsWith(name, ':')
                ? 'bind'
                : startsWith(name, '@')
                    ? 'on'
                    : 'slot');
        var arg = void 0;
        if (match_1[2]) {
            var isSlot = dirName === 'slot';
            var startOffset = name.lastIndexOf(match_1[2]);
            var loc_1 = getSelection(context, getNewPosition(context, start, startOffset), getNewPosition(context, start, startOffset + match_1[2].length + ((isSlot && match_1[3]) || '').length));
            var content = match_1[2];
            var isStatic = true;
            if (content.startsWith('[')) {
                isStatic = false;
                if (!content.endsWith(']')) {
                    emitError(context, 27 /* ErrorCodes.X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END */);
                    content = content.slice(1);
                }
                else {
                    content = content.slice(1, content.length - 1);
                }
            }
            else if (isSlot) {
                // #1241 special case for v-slot: vuetify relies extensively on slot
                // names containing dots. v-slot doesn't have any modifiers and Vue 2.x
                // supports such usage so we are keeping it consistent with 2.x.
                content += match_1[3] || '';
            }
            arg = {
                type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                content: content,
                isStatic: isStatic,
                constType: isStatic
                    ? 3 /* ConstantTypes.CAN_STRINGIFY */
                    : 0 /* ConstantTypes.NOT_CONSTANT */,
                loc: loc_1
            };
        }
        if (value && value.isQuoted) {
            var valueLoc = value.loc;
            valueLoc.start.offset++;
            valueLoc.start.column++;
            valueLoc.end = (0, utils_1.advancePositionWithClone)(valueLoc.start, value.content);
            valueLoc.source = valueLoc.source.slice(1, -1);
        }
        var modifiers = match_1[3] ? match_1[3].slice(1).split('.') : [];
        if (isPropShorthand)
            modifiers.push('prop');
        // 2.x compat v-bind:foo.sync -> v-model:foo
        if (__COMPAT__ && dirName === 'bind' && arg) {
            if (modifiers.includes('sync') &&
                (0, compatConfig_1.checkCompatEnabled)("COMPILER_V_BIND_SYNC" /* CompilerDeprecationTypes.COMPILER_V_BIND_SYNC */, context, loc, arg.loc.source)) {
                dirName = 'model';
                modifiers.splice(modifiers.indexOf('sync'), 1);
            }
            if (__DEV__ && modifiers.includes('prop')) {
                (0, compatConfig_1.checkCompatEnabled)("COMPILER_V_BIND_PROP" /* CompilerDeprecationTypes.COMPILER_V_BIND_PROP */, context, loc);
            }
        }
        return {
            type: 7 /* NodeTypes.DIRECTIVE */,
            name: dirName,
            exp: value && {
                type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                content: value.content,
                isStatic: false,
                // Treat as non-constant by default. This can be potentially set to
                // other values by `transformExpression` to make it eligible for hoisting.
                constType: 0 /* ConstantTypes.NOT_CONSTANT */,
                loc: value.loc
            },
            arg: arg,
            modifiers: modifiers,
            loc: loc
        };
    }
    // missing directive name or illegal directive name
    if (!context.inVPre && startsWith(name, 'v-')) {
        emitError(context, 26 /* ErrorCodes.X_MISSING_DIRECTIVE_NAME */);
    }
    return {
        type: 6 /* NodeTypes.ATTRIBUTE */,
        name: name,
        value: value && {
            type: 2 /* NodeTypes.TEXT */,
            content: value.content,
            loc: value.loc
        },
        loc: loc
    };
}
function parseAttributeValue(context) {
    var start = getCursor(context);
    var content;
    var quote = context.source[0];
    var isQuoted = quote === "\"" || quote === "'";
    if (isQuoted) {
        // Quoted value.
        advanceBy(context, 1);
        var endIndex = context.source.indexOf(quote);
        if (endIndex === -1) {
            content = parseTextData(context, context.source.length, 4 /* TextModes.ATTRIBUTE_VALUE */);
        }
        else {
            content = parseTextData(context, endIndex, 4 /* TextModes.ATTRIBUTE_VALUE */);
            advanceBy(context, 1);
        }
    }
    else {
        // Unquoted
        var match = /^[^\t\r\n\f >]+/.exec(context.source);
        if (!match) {
            return undefined;
        }
        var unexpectedChars = /["'<=`]/g;
        var m = void 0;
        while ((m = unexpectedChars.exec(match[0]))) {
            emitError(context, 18 /* ErrorCodes.UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE */, m.index);
        }
        content = parseTextData(context, match[0].length, 4 /* TextModes.ATTRIBUTE_VALUE */);
    }
    return { content: content, isQuoted: isQuoted, loc: getSelection(context, start) };
}
function parseInterpolation(context, mode) {
    var _a = context.options.delimiters, open = _a[0], close = _a[1];
    __TEST__ && (0, utils_1.assert)(startsWith(context.source, open));
    var closeIndex = context.source.indexOf(close, open.length);
    if (closeIndex === -1) {
        emitError(context, 25 /* ErrorCodes.X_MISSING_INTERPOLATION_END */);
        return undefined;
    }
    var start = getCursor(context);
    advanceBy(context, open.length);
    var innerStart = getCursor(context);
    var innerEnd = getCursor(context);
    var rawContentLength = closeIndex - open.length;
    var rawContent = context.source.slice(0, rawContentLength);
    var preTrimContent = parseTextData(context, rawContentLength, mode);
    var content = preTrimContent.trim();
    var startOffset = preTrimContent.indexOf(content);
    if (startOffset > 0) {
        (0, utils_1.advancePositionWithMutation)(innerStart, rawContent, startOffset);
    }
    var endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
    (0, utils_1.advancePositionWithMutation)(innerEnd, rawContent, endOffset);
    advanceBy(context, close.length);
    return {
        type: 5 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
            isStatic: false,
            // Set `isConstant` to false by default and will decide in transformExpression
            constType: 0 /* ConstantTypes.NOT_CONSTANT */,
            content: content,
            loc: getSelection(context, innerStart, innerEnd)
        },
        loc: getSelection(context, start)
    };
}
function parseText(context, mode) {
    __TEST__ && (0, utils_1.assert)(context.source.length > 0);
    var endTokens = mode === 3 /* TextModes.CDATA */ ? [']]>'] : ['<', context.options.delimiters[0]];
    var endIndex = context.source.length;
    for (var i = 0; i < endTokens.length; i++) {
        var index = context.source.indexOf(endTokens[i], 1);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    __TEST__ && (0, utils_1.assert)(endIndex > 0);
    var start = getCursor(context);
    var content = parseTextData(context, endIndex, mode);
    return {
        type: 2 /* NodeTypes.TEXT */,
        content: content,
        loc: getSelection(context, start)
    };
}
/**
 * Get text data with a given length from the current location.
 * This translates HTML entities in the text data.
 */
function parseTextData(context, length, mode) {
    var rawText = context.source.slice(0, length);
    advanceBy(context, length);
    if (mode === 2 /* TextModes.RAWTEXT */ ||
        mode === 3 /* TextModes.CDATA */ ||
        !rawText.includes('&')) {
        return rawText;
    }
    else {
        // DATA or RCDATA containing "&"". Entity decoding required.
        return context.options.decodeEntities(rawText, mode === 4 /* TextModes.ATTRIBUTE_VALUE */);
    }
}
function getCursor(context) {
    var column = context.column, line = context.line, offset = context.offset;
    return { column: column, line: line, offset: offset };
}
function getSelection(context, start, end) {
    end = end || getCursor(context);
    return {
        start: start,
        end: end,
        source: context.originalSource.slice(start.offset, end.offset)
    };
}
function last(xs) {
    return xs[xs.length - 1];
}
function startsWith(source, searchString) {
    return source.startsWith(searchString);
}
function advanceBy(context, numberOfCharacters) {
    var source = context.source;
    __TEST__ && (0, utils_1.assert)(numberOfCharacters <= source.length);
    (0, utils_1.advancePositionWithMutation)(context, source, numberOfCharacters);
    context.source = source.slice(numberOfCharacters);
}
function advanceSpaces(context) {
    var match = /^[\t\r\n\f ]+/.exec(context.source);
    if (match) {
        advanceBy(context, match[0].length);
    }
}
function getNewPosition(context, start, numberOfCharacters) {
    return (0, utils_1.advancePositionWithClone)(start, context.originalSource.slice(start.offset, numberOfCharacters), numberOfCharacters);
}
function emitError(context, code, offset, loc) {
    if (loc === void 0) { loc = getCursor(context); }
    if (offset) {
        loc.offset += offset;
        loc.column += offset;
    }
    context.options.onError((0, errors_1.createCompilerError)(code, {
        start: loc,
        end: loc,
        source: ''
    }));
}
function isEnd(context, mode, ancestors) {
    var s = context.source;
    switch (mode) {
        case 0 /* TextModes.DATA */:
            if (startsWith(s, '</')) {
                // TODO: probably bad performance
                for (var i = ancestors.length - 1; i >= 0; --i) {
                    if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                        return true;
                    }
                }
            }
            break;
        case 1 /* TextModes.RCDATA */:
        case 2 /* TextModes.RAWTEXT */: {
            var parent_1 = last(ancestors);
            if (parent_1 && startsWithEndTagOpen(s, parent_1.tag)) {
                return true;
            }
            break;
        }
        case 3 /* TextModes.CDATA */:
            if (startsWith(s, ']]>')) {
                return true;
            }
            break;
    }
    return !s;
}
function startsWithEndTagOpen(source, tag) {
    return (startsWith(source, '</') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
        /[\t\r\n\f />]/.test(source[2 + tag.length] || '>'));
}
