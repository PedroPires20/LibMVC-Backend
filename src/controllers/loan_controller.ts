import { z } from "zod";
import { Controller, DatabaseSettings, HttpMethod } from "./controller";
import { HandlerTypes } from "./loan_controller_types";
import Loan, { LoanQueryFilter, LoanCreationSchema } from "../models/loan";
import Book from "../models/book";
import { ApiError } from "../helpers/error_handlers";

const MODULE_NAME = "LoanController";
const DEFAULT_LOANS_PER_PAGE = 10;


export default class LoanController extends Controller {
    constructor(databaseSettings: DatabaseSettings) {
        super(databaseSettings);
    }

    public async getLoanById(
        request: HandlerTypes.GetLoanById.Request,
        response: HandlerTypes.GetLoanById.Response
    ) {
        if(!request.params.id || !Loan.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided loan id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                MODULE_NAME
            );
        }
        let id = Loan.getIdFromString(request.params.id);
        let loan = await Loan.getLoanById(id);
        response.status(200).json(loan.getAllFields());
    }

    public async listLoans(
        request: HandlerTypes.ListLoans.Request,
        response: HandlerTypes.ListLoans.Response
    ) {
        let loansToSkip = 0;
        let limit = 0;
        let mongoFilter: LoanQueryFilter = {};
        const sortValidator = z.object({
            reader: z.union([z.literal(1), z.literal(-1)]).optional(),
            phone: z.union([z.literal(1), z.literal(-1)]).optional(),
            bookId: z.union([z.literal(1), z.literal(-1)]).optional(),
            bookTitle: z.union([z.literal(1), z.literal(-1)]).optional(),
            startDate: z.union([z.literal(1), z.literal(-1)]).optional(),
            endDate: z.union([z.literal(1), z.literal(-1)]).optional(),
            renew: z.union([z.literal(1), z.literal(-1)]).optional()
        }).strict();
        type SortParam = z.infer<typeof sortValidator>;
        const filterValidator = z.object({
            reader: z.string().nonempty("A filter string, when provided must not be empty").optional(),
            bookTitle: z.string().nonempty("A filter string, when provided must not be empty").optional(),
            startDate: z.date({coerce: true}).optional(),
            endDate: z.date({coerce: true}).optional(),
            renew: z.boolean().optional(),
            late: z.boolean().optional()
        }).strict();
        type FilterParam = z.infer<typeof filterValidator>;
        let sort: SortParam | undefined;
        let filter: FilterParam | undefined;
        if(request.query.page) {
            let page = parseInt(request.query.page);
            if(isNaN(page) || page <= 0) {
                throw new ApiError(
                    `An invalid value was provided to the pages parameter! The number of pages must be a positive integer (got value {${request.query.page}} of type "${typeof request.query.page}").`,
                    400,
                    MODULE_NAME
                );
            }
            let loansPerPage = (request.query.ipp) ? parseInt(request.query.ipp) : DEFAULT_LOANS_PER_PAGE;
            if(isNaN(loansPerPage) || loansPerPage <= 0) {
                throw new ApiError(
                    `An invalid value was provided to the loansPerPage property! The loansPerPage property must be a positive integer (got value {${loansPerPage}}).`,
                    400,
                    MODULE_NAME
                );
            }
            loansToSkip = (page - 1) * loansPerPage;
            limit = loansPerPage;
        }
        if(request.query.sort) {
            try {
                sort = sortValidator.parse(JSON.parse(decodeURI(request.query.sort)));
            }catch(exception: any) {
                let errorMessage: string;
                if(exception.name === "ZodError") {
                    errorMessage = `The object provided to the sort property is invalid. The provided value was ${sort}. The following inconsistencies were encountered: ${exception}`;
                }else {
                    errorMessage = `The sort property, if provided, must be a JSON string. The provided value was "${decodeURI(request.query.sort)}".`
                }
                throw new ApiError(
                    errorMessage,
                    400,
                    MODULE_NAME
                );
            }
            
        }
        if(request.query.filter) {
            try {
                filter = filterValidator.parse(JSON.parse(decodeURI(request.query.filter)));
            }catch(exception: any) {
                let errorMessage: string;
                if(exception.name === "ZodError") {
                    errorMessage = `The object provided to the filter property is invalid. The provided value was ${filter}. The following inconsistencies were encountered: ${exception}`;
                }else {
                    errorMessage = `The filter property, if provided, must be a JSON string. The provided value was "${decodeURI(request.query.filter)}".`;
                }
                throw new ApiError(
                    errorMessage,
                    400,
                    MODULE_NAME
                );
            }
            if(filter.reader) {
                mongoFilter.reader = filter.reader;
            }
            if(filter.bookTitle) {
                mongoFilter.bookTitle = filter.bookTitle;
            }
            if(filter.startDate) {
                mongoFilter.startDate = new Date(filter.startDate);
            }
            if(filter.endDate) {
                mongoFilter.endDate = new Date(filter.endDate);
            }
            if(filter.late !== undefined) {
                mongoFilter.endDate = (filter.late) ? {
                    "$lt": new Date()
                } : {
                    "$gte": new Date()
                }
            }
            if(filter.renew) {
                mongoFilter.renew = filter.renew;
            }
        }
        let loans = await Loan.queryLoans(
            mongoFilter,
            loansToSkip,
            limit,
            sort
        );
        response.status(200).json(loans.map((loan) => loan.getAllFields()));
    }

    public async listFieldValues(
        request: HandlerTypes.ListFieldValues.Request,
        response: HandlerTypes.ListFieldValues.Response
    ) {
        if(!Loan.isValidFieldName(request.params.fieldName)) {
            throw new ApiError(
                `The provided field name is invalid! The string "${request.params.fieldName}" not a valid Book object field!`,
                400,
                MODULE_NAME
            );
        }
        let fieldValues = await Loan.getDistinctFieldValues(request.params.fieldName);
        response.status(200).json(fieldValues);
    }

    public async createLoan(
        request: HandlerTypes.CreateLoan.Request,
        response: HandlerTypes.CreateLoan.Response
    ) {
        const createBodyValidator = z.object({
            reader: z.string().nonempty("The reader's name must not be empty"),
            phone: z.string().nonempty().regex(/\(\d{2,5}\)\s+9?\d{4}-?\d{4}/, "Invalid phone number format"),
            bookId: z.custom((data: any) => Book.isValidId(data || ""), { message: "The provided bookId string is not a valid MongoDB ObjectID" }),
            startDate: z.date({coerce: true}),
            duration: z.number().int().positive("The duration must me a positive integer"),
            renew: z.boolean().default(false)
        }).strict();
        let validationResult = createBodyValidator.safeParse(request.body);
        if(!validationResult.success) {
            throw new ApiError(
                `The data provided for the creation of the new loan is invalid! The following inconsistencies where found: ${validationResult.error}`,
                400,
                MODULE_NAME
            );
        }
        let loanedBook = await Book.getBookById(Book.getIdFromString(request.body.bookId as string));
        if(loanedBook.copies <= 0) {
            throw new ApiError(
                `The book requested for the new loan has no available units. BookId = "${request.body.bookId}`,
                403,
                MODULE_NAME
            );
        }
        loanedBook.copies--;
        let startDate = new Date(request.body.startDate as string);
        let endDate = new Date(startDate.getTime());
        endDate.setDate(startDate.getDate() + (request.body.duration as number))
        let newLoanData: LoanCreationSchema = {
            reader: request.body.reader as string,
            phone: request.body.phone as string,
            bookId: loanedBook.id,
            bookTitle: loanedBook.title,
            startDate: startDate,
            endDate: endDate,
            renew: request.body.renew as boolean
        }
        let newLoan = await Loan.createLoan(newLoanData);
        await loanedBook.commitChanges();
        response.status(201).json({ createdId: newLoan.id });
    }

    public async updateLoan(
        request: HandlerTypes.UpdateLoan.Request,
        response: HandlerTypes.UpdateLoan.Response
    ) {
        if(!Loan.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided loan id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                MODULE_NAME
            );
        }
        let id = Loan.getIdFromString(request.params.id);
        const updateBodyValidator = z.object({
            reader: z.string().nonempty("The reader's name must not be empty").optional(),
            phone: z.string().nonempty().regex(/\(\d{2,5}\)\s+9?\d{4}-?\d{4}/, "Invalid phone number format").optional(),
            bookId: z.custom((data: any) => Book.isValidId(data || ""), { message: "The provided bookId string is not a valid MongoDB ObjectID" }).optional(),
            startDate: z.date({coerce: true}).optional(),
            duration: z.number().int().positive("The duration must me a positive integer").optional(),
            renew: z.boolean().default(false).optional()
        }).strict();
        let validationResult = updateBodyValidator.safeParse(request.body);
        if(!validationResult.success) {
            throw new ApiError(
                `The data provided for the loan update is invalid! The following inconsistencies where found: ${validationResult.error}`,
                400,
                MODULE_NAME
            );
        }
        let loan = await Loan.getLoanById(id);
        if(request.body.reader) {
            loan.reader = request.body.reader;
        }
        if(request.body.phone) {
            loan.phone = request.body.phone
        }
        if(request.body.bookId) {
            if(!Book.isValidId(request.body.bookId)) {
                throw new ApiError(
                    `The provided book id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                    400,
                    MODULE_NAME
                );
            }
            let newBook = await Book.getBookById(Book.getIdFromString(request.body.bookId));
            if(newBook.copies <= 0) {
                throw new ApiError(
                    `The book requested to update the loan has no available units. BookId = "${request.body.bookId}"`,
                    403,
                    MODULE_NAME
                );
            }
            let currentBook = await Book.getBookById(loan.bookId);
            currentBook.copies++;
            newBook.copies--;
            await currentBook.commitChanges();
            await newBook.commitChanges();
            loan.bookId = newBook.id;
            loan.bookTitle = newBook.title;
        }
        if(request.body.duration) {
            loan.endDate = new Date(loan.startDate.getTime());
            loan.endDate.setDate(
                loan.endDate.getDate() + request.body.duration
            );
        }
        if(request.body.startDate) {
            let newStartDate = new Date(request.body.startDate);
            let newEndDate = new Date(request.body.startDate);
            newEndDate.setDate(newStartDate.getDate() + loan.duration);
            loan.startDate = newStartDate;
            loan.endDate = newEndDate;
        }
        if(request.body.renew) {
            loan.renew = request.body.renew;
        }
        try {
            await loan.commitChanges();
        }catch(exception: any) {
            throw new ApiError(
                `An error was encountered while updating the book with id="${id}". Any changes mede where rolled back. Error: ${exception}`
            );
        }
        response.status(200).send();
    }

    public async deleteLoan(
        request: HandlerTypes.DeleteLoan.Request,
        response: HandlerTypes.DeleteLoan.Response
    ) {
        if(!Loan.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided loan id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                MODULE_NAME
            );
        }
        let id = Loan.getIdFromString(request.params.id);
        let loan = await Loan.getLoanById(id);
        let loanedBook = await Book.getBookById(loan.bookId);
        loanedBook.copies++;
        await Loan.deleteLoanById(id);
        await loanedBook.commitChanges();
        response.status(200).send();
    }

    protected override _initializeModels(): void {
        (async () => {
            await Loan.initializeModel(
                this._databaseConfiguration.serverUrl,
                this._databaseConfiguration.serverPort,
                this._databaseConfiguration.databaseName
            )
            await Book.initializeModel(
                this._databaseConfiguration.serverUrl,
                this._databaseConfiguration.serverPort,
                this._databaseConfiguration.databaseName
            );
        })().then(() => { this._isReady = true; })
        .catch((exception) => { throw new ApiError(`A model used by the LoanController failed to initialize with the following error: ${exception}`, 500, MODULE_NAME); });
    }

    protected override _initializeRoutes(): void {
        this._registerRoute(HttpMethod.GET, "/fields/:fieldName", this.listFieldValues);
        this._registerRoute(HttpMethod.GET, "/:id", this.getLoanById);
        this._registerRoute(HttpMethod.GET, "/", this.listLoans);
        this._registerRoute(HttpMethod.POST, "/", this.createLoan);
        this._registerRoute(HttpMethod.PATCH, "/:id", this.updateLoan);
        this._registerRoute(HttpMethod.DELETE, "/:id", this.deleteLoan);
    }
}
