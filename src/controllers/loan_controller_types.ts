import * as express from "express";
import type { LoanExtraFields, LoanSchema } from "../models/loan";
import { ExcludeId, SortBySchema } from "../models/model";
import { ObjectId } from "mongodb";

type LoanAllFields = LoanSchema & LoanExtraFields;


export namespace HandlerTypes {
    export namespace GetLoanById {
        interface RouteParameters {
            id?: string
        }

        export type Request = express.Request<
            RouteParameters,
            LoanAllFields,
            {},
            {}
        >;

        export type Response = express.Response<LoanAllFields>;
    }

    export namespace ListLoans {
        interface QueryParameters {
            page?: string
        }

        interface RequestBody {
            loansPerPage?: number,
            filters?: {
                reader: string,
                bookName: string,
                loanDate: string,
                endDate: string,
                late: boolean,
                renew: boolean
            }
            sortBy?: SortBySchema<LoanAllFields>
        }

        export type Request = express.Request<
            {},
            LoanAllFields[],
            RequestBody,
            QueryParameters
        >;

        export type Response = express.Response<LoanAllFields[]>;
    }

    export namespace CreateLoan {
        interface RequestBody {
            reader?: string, 
            phone?: string,
            bookId?: string,
            startDate?: string,
            duration?: number,
            renew?: boolean
        }

        interface ResponseBody {
            createdId: ObjectId
        }

        export type Request = express.Request<
            {},
            ResponseBody,
            RequestBody,
            {}
        >;

        export type Response = express.Response<ResponseBody>;
    }

    export namespace UpdateLoan {
        interface RouteParameters {
            id: string
        }

        interface RequestBody {
            reader?: string, 
            phone?: string,
            bookId?: string,
            startDate?: string,
            duration?: number,
            renew?: boolean
        }

        export type Request = express.Request<
            RouteParameters,
            {},
            RequestBody,
            {}
        >;

        export type Response = express.Response<{}>;
    }

    export namespace DeleteLoan {
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