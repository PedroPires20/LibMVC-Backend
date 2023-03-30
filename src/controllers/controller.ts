import { Express, Router, Request, Response, RequestHandler } from "express";
import { ApiError } from "../helpers/error_handlers";

export interface DatabaseSettings {
    serverUrl: string,
    serverPort: number,
    databaseName: string
}

export enum HttpMethod {
    ALL,
    GET,
    POST,
    PUT,
    DELETE,
    PATCH,
    OPTIONS,
    HEAD
}

type AsyncRequestHandler<RequestType = Request, ResponseType = Response> = (
    request: RequestType,
    response: ResponseType
) => Promise<void>;

export abstract class Controller {
    constructor(databaseConfiguration: DatabaseSettings) {
        this._databaseConfiguration = databaseConfiguration;
        this._router = Router();
        this._isReady = false;
    }

    public initializeController() {
        try {
            this._initializeModels();
            this._initializeRoutes();
            this._isReady = true;
        }catch(exception: any) {
            console.error(`Controller initialization failed with the flowing error: ${exception}`);
            throw exception;
        }
    }

    public bindRoute(app: Express, path: string) {
        app.use(path, this._router);
    }

    protected _registerRoute<RequestType, ResponseType>(
        method: HttpMethod,
        path: string,
        handler: AsyncRequestHandler<RequestType, ResponseType>
    ) {
        switch(method) {
            case HttpMethod.ALL: 
                this._router.all(path, this._asyncHandlerWrapper(handler));
                break;
            case HttpMethod.GET:
                this._router.get(path, this._asyncHandlerWrapper(handler));
                break;
            case HttpMethod.POST:
                this._router.post(path, this._asyncHandlerWrapper(handler));
                break;
            case HttpMethod.PUT:
                this._router.put(path, this._asyncHandlerWrapper(handler));
                break;
            case HttpMethod.DELETE:
                this._router.delete(path, this._asyncHandlerWrapper(handler));
                break;
            case HttpMethod.PATCH:
                this._router.patch(path, this._asyncHandlerWrapper(handler));
                break;
            case HttpMethod.OPTIONS:
                this._router.options(path, this._asyncHandlerWrapper(handler));
                break;
            case HttpMethod.HEAD:
                this._router.head(path, this._asyncHandlerWrapper(handler));
                break;
        }
    }

    private _asyncHandlerWrapper<RequestType, ResponseType>(handler: AsyncRequestHandler<RequestType, ResponseType>): RequestHandler {
        return async (request, response, next) => {
            try {
                if(!this._isReady) {
                    console.log("Error: a handler function of a non-initialized controller was called!");
                    throw new ApiError(
                        `The resource on the requested URL is not ready to take requests: the controller was not initialized`,
                        503,
                        "Controller"
                        );
                }
                await handler(request as RequestType, response as ResponseType);
            }catch(exception: any) {
                next(exception);
            }
        };
    }

    protected abstract _initializeModels(): void;

    protected abstract _initializeRoutes(): void;

    protected readonly _databaseConfiguration: DatabaseSettings;
    protected _isReady: boolean;
    private _router: Router;
}
