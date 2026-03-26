const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("land proxy running");
});

app.get("/land", (req, res) => {
  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on ${PORT}`);
});
