import { Request, Response, NextFunction } from "express";


export function enableCors(
    request: Request,
    response: Response,
    next: NextFunction
) {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
}
