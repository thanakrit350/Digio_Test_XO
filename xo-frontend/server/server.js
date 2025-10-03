const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const gamesRoutes = require("./routes/router");

const app = express();

app.use(cors({ origin: ["http://localhost:3000"] }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/games", gamesRoutes);

app.use((err, req, res, next) => {
  const status = err?.response?.status || 500;
  const payload = err?.response?.data || { message: err.message || "BFF error" };
  console.error("[BFF ERROR]", status, JSON.stringify(payload));
  res.status(status).json(payload);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BFF running at http://localhost:${PORT}`));
