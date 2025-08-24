const express = require("express");
const { isAuth } = require("../middlewares/isAuth.middlewares");
const { getFeed, getExploreFeed } = require("../controllers/feeds.controllers");
const route = express.Router();

route.post("/getfeed", isAuth, getFeed);
route.post("/explore", getExploreFeed);

module.exports = route;
