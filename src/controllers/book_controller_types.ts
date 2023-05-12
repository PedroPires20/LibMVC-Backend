import * as express from "express";
import type { BookSchema } from "../models/book";
import { ExcludeId, SortBySchema } from "../models/model";
import { ObjectId } from "mongodb";

export namespace HandlerTypes {
    export namespace GetBookById {
        interface RouteParameters {
            id: string
        }

        export type Request = express.Request<
            RouteParameters,
            BookSchema,
            {},
            {}
        >;
        export type Response = express.Response<BookSchema>;
    }

    export namespace ListBooks {
        interface QueryParameters {
            page?: string,
            ipp?: string,
            sortBy?: string
        }

        export type Request = express.Request<
            {},
            BookSchema[],
            {},
            QueryParameters
        >;

        export type Response = express.Response<BookSchema[]>;
    }

    export namespace SearchBooks {
        interface QueryParameters {
            query?: string,
            page?: string,
            ipp?: string,
            filter?: string,
            sortBy?: string
        }

        export type Request = express.Request<
            {},
            BookSchema[],
            {},
            QueryParameters
        >;

        export type Response = express.Response<BookSchema[]>;
    }

    export namespace ListFieldValues {
        interface RouteParameters {
            fieldName: string
        }

        export type Request = express.Request<
            RouteParameters,
            any[],
            {},
            {}
        >;

        export type Response = express.Response<any[]>;
    }

    export namespace CreateBook {
        interface ResponseBody {
            createdId: ObjectId
        }

        export type Request = express.Request<
            {},
            ResponseBody,
            ExcludeId<BookSchema>,
            {}
        >;

        export type Response = express.Response<ResponseBody>;
    }

    export namespace UpdateBooks {
        interface RouteParameters {
            id: string
        }

        type UpdateBody = Omit<Partial<BookSchema>, "categories"> & {
            categories?: string[] | {
                $add: string[],
                $remove: string[]
            }
        }

        export type Request = express.Request<
            RouteParameters,
            {},
            UpdateBody,
            {}
        >;
        export type Response = express.Response<{}>;
    }

    export namespace DeleteBook {
        interface RouteParameters {
            id: string
        }

        export type Request = express.Request<
            RouteParameters,
            {},
            {},
            {}
        >;
        export type Response = express.Response<{}>;
    }
}