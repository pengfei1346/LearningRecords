const actions = () => {
    const functionA = () => {
        //     this.columns.splice("1");
        console.log("触发a");
    };
    const functionB = () => {
        console.log("触发b");
        //     this.columns.splice("2");
    };
    return new Map([
        [{ deliverExIndex: "-1", exIndex: "-1", status: 3 }, functionA],
        [{ deliverExIndex: "-1", exIndex: "-1", status: 10 }, functionB],
        [{ deliverExIndex: "-1", exIndex: "2", status: 4 }, functionA],
        [{ deliverExIndex: "-1", exIndex: "3", status: 4 }, functionB],
    ]);
};

const onClick = (deliverExIndex, exIndex, status) => {
    let action = [...actions()].filter(
        ([key, value]) =>
            key.deliverExIndex == deliverExIndex &&
            key.exIndex == exIndex &&
            key.status == status
    );
    action.forEach(([key, value]) => value.call(this));
};

onClick("-1", "2", 4); // 触发a
