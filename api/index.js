import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API working ✅" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

export default app;
