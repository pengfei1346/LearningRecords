//对于新项目来说推荐使用模块做为组织代码的方式。

//  使用命名空间
// 命名空间是位于全局命名空间下的一个普通的带有名字的JavaScript对象。 这令命名空间十分容易使用。 它们可以在多文件中同时使用，并通过--outFile结合在一起。 命名空间是帮你组织Web应用不错的方式，你可以把所有依赖都放在HTML页面的<script>标签里。
// 使用模块
// 像命名空间一样，模块可以包含代码和声明。 不同的是模块可以声明它的依赖。


//  编译器首先尝试去查找相应路径下的.ts，.tsx再或者.d.ts。 如果这些文件都找不到，编译器会查找外部模块声明。 回想一下，它们是在.d.ts文件里声明的。


//  myModules.d.ts
// In a .d.ts file or .ts file that is not a module:
declare module "SomeModule" {
    export function fn(): string;
}

//  myOtherModule.ts

/// <reference path="myModules.d.ts" />
import * as m from "SomeModule";


















