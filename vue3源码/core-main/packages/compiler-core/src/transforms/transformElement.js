"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDirectiveArgs = exports.buildProps = exports.resolveComponentType = exports.transformElement = void 0;
var ast_1 = require("../ast");
var shared_1 = require("@vue/shared");
var errors_1 = require("../errors");
var runtimeHelpers_1 = require("../runtimeHelpers");
var utils_1 = require("../utils");
var vSlot_1 = require("./vSlot");
var hoistStatic_1 = require("./hoistStatic");
var compatConfig_1 = require("../compat/compatConfig");
// some directive transforms (e.g. v-model) may return a symbol for runtime
// import, which should be used instead of a resolveDirective call.
var directiveImportMap = new WeakMap();
// generate a JavaScript AST for this element's codegen
var transformElement = function (node, context) {
    // perform the work on exit, after all child expressions have been
    // processed and merged.
    return function postTransformElement() {
        node = context.currentNode;
        if (!(node.type === 1 /* NodeTypes.ELEMENT */ &&
            (node.tagType === 0 /* ElementTypes.ELEMENT */ ||
                node.tagType === 1 /* ElementTypes.COMPONENT */))) {
            return;
        }
        var tag = node.tag, props = node.props;
        var isComponent = node.tagType === 1 /* ElementTypes.COMPONENT */;
        // The goal of the transform is to create a codegenNode implementing the
        // VNodeCall interface.
        var vnodeTag = isComponent
            ? resolveComponentType(node, context)
            : "\"".concat(tag, "\"");
        var isDynamicComponent = (0, shared_1.isObject)(vnodeTag) && vnodeTag.callee === runtimeHelpers_1.RESOLVE_DYNAMIC_COMPONENT;
        var vnodeProps;
        var vnodeChildren;
        var vnodePatchFlag;
        var patchFlag = 0;
        var vnodeDynamicProps;
        var dynamicPropNames;
        var vnodeDirectives;
        var shouldUseBlock = 
        // dynamic component may resolve to plain elements
        isDynamicComponent ||
            vnodeTag === runtimeHelpers_1.TELEPORT ||
            vnodeTag === runtimeHelpers_1.SUSPENSE ||
            (!isComponent &&
                // <svg> and <foreignObject> must be forced into blocks so that block
                // updates inside get proper isSVG flag at runtime. (#639, #643)
                // This is technically web-specific, but splitting the logic out of core
                // leads to too much unnecessary complexity.
                (tag === 'svg' || tag === 'foreignObject'));
        // props
        if (props.length > 0) {
            var propsBuildResult = buildProps(node, context, undefined, isComponent, isDynamicComponent);
            vnodeProps = propsBuildResult.props;
            patchFlag = propsBuildResult.patchFlag;
            dynamicPropNames = propsBuildResult.dynamicPropNames;
            var directives = propsBuildResult.directives;
            vnodeDirectives =
                directives && directives.length
                    ? (0, ast_1.createArrayExpression)(directives.map(function (dir) { return buildDirectiveArgs(dir, context); }))
                    : undefined;
            if (propsBuildResult.shouldUseBlock) {
                shouldUseBlock = true;
            }
        }
        // children
        if (node.children.length > 0) {
            if (vnodeTag === runtimeHelpers_1.KEEP_ALIVE) {
                // Although a built-in component, we compile KeepAlive with raw children
                // instead of slot functions so that it can be used inside Transition
                // or other Transition-wrapping HOCs.
                // To ensure correct updates with block optimizations, we need to:
                // 1. Force keep-alive into a block. This avoids its children being
                //    collected by a parent block.
                shouldUseBlock = true;
                // 2. Force keep-alive to always be updated, since it uses raw children.
                patchFlag |= shared_1.PatchFlags.DYNAMIC_SLOTS;
                if (__DEV__ && node.children.length > 1) {
                    context.onError((0, errors_1.createCompilerError)(45 /* ErrorCodes.X_KEEP_ALIVE_INVALID_CHILDREN */, {
                        start: node.children[0].loc.start,
                        end: node.children[node.children.length - 1].loc.end,
                        source: ''
                    }));
                }
            }
            var shouldBuildAsSlots = isComponent &&
                // Teleport is not a real component and has dedicated runtime handling
                vnodeTag !== runtimeHelpers_1.TELEPORT &&
                // explained above.
                vnodeTag !== runtimeHelpers_1.KEEP_ALIVE;
            if (shouldBuildAsSlots) {
                var _a = (0, vSlot_1.buildSlots)(node, context), slots = _a.slots, hasDynamicSlots = _a.hasDynamicSlots;
                vnodeChildren = slots;
                if (hasDynamicSlots) {
                    patchFlag |= shared_1.PatchFlags.DYNAMIC_SLOTS;
                }
            }
            else if (node.children.length === 1 && vnodeTag !== runtimeHelpers_1.TELEPORT) {
                var child = node.children[0];
                var type = child.type;
                // check for dynamic text children
                var hasDynamicTextChild = type === 5 /* NodeTypes.INTERPOLATION */ ||
                    type === 8 /* NodeTypes.COMPOUND_EXPRESSION */;
                if (hasDynamicTextChild &&
                    (0, hoistStatic_1.getConstantType)(child, context) === 0 /* ConstantTypes.NOT_CONSTANT */) {
                    patchFlag |= shared_1.PatchFlags.TEXT;
                }
                // pass directly if the only child is a text node
                // (plain / interpolation / expression)
                if (hasDynamicTextChild || type === 2 /* NodeTypes.TEXT */) {
                    vnodeChildren = child;
                }
                else {
                    vnodeChildren = node.children;
                }
            }
            else {
                vnodeChildren = node.children;
            }
        }
        // patchFlag & dynamicPropNames
        if (patchFlag !== 0) {
            if (__DEV__) {
                if (patchFlag < 0) {
                    // special flags (negative and mutually exclusive)
                    vnodePatchFlag = patchFlag + " /* ".concat(shared_1.PatchFlagNames[patchFlag], " */");
                }
                else {
                    // bitwise flags
                    var flagNames = Object.keys(shared_1.PatchFlagNames)
                        .map(Number)
                        .filter(function (n) { return n > 0 && patchFlag & n; })
                        .map(function (n) { return shared_1.PatchFlagNames[n]; })
                        .join(", ");
                    vnodePatchFlag = patchFlag + " /* ".concat(flagNames, " */");
                }
            }
            else {
                vnodePatchFlag = String(patchFlag);
            }
            if (dynamicPropNames && dynamicPropNames.length) {
                vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames);
            }
        }
        node.codegenNode = (0, ast_1.createVNodeCall)(context, vnodeTag, vnodeProps, vnodeChildren, vnodePatchFlag, vnodeDynamicProps, vnodeDirectives, !!shouldUseBlock, false /* disableTracking */, isComponent, node.loc);
    };
};
exports.transformElement = transformElement;
function resolveComponentType(node, context, ssr) {
    if (ssr === void 0) { ssr = false; }
    var tag = node.tag;
    // 1. dynamic component
    var isExplicitDynamic = isComponentTag(tag);
    var isProp = (0, utils_1.findProp)(node, 'is');
    if (isProp) {
        if (isExplicitDynamic ||
            (__COMPAT__ &&
                (0, compatConfig_1.isCompatEnabled)("COMPILER_IS_ON_ELEMENT" /* CompilerDeprecationTypes.COMPILER_IS_ON_ELEMENT */, context))) {
            var exp = isProp.type === 6 /* NodeTypes.ATTRIBUTE */
                ? isProp.value && (0, ast_1.createSimpleExpression)(isProp.value.content, true)
                : isProp.exp;
            if (exp) {
                return (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.RESOLVE_DYNAMIC_COMPONENT), [
                    exp
                ]);
            }
        }
        else if (isProp.type === 6 /* NodeTypes.ATTRIBUTE */ &&
            isProp.value.content.startsWith('vue:')) {
            // <button is="vue:xxx">
            // if not <component>, only is value that starts with "vue:" will be
            // treated as component by the parse phase and reach here, unless it's
            // compat mode where all is values are considered components
            tag = isProp.value.content.slice(4);
        }
    }
    // 1.5 v-is (TODO: Deprecate)
    var isDir = !isExplicitDynamic && (0, utils_1.findDir)(node, 'is');
    if (isDir && isDir.exp) {
        return (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.RESOLVE_DYNAMIC_COMPONENT), [
            isDir.exp
        ]);
    }
    // 2. built-in components (Teleport, Transition, KeepAlive, Suspense...)
    var builtIn = (0, utils_1.isCoreComponent)(tag) || context.isBuiltInComponent(tag);
    if (builtIn) {
        // built-ins are simply fallthroughs / have special handling during ssr
        // so we don't need to import their runtime equivalents
        if (!ssr)
            context.helper(builtIn);
        return builtIn;
    }
    // 3. user component (from setup bindings)
    // this is skipped in browser build since browser builds do not perform
    // binding analysis.
    if (!__BROWSER__) {
        var fromSetup = resolveSetupReference(tag, context);
        if (fromSetup) {
            return fromSetup;
        }
        var dotIndex = tag.indexOf('.');
        if (dotIndex > 0) {
            var ns = resolveSetupReference(tag.slice(0, dotIndex), context);
            if (ns) {
                return ns + tag.slice(dotIndex);
            }
        }
    }
    // 4. Self referencing component (inferred from filename)
    if (!__BROWSER__ &&
        context.selfName &&
        (0, shared_1.capitalize)((0, shared_1.camelize)(tag)) === context.selfName) {
        context.helper(runtimeHelpers_1.RESOLVE_COMPONENT);
        // codegen.ts has special check for __self postfix when generating
        // component imports, which will pass additional `maybeSelfReference` flag
        // to `resolveComponent`.
        context.components.add(tag + "__self");
        return (0, utils_1.toValidAssetId)(tag, "component");
    }
    // 5. user component (resolve)
    context.helper(runtimeHelpers_1.RESOLVE_COMPONENT);
    context.components.add(tag);
    return (0, utils_1.toValidAssetId)(tag, "component");
}
exports.resolveComponentType = resolveComponentType;
function resolveSetupReference(name, context) {
    var bindings = context.bindingMetadata;
    if (!bindings || bindings.__isScriptSetup === false) {
        return;
    }
    var camelName = (0, shared_1.camelize)(name);
    var PascalName = (0, shared_1.capitalize)(camelName);
    var checkType = function (type) {
        if (bindings[name] === type) {
            return name;
        }
        if (bindings[camelName] === type) {
            return camelName;
        }
        if (bindings[PascalName] === type) {
            return PascalName;
        }
    };
    var fromConst = checkType("setup-const" /* BindingTypes.SETUP_CONST */) ||
        checkType("setup-reactive-const" /* BindingTypes.SETUP_REACTIVE_CONST */);
    if (fromConst) {
        return context.inline
            ? // in inline mode, const setup bindings (e.g. imports) can be used as-is
                fromConst
            : "$setup[".concat(JSON.stringify(fromConst), "]");
    }
    var fromMaybeRef = checkType("setup-let" /* BindingTypes.SETUP_LET */) ||
        checkType("setup-ref" /* BindingTypes.SETUP_REF */) ||
        checkType("setup-maybe-ref" /* BindingTypes.SETUP_MAYBE_REF */);
    if (fromMaybeRef) {
        return context.inline
            ? // setup scope bindings that may be refs need to be unrefed
                "".concat(context.helperString(runtimeHelpers_1.UNREF), "(").concat(fromMaybeRef, ")")
            : "$setup[".concat(JSON.stringify(fromMaybeRef), "]");
    }
}
function buildProps(node, context, props, isComponent, isDynamicComponent, ssr) {
    if (props === void 0) { props = node.props; }
    if (ssr === void 0) { ssr = false; }
    var tag = node.tag, elementLoc = node.loc, children = node.children;
    var properties = [];
    var mergeArgs = [];
    var runtimeDirectives = [];
    var hasChildren = children.length > 0;
    var shouldUseBlock = false;
    // patchFlag analysis
    var patchFlag = 0;
    var hasRef = false;
    var hasClassBinding = false;
    var hasStyleBinding = false;
    var hasHydrationEventBinding = false;
    var hasDynamicKeys = false;
    var hasVnodeHook = false;
    var dynamicPropNames = [];
    var pushMergeArg = function (arg) {
        if (properties.length) {
            mergeArgs.push((0, ast_1.createObjectExpression)(dedupeProperties(properties), elementLoc));
            properties = [];
        }
        if (arg)
            mergeArgs.push(arg);
    };
    var analyzePatchFlag = function (_a) {
        var key = _a.key, value = _a.value;
        if ((0, utils_1.isStaticExp)(key)) {
            var name_1 = key.content;
            var isEventHandler = (0, shared_1.isOn)(name_1);
            if (isEventHandler &&
                (!isComponent || isDynamicComponent) &&
                // omit the flag for click handlers because hydration gives click
                // dedicated fast path.
                name_1.toLowerCase() !== 'onclick' &&
                // omit v-model handlers
                name_1 !== 'onUpdate:modelValue' &&
                // omit onVnodeXXX hooks
                !(0, shared_1.isReservedProp)(name_1)) {
                hasHydrationEventBinding = true;
            }
            if (isEventHandler && (0, shared_1.isReservedProp)(name_1)) {
                hasVnodeHook = true;
            }
            if (value.type === 20 /* NodeTypes.JS_CACHE_EXPRESSION */ ||
                ((value.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ ||
                    value.type === 8 /* NodeTypes.COMPOUND_EXPRESSION */) &&
                    (0, hoistStatic_1.getConstantType)(value, context) > 0)) {
                // skip if the prop is a cached handler or has constant value
                return;
            }
            if (name_1 === 'ref') {
                hasRef = true;
            }
            else if (name_1 === 'class') {
                hasClassBinding = true;
            }
            else if (name_1 === 'style') {
                hasStyleBinding = true;
            }
            else if (name_1 !== 'key' && !dynamicPropNames.includes(name_1)) {
                dynamicPropNames.push(name_1);
            }
            // treat the dynamic class and style binding of the component as dynamic props
            if (isComponent &&
                (name_1 === 'class' || name_1 === 'style') &&
                !dynamicPropNames.includes(name_1)) {
                dynamicPropNames.push(name_1);
            }
        }
        else {
            hasDynamicKeys = true;
        }
    };
    for (var i = 0; i < props.length; i++) {
        // static attribute
        var prop = props[i];
        if (prop.type === 6 /* NodeTypes.ATTRIBUTE */) {
            var loc = prop.loc, name_2 = prop.name, value = prop.value;
            var isStatic = true;
            if (name_2 === 'ref') {
                hasRef = true;
                if (context.scopes.vFor > 0) {
                    properties.push((0, ast_1.createObjectProperty)((0, ast_1.createSimpleExpression)('ref_for', true), (0, ast_1.createSimpleExpression)('true')));
                }
                // in inline mode there is no setupState object, so we can't use string
                // keys to set the ref. Instead, we need to transform it to pass the
                // actual ref instead.
                if (!__BROWSER__ &&
                    value &&
                    context.inline &&
                    context.bindingMetadata[value.content]) {
                    isStatic = false;
                    properties.push((0, ast_1.createObjectProperty)((0, ast_1.createSimpleExpression)('ref_key', true), (0, ast_1.createSimpleExpression)(value.content, true, value.loc)));
                }
            }
            // skip is on <component>, or is="vue:xxx"
            if (name_2 === 'is' &&
                (isComponentTag(tag) ||
                    (value && value.content.startsWith('vue:')) ||
                    (__COMPAT__ &&
                        (0, compatConfig_1.isCompatEnabled)("COMPILER_IS_ON_ELEMENT" /* CompilerDeprecationTypes.COMPILER_IS_ON_ELEMENT */, context)))) {
                continue;
            }
            properties.push((0, ast_1.createObjectProperty)((0, ast_1.createSimpleExpression)(name_2, true, (0, utils_1.getInnerRange)(loc, 0, name_2.length)), (0, ast_1.createSimpleExpression)(value ? value.content : '', isStatic, value ? value.loc : loc)));
        }
        else {
            // directives
            var name_3 = prop.name, arg = prop.arg, exp = prop.exp, loc = prop.loc;
            var isVBind = name_3 === 'bind';
            var isVOn = name_3 === 'on';
            // skip v-slot - it is handled by its dedicated transform.
            if (name_3 === 'slot') {
                if (!isComponent) {
                    context.onError((0, errors_1.createCompilerError)(40 /* ErrorCodes.X_V_SLOT_MISPLACED */, loc));
                }
                continue;
            }
            // skip v-once/v-memo - they are handled by dedicated transforms.
            if (name_3 === 'once' || name_3 === 'memo') {
                continue;
            }
            // skip v-is and :is on <component>
            if (name_3 === 'is' ||
                (isVBind &&
                    (0, utils_1.isStaticArgOf)(arg, 'is') &&
                    (isComponentTag(tag) ||
                        (__COMPAT__ &&
                            (0, compatConfig_1.isCompatEnabled)("COMPILER_IS_ON_ELEMENT" /* CompilerDeprecationTypes.COMPILER_IS_ON_ELEMENT */, context))))) {
                continue;
            }
            // skip v-on in SSR compilation
            if (isVOn && ssr) {
                continue;
            }
            if (
            // #938: elements with dynamic keys should be forced into blocks
            (isVBind && (0, utils_1.isStaticArgOf)(arg, 'key')) ||
                // inline before-update hooks need to force block so that it is invoked
                // before children
                (isVOn && hasChildren && (0, utils_1.isStaticArgOf)(arg, 'vue:before-update'))) {
                shouldUseBlock = true;
            }
            if (isVBind && (0, utils_1.isStaticArgOf)(arg, 'ref') && context.scopes.vFor > 0) {
                properties.push((0, ast_1.createObjectProperty)((0, ast_1.createSimpleExpression)('ref_for', true), (0, ast_1.createSimpleExpression)('true')));
            }
            // special case for v-bind and v-on with no argument
            if (!arg && (isVBind || isVOn)) {
                hasDynamicKeys = true;
                if (exp) {
                    if (isVBind) {
                        // have to merge early for compat build check
                        pushMergeArg();
                        if (__COMPAT__) {
                            // 2.x v-bind object order compat
                            if (__DEV__) {
                                var hasOverridableKeys = mergeArgs.some(function (arg) {
                                    if (arg.type === 15 /* NodeTypes.JS_OBJECT_EXPRESSION */) {
                                        return arg.properties.some(function (_a) {
                                            var key = _a.key;
                                            if (key.type !== 4 /* NodeTypes.SIMPLE_EXPRESSION */ ||
                                                !key.isStatic) {
                                                return true;
                                            }
                                            return (key.content !== 'class' &&
                                                key.content !== 'style' &&
                                                !(0, shared_1.isOn)(key.content));
                                        });
                                    }
                                    else {
                                        // dynamic expression
                                        return true;
                                    }
                                });
                                if (hasOverridableKeys) {
                                    (0, compatConfig_1.checkCompatEnabled)("COMPILER_V_BIND_OBJECT_ORDER" /* CompilerDeprecationTypes.COMPILER_V_BIND_OBJECT_ORDER */, context, loc);
                                }
                            }
                            if ((0, compatConfig_1.isCompatEnabled)("COMPILER_V_BIND_OBJECT_ORDER" /* CompilerDeprecationTypes.COMPILER_V_BIND_OBJECT_ORDER */, context)) {
                                mergeArgs.unshift(exp);
                                continue;
                            }
                        }
                        mergeArgs.push(exp);
                    }
                    else {
                        // v-on="obj" -> toHandlers(obj)
                        pushMergeArg({
                            type: 14 /* NodeTypes.JS_CALL_EXPRESSION */,
                            loc: loc,
                            callee: context.helper(runtimeHelpers_1.TO_HANDLERS),
                            arguments: isComponent ? [exp] : [exp, "true"]
                        });
                    }
                }
                else {
                    context.onError((0, errors_1.createCompilerError)(isVBind
                        ? 34 /* ErrorCodes.X_V_BIND_NO_EXPRESSION */
                        : 35 /* ErrorCodes.X_V_ON_NO_EXPRESSION */, loc));
                }
                continue;
            }
            var directiveTransform = context.directiveTransforms[name_3];
            if (directiveTransform) {
                // has built-in directive transform.
                var _a = directiveTransform(prop, node, context), props_1 = _a.props, needRuntime = _a.needRuntime;
                !ssr && props_1.forEach(analyzePatchFlag);
                if (isVOn && arg && !(0, utils_1.isStaticExp)(arg)) {
                    pushMergeArg((0, ast_1.createObjectExpression)(props_1, elementLoc));
                }
                else {
                    properties.push.apply(properties, props_1);
                }
                if (needRuntime) {
                    runtimeDirectives.push(prop);
                    if ((0, shared_1.isSymbol)(needRuntime)) {
                        directiveImportMap.set(prop, needRuntime);
                    }
                }
            }
            else if (!(0, shared_1.isBuiltInDirective)(name_3)) {
                // no built-in transform, this is a user custom directive.
                runtimeDirectives.push(prop);
                // custom dirs may use beforeUpdate so they need to force blocks
                // to ensure before-update gets called before children update
                if (hasChildren) {
                    shouldUseBlock = true;
                }
            }
        }
    }
    var propsExpression = undefined;
    // has v-bind="object" or v-on="object", wrap with mergeProps
    if (mergeArgs.length) {
        // close up any not-yet-merged props
        pushMergeArg();
        if (mergeArgs.length > 1) {
            propsExpression = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.MERGE_PROPS), mergeArgs, elementLoc);
        }
        else {
            // single v-bind with nothing else - no need for a mergeProps call
            propsExpression = mergeArgs[0];
        }
    }
    else if (properties.length) {
        propsExpression = (0, ast_1.createObjectExpression)(dedupeProperties(properties), elementLoc);
    }
    // patchFlag analysis
    if (hasDynamicKeys) {
        patchFlag |= shared_1.PatchFlags.FULL_PROPS;
    }
    else {
        if (hasClassBinding && !isComponent) {
            patchFlag |= shared_1.PatchFlags.CLASS;
        }
        if (hasStyleBinding && !isComponent) {
            patchFlag |= shared_1.PatchFlags.STYLE;
        }
        if (dynamicPropNames.length) {
            patchFlag |= shared_1.PatchFlags.PROPS;
        }
        if (hasHydrationEventBinding) {
            patchFlag |= shared_1.PatchFlags.HYDRATE_EVENTS;
        }
    }
    if (!shouldUseBlock &&
        (patchFlag === 0 || patchFlag === shared_1.PatchFlags.HYDRATE_EVENTS) &&
        (hasRef || hasVnodeHook || runtimeDirectives.length > 0)) {
        patchFlag |= shared_1.PatchFlags.NEED_PATCH;
    }
    // pre-normalize props, SSR is skipped for now
    if (!context.inSSR && propsExpression) {
        switch (propsExpression.type) {
            case 15 /* NodeTypes.JS_OBJECT_EXPRESSION */:
                // means that there is no v-bind,
                // but still need to deal with dynamic key binding
                var classKeyIndex = -1;
                var styleKeyIndex = -1;
                var hasDynamicKey = false;
                for (var i = 0; i < propsExpression.properties.length; i++) {
                    var key = propsExpression.properties[i].key;
                    if ((0, utils_1.isStaticExp)(key)) {
                        if (key.content === 'class') {
                            classKeyIndex = i;
                        }
                        else if (key.content === 'style') {
                            styleKeyIndex = i;
                        }
                    }
                    else if (!key.isHandlerKey) {
                        hasDynamicKey = true;
                    }
                }
                var classProp = propsExpression.properties[classKeyIndex];
                var styleProp = propsExpression.properties[styleKeyIndex];
                // no dynamic key
                if (!hasDynamicKey) {
                    if (classProp && !(0, utils_1.isStaticExp)(classProp.value)) {
                        classProp.value = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.NORMALIZE_CLASS), [classProp.value]);
                    }
                    if (styleProp &&
                        // the static style is compiled into an object,
                        // so use `hasStyleBinding` to ensure that it is a dynamic style binding
                        (hasStyleBinding ||
                            (styleProp.value.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */ &&
                                styleProp.value.content.trim()[0] === "[") ||
                            // v-bind:style and style both exist,
                            // v-bind:style with static literal object
                            styleProp.value.type === 17 /* NodeTypes.JS_ARRAY_EXPRESSION */)) {
                        styleProp.value = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.NORMALIZE_STYLE), [styleProp.value]);
                    }
                }
                else {
                    // dynamic key binding, wrap with `normalizeProps`
                    propsExpression = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.NORMALIZE_PROPS), [propsExpression]);
                }
                break;
            case 14 /* NodeTypes.JS_CALL_EXPRESSION */:
                // mergeProps call, do nothing
                break;
            default:
                // single v-bind
                propsExpression = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.NORMALIZE_PROPS), [
                    (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.GUARD_REACTIVE_PROPS), [
                        propsExpression
                    ])
                ]);
                break;
        }
    }
    return {
        props: propsExpression,
        directives: runtimeDirectives,
        patchFlag: patchFlag,
        dynamicPropNames: dynamicPropNames,
        shouldUseBlock: shouldUseBlock
    };
}
exports.buildProps = buildProps;
// Dedupe props in an object literal.
// Literal duplicated attributes would have been warned during the parse phase,
// however, it's possible to encounter duplicated `onXXX` handlers with different
// modifiers. We also need to merge static and dynamic class / style attributes.
// - onXXX handlers / style: merge into array
// - class: merge into single expression with concatenation
function dedupeProperties(properties) {
    var knownProps = new Map();
    var deduped = [];
    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];
        // dynamic keys are always allowed
        if (prop.key.type === 8 /* NodeTypes.COMPOUND_EXPRESSION */ || !prop.key.isStatic) {
            deduped.push(prop);
            continue;
        }
        var name_4 = prop.key.content;
        var existing = knownProps.get(name_4);
        if (existing) {
            if (name_4 === 'style' || name_4 === 'class' || (0, shared_1.isOn)(name_4)) {
                mergeAsArray(existing, prop);
            }
            // unexpected duplicate, should have emitted error during parse
        }
        else {
            knownProps.set(name_4, prop);
            deduped.push(prop);
        }
    }
    return deduped;
}
function mergeAsArray(existing, incoming) {
    if (existing.value.type === 17 /* NodeTypes.JS_ARRAY_EXPRESSION */) {
        existing.value.elements.push(incoming.value);
    }
    else {
        existing.value = (0, ast_1.createArrayExpression)([existing.value, incoming.value], existing.loc);
    }
}
function buildDirectiveArgs(dir, context) {
    var dirArgs = [];
    var runtime = directiveImportMap.get(dir);
    if (runtime) {
        // built-in directive with runtime
        dirArgs.push(context.helperString(runtime));
    }
    else {
        // user directive.
        // see if we have directives exposed via <script setup>
        var fromSetup = !__BROWSER__ && resolveSetupReference('v-' + dir.name, context);
        if (fromSetup) {
            dirArgs.push(fromSetup);
        }
        else {
            // inject statement for resolving directive
            context.helper(runtimeHelpers_1.RESOLVE_DIRECTIVE);
            context.directives.add(dir.name);
            dirArgs.push((0, utils_1.toValidAssetId)(dir.name, "directive"));
        }
    }
    var loc = dir.loc;
    if (dir.exp)
        dirArgs.push(dir.exp);
    if (dir.arg) {
        if (!dir.exp) {
            dirArgs.push("void 0");
        }
        dirArgs.push(dir.arg);
    }
    if (Object.keys(dir.modifiers).length) {
        if (!dir.arg) {
            if (!dir.exp) {
                dirArgs.push("void 0");
            }
            dirArgs.push("void 0");
        }
        var trueExpression_1 = (0, ast_1.createSimpleExpression)("true", false, loc);
        dirArgs.push((0, ast_1.createObjectExpression)(dir.modifiers.map(function (modifier) {
            return (0, ast_1.createObjectProperty)(modifier, trueExpression_1);
        }), loc));
    }
    return (0, ast_1.createArrayExpression)(dirArgs, dir.loc);
}
exports.buildDirectiveArgs = buildDirectiveArgs;
function stringifyDynamicPropNames(props) {
    var propsNamesString = "[";
    for (var i = 0, l = props.length; i < l; i++) {
        propsNamesString += JSON.stringify(props[i]);
        if (i < l - 1)
            propsNamesString += ', ';
    }
    return propsNamesString + "]";
}
function isComponentTag(tag) {
    return tag === 'component' || tag === 'Component';
}
