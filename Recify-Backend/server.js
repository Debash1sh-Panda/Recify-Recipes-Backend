require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const dbConnection = require("./config/database.config");
const setupRoutes = require("./routes/main.mount.routes");
const recify = express();
const baseUrl = process.env.BASE_URI

// cors policy
const allowedOrigins = [
  `${process.env.FRONTEND_ORIGIN_URL}`
];

recify.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const message =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(message), false);
    },
    methods: "GET,POST,PUT,PATCH,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// middleware libraries
recify.use(cookieParser());

if (process.env.NODE_ENV === "dev") {
  recify.use(morgan("dev"));
}

recify.use(helmet());

recify.use(express.json());

recify.use(bodyParser.urlencoded({ extended: true }));

setupRoutes(`${process.env.BASE_URI}`, recify);

dbConnection();

recify.listen(process.env.PORT || 2020, () =>
  console.log(`Yahh 🤠, Server is runnig on PORT: ${process.env.PORT || 2020}`)
);

recify.get(`${baseUrl}`, (req, res) => res.send("Hay 👋🏻, I am recify Server!"));
