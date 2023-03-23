import express, { Request, Response, NextFunction } from "express";
import { exceptionHandler, notFoundHandler } from "./helpers/error_handlers";

// Initializing application components
const apiPort = process.env.PORT || 3000;
const app = express();

// Adding middlewares
app.use(express.json());
app.use(exceptionHandler);

// Defining the routes
app.get("/", (req, res) => { res.status(200).json({ message: `Hello, ${req.body.name}!` }); console.log("Received a request!"); });

// Adding the handler for missing routes (404)
app.use(notFoundHandler);

// Starting the app and listening for requests
app.listen(apiPort, () => {
    console.log(`App listening on port ${apiPort}...`);
});
