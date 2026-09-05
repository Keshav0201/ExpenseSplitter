const { calculateSplit } = require("./splitCalculator");

console.log(
    "Equal:",
    calculateSplit(
        10000,
        "equal",
        ["A", "B", "C"]
    )
);

console.log(
    "Exact:",
    calculateSplit(
        10000,
        "exact",
        [
            {
                userId: "A",
                amountPaise: 5000
            },
            {
                userId: "B",
                amountPaise: 3000
            },
            {
                userId: "C",
                amountPaise: 2000
            }
        ]
    )
);

console.log(
    "Percentage:",
    calculateSplit(
        10000,
        "percentage",
        [
            {
                userId: "A",
                percentage: 50
            },
            {
                userId: "B",
                percentage: 30
            },
            {
                userId: "C",
                percentage: 20
            }
        ]
    )
);