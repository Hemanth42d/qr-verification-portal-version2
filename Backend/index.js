import "dotenv/config";
import express from "express";

const app = express();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello welcome");
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
