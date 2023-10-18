"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSlotOutlet = exports.transformSlotOutlet = void 0;
var ast_1 = require("../ast");
var utils_1 = require("../utils");
var transformElement_1 = require("./transformElement");
var errors_1 = require("../errors");
var runtimeHelpers_1 = require("../runtimeHelpers");
var shared_1 = require("@vue/shared/");
var transformSlotOutlet = function (node, context) {
    if ((0, utils_1.isSlotOutlet)(node)) {
        var children = node.children, loc = node.loc;
        var _a = processSlotOutlet(node, context), slotName = _a.slotName, slotProps = _a.slotProps;
        var slotArgs = [
            context.prefixIdentifiers ? "_ctx.$slots" : "$slots",
            slotName,
            '{}',
            'undefined',
            'true'
        ];
        var expectedLen = 2;
        if (slotProps) {
            slotArgs[2] = slotProps;
            expectedLen = 3;
        }
        if (children.length) {
            slotArgs[3] = (0, ast_1.createFunctionExpression)([], children, false, false, loc);
            expectedLen = 4;
        }
        if (context.scopeId && !context.slotted) {
            expectedLen = 5;
        }
        slotArgs.splice(expectedLen); // remove unused arguments
        node.codegenNode = (0, ast_1.createCallExpression)(context.helper(runtimeHelpers_1.RENDER_SLOT), slotArgs, loc);
    }
};
exports.transformSlotOutlet = transformSlotOutlet;
function processSlotOutlet(node, context) {
    var slotName = "\"default\"";
    var slotProps = undefined;
    var nonNameProps = [];
    for (var i = 0; i < node.props.length; i++) {
        var p = node.props[i];
        if (p.type === 6 /* NodeTypes.ATTRIBUTE */) {
            if (p.value) {
                if (p.name === 'name') {
                    slotName = JSON.stringify(p.value.content);
                }
                else {
                    p.name = (0, shared_1.camelize)(p.name);
                    nonNameProps.push(p);
                }
            }
        }
        else {
            if (p.name === 'bind' && (0, utils_1.isStaticArgOf)(p.arg, 'name')) {
                if (p.exp)
                    slotName = p.exp;
            }
            else {
                if (p.name === 'bind' && p.arg && (0, utils_1.isStaticExp)(p.arg)) {
                    p.arg.content = (0, shared_1.camelize)(p.arg.content);
                }
                nonNameProps.push(p);
            }
        }
    }
    if (nonNameProps.length > 0) {
        var _a = (0, transformElement_1.buildProps)(node, context, nonNameProps, false, false), props = _a.props, directives = _a.directives;
        slotProps = props;
        if (directives.length) {
            context.onError((0, errors_1.createCompilerError)(36 /* ErrorCodes.X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET */, directives[0].loc));
        }
    }
    return {
        slotName: slotName,
        slotProps: slotProps
    };
}
exports.processSlotOutlet = processSlotOutlet;
