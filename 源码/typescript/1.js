// /*
// * 如何基于一个已有类型, 扩展出一个大部分内容相似,  但是有部分区别的类型?
// * */
// interface Props {
//     name: string,
//     age: number,
//     hobby?: number[],
//     father: string
// }
// let aa: Props = {
//     age: 0,
//     father: "",
//     name: "",
//     hobby: [11]
// }
//
// function identity<T>(arg: T): T {
//     return arg;
// }
//
// console.log(identity(1));
//
//
// //
//
// interface Test {
//     name: string;
//     sex: number;
//     height: string;
// }
//
// type Sex = Pick<Test, 'sex'>;
//
// const a: Sex = { sex: 1 };
//
// type WithoutSex = Omit<Test, 'sex'>;
//
// const b: WithoutSex = { name: '1111', height: 'sss' };
//
//
var Student = /** @class */ (function () {
    function Student(firstName, middleInitial, lastName) {
        this.firstName = firstName;
        this.middleInitial = middleInitial;
        this.lastName = lastName;
        this.fullName = firstName + " " + middleInitial + " " + lastName;
        return this;
    }
    Student.prototype.myToString = function () {
        return '';
    };
    Student.prototype.method1 = function () {
    };
    Student.a = 1;
    return Student;
}());
// @ts-ignore
var myStudent = new Student('1--', '2');
console.log(myStudent);
// interface Person {
//     firstName: string;
//     lastName: string;
// }
//
// function greeter(person : Person) {
//     return "Hello, " + person.firstName + " " + person.lastName;
// }
//
// let user = new Student("Jane", "M.", "User");
//
// greeter(user);
// 类型注解
/*
* 基本类型： string number boolean undefined null symbol (bigint)
* 对象类型： object - 数组、对象、函数等
* */
