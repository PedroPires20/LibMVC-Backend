import express, { Express } from "express";
import * as dotenv from "dotenv";
import { enableCors } from "./helpers/enable_cors";
import { exceptionHandler, notFoundHandler } from "./helpers/error_handlers";
import { Controller, DatabaseSettings } from "./controllers/controller";
import BookController from "./controllers/book_controller";
import LoanController from "./controllers/loan_controller";

const DEFAULT_PORT_NUMBER = 3000;

export default class App {
    constructor() {
        this._port = 0;
        this._expressApp = express();
        this._databaseSettings = { serverUrl: "", serverPort: 0, databaseName: "" };
        this._routeControllers = new Map();
    }

    public initialize() {
        this._readEnvVariables();
        this._initializeControllers();
        this._addPreHandlerMiddlewares();
        this._bindRoutes();
        this._addPostHandlerMiddlewares();
    }

    public listen() {
        this._expressApp.listen(this._port, () => {
            console.log(`App listening on port ${this._port}...`);
        });
    }

    private _readEnvVariables() {
        dotenv.config();
        this._port = parseInt(process.env.PORT || "");
        if(isNaN(this._port)) {
            this._port = DEFAULT_PORT_NUMBER;
        }
        this._databaseSettings.serverUrl = process.env.MONGO_URL || "";
        this._databaseSettings.serverPort = parseInt(process.env.MONGO_PORT || "");
        this._databaseSettings.databaseName = process.env.MONGO_DATABASE || "";
    }

    private _initializeControllers() {
        this._routeControllers.set("/books", new BookController(this._databaseSettings));
        this._routeControllers.set("/loans", new LoanController(this._databaseSettings));
        for(let controller of this._routeControllers.values()) {
            controller.initializeController();
        }
    }

    private _addPreHandlerMiddlewares() {
        this._expressApp.use(express.json());
        this._expressApp.use(enableCors);
    }

    private _bindRoutes() {
        for(const [route, controller] of this._routeControllers) {
            controller.bindRoute(this._expressApp, route);
        }
    }

    private _addPostHandlerMiddlewares() {
        this._expressApp.use(notFoundHandler);
        this._expressApp.use(exceptionHandler);
    }

    private _port: number;
    private _expressApp: Express;
    private _databaseSettings: DatabaseSettings;
    private _routeControllers: Map<string, Controller>;
}
