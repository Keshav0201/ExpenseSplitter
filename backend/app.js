const express = require("express");
const cors = require("cors");
const userRoutes = require("./src/routes/userRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const expenseRoutes = require("./src/routes/expenseRoutes");
const balanceRoutes = require("./src/routes/balanceRoutes");
const settlementRoutes = require("./src/routes/settlementRoutes");

require("./src/config/firebase");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense Splitter API is running",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/groups", expenseRoutes);
app.use("/api/groups", balanceRoutes);
app.use("/api/groups", settlementRoutes);

module.exports = app;
