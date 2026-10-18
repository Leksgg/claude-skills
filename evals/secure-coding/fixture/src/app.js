const express = require("express");
const users = require("./routes/users");
const files = require("./routes/files");
const webhooks = require("./routes/webhooks");

const app = express();
app.use(express.json());
app.use("/users", users);
app.use("/files", files);
app.use("/webhooks", webhooks);

module.exports = app;
