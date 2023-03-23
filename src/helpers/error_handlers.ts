import { Request, Response, NextFunction } from "express";

interface ErrorResponse {
    error: string,
    module: string,
    trace: string
}

export class ApiError extends Error {
    constructor(message: string, statusCode=500, module="") {
        super(message);
        this.statusCode = (statusCode < 400 || statusCode > 599) ? 500 : Math.trunc(statusCode);
        this.module = module;
    }

    public readonly statusCode: number;
    public readonly module: string;
}

export function exceptionHandler(error: Error | ApiError, request: Request, response: Response, next: NextFunction) {
    let statusCode = 500;
    let responseObject: ErrorResponse = {
        error: error.message,
        module: "",
        trace: error.stack || ""
    };
    if(error instanceof ApiError) {
        statusCode = error.statusCode;
        responseObject.module = error.module;
    }
    response.status(statusCode).json(responseObject);
}

export function notFoundHandler(request: Request, response: Response, next: NextFunction) {
    let responseObject: ErrorResponse = {
        error: `Cannot ${request.method} ${request.url}`,
        module: "Main (router)",
        trace: ""
    };
    response.status(404).json(responseObject);
}
