import { ApiError } from "../helpers/error_handlers";

export class DatabaseConnectionError extends ApiError {
    constructor(serverAddress: string, serverPort: number, errorMessage: string) {
        super(`Failed to connect to the MongoDb server at URL "${serverAddress}", port ${serverPort}!\nThe following error was encountered:\n${errorMessage}`, 500, "DatabaseDriver");
    }
}

export class DatabaseError extends ApiError {
    constructor(connectionString: string, errorMessage: string, module = "DatabaseDriver", collection = "") {
        super(`${errorMessage}\nMongoDB server: "${connectionString}"\nActive collection: "${collection}"`, 500, module);
    }
}

export class DriverNotConnected extends ApiError {
    constructor(connectionString: string) {
        super(`The database driver didn't initialize a connection to the MongoDB server or the connection was lost/closed\nConnection string: ${connectionString}`, 500, "DatabaseDriver");
    }
}

export class NoActiveCollection extends ApiError {
    constructor(connectionString: string) {
        super(`The current database driver has no active collection! Please ensure that a collection was set before making queries...\nConnection string: ${connectionString}`, 500, "DatabaseDriver");
    }
}
