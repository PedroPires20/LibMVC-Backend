import { z } from "zod";
import { Controller, DatabaseSettings, HttpMethod } from "./controller";
import { HandlerTypes } from "./book_controller_types";
import Book, { BookQueryFilter } from "../models/book";
import { ApiError } from "../helpers/error_handlers";

const MODULE_NAME = "BookController";
const DEFAULT_BOOKS_PER_PAGE = 10;


export default class BookController extends Controller {
    constructor(databaseConfiguration: DatabaseSettings) {
        super(databaseConfiguration);
    }

    public async getBookById(
        request: HandlerTypes.GetBookById.Request,
        response:  HandlerTypes.GetBookById.Response
    ) {
        if(!Book.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided book id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                MODULE_NAME
            );
        }
        let id = Book.getIdFromString(request.params.id);
        let book = await Book.getBookById(id);
        response.status(200).json(book.getAllFields());
    }

    public async listBooks(
        request: HandlerTypes.ListBooks.Request,
        response: HandlerTypes.ListBooks.Response
    ) {
        let booksToSkip: number;
        let limit: number;
        if(request.query.page) {
            let page = parseInt(request.query.page);
            if(isNaN(page) || page <= 0) {
                throw new ApiError(
                    `An invalid value was provided to the pages parameter! The number of pages must be a positive integer (got value {${request.query.page}} of type "${typeof request.query.page}").`,
                    400,
                    MODULE_NAME
                );
            }
            if(
                request.body.booksPerPage &&
                (typeof request.body.booksPerPage !== "number" || request.body.booksPerPage <= 0)
            ) {
                throw new ApiError(
                    `An invalid value was provided to the booksPerPage property! The booksPerPage property must be a positive integer (got value {${request.body.booksPerPage}} of type "${typeof request.body.booksPerPage}").`,
                    400,
                    MODULE_NAME
                )
            }
            let booksPerPage = request.body.booksPerPage || DEFAULT_BOOKS_PER_PAGE;
            booksToSkip = (page - 1) * booksPerPage;
            limit = booksPerPage;
        }else {
            booksToSkip = limit = 0;
        }
        if(request.body.sortBy && typeof request.body.sortBy !== "object") {
            throw new ApiError(
                `The sort by property, if provided, must be a valid object. The provided value was of type "${typeof request.body.sortBy}".`,
                400,
                MODULE_NAME
            );
        }
        let books = await Book.queryBooks({}, booksToSkip, limit, request.body.sortBy);
        response.status(200).json(books.map(book => book.getAllFields()));
    }

    public async searchBooks(
        request: HandlerTypes.SearchBooks.Request,
        response: HandlerTypes.SearchBooks.Response
    ) {
        let booksToSkip: number;
        let limit: number;
        if(request.query.page) {
            let page = parseInt(request.query.page);
            if(isNaN(page) || page <= 0) {
                throw new ApiError(
                    `An invalid value was provided to the pages parameter! The number of pages must be a positive integer (got value {${request.query.page}} of type "${typeof request.query.page}").`,
                    400,
                    MODULE_NAME
                );
            }
            if(
                request.body.booksPerPage &&
                (typeof request.body.booksPerPage !== "number" || request.body.booksPerPage <= 0)
            ) {
                throw new ApiError(
                    `An invalid value was provided to the booksPerPage property! The booksPerPage property must be a positive integer (got value {${request.body.booksPerPage}} of type "${typeof request.body.booksPerPage}").`,
                    400,
                    MODULE_NAME
                )
            }
            let booksPerPage = request.body.booksPerPage || DEFAULT_BOOKS_PER_PAGE;
            booksToSkip = (page - 1) * booksPerPage;
            limit = booksPerPage;
        }else {
            booksToSkip = limit = 0;
        }
        if(request.body.sortBy && typeof request.body.sortBy !== "object") {
            throw new ApiError(
                `The sort by property, if provided, must be a valid object. The provided value was of type "${typeof request.body.sortBy}".`,
                400,
                MODULE_NAME
            );
        }
        if(request.body.filters) {
            if(typeof request.body.sortBy !== "object") {
                throw new ApiError(
                    `The filters property, if provided, must be a valid object. The provided value was of type "${typeof request.body.sortBy}".`,
                    400,
                    MODULE_NAME
                );
            }
            for(const field of Object.keys(request.body.filters)) {
                type CategoriesFields = keyof typeof request.body.filters;
                if(field === "categories") {
                    if(request.body.filters.categories &&
                        !Array.isArray(request.body.filters.categories)) {
                            throw new ApiError(
                                `The filters "categories" field, if provided, must be an array of strings. The provided value was of type "${typeof request.body.filters?.categories}".`,
                                400,
                                MODULE_NAME
                            );
                    }
                }else if(
                    request.body.filters[field as CategoriesFields] &&
                    typeof request.body.filters[field as CategoriesFields] !== "string"
                ) {
                    throw new ApiError(
                        `The filters "${field}" field, if provided, must be a non-empty string. The provided value was of type "${typeof request.body.filters[field as CategoriesFields]}".`,
                        400,
                        MODULE_NAME
                    );
                }
            }
        }
        let filter = request.body.filters as BookQueryFilter;
        if(filter.categories) {
            filter.categories = { "$all": filter.categories } as any;
        }
        let books: Book[];
        if(!request.query.query) {
            books = await Book.queryBooks(
                request.body.filters,
                booksToSkip,
                limit,
                request.body.sortBy
            );
        }else {    
            books = await Book.textSearch(
                request.query.query,
                request.body.filters,
                { skip: booksToSkip, limit: limit, sort: request.body.sortBy }
            );
        }
        response.status(200).json(books.map(book => book.getAllFields()));
    }

    public async createBook(
        request: HandlerTypes.CreateBook.Request,
        response: HandlerTypes.CreateBook.Response
    ) {
        const bookSchemaValidator = z.object({
            isbn: z.string().nonempty(),
            title: z.string().nonempty(),
            author: z.string().nonempty(),
            categories: z.array(z.string().nonempty()),
            publisher: z.string(),
            edition: z.string(),
            format: z.string(),
            date: z.string(),
            pages: z.number().int().nonnegative(),
            copies: z.number().int().nonnegative(),
            description: z.string(),
            location: z.string()
        });
        let validationResult = bookSchemaValidator.safeParse(request.body);
        if(!validationResult.success) {
            throw new ApiError(
                `The data provided for the creation of the new book is invalid! The following inconsistencies where found: ${validationResult.error.toString()}`,
                400,
                MODULE_NAME
            );
        }
        let newBook = await Book.createBook(request.body);
        response.status(200).json({ createdId: newBook.id });
    }

    public async updateBook(
        request: HandlerTypes.UpdateBooks.Request,
        response: HandlerTypes.UpdateBooks.Response
    ) {
        const bookUpdateValidator = z.object({
            isbn: z.string().nonempty().optional(),
            title: z.string().nonempty().optional(),
            author: z.string().nonempty().optional(),
            categories: z.array(z.string().nonempty()).optional(),
            publisher: z.string().optional(),
            edition: z.string().optional(),
            format: z.string().optional(),
            date: z.string().optional(),
            pages: z.number().int().nonnegative().optional(),
            copies: z.number().int().nonnegative().optional(),
            description: z.string().optional(),
            location: z.string().optional()
        });
        if(!Book.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided book id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                MODULE_NAME
                );
        }
        let validationResult = bookUpdateValidator.safeParse(request.body);
        if(!validationResult.success) {
            throw new ApiError(
                `The provided updated data is invalid! The following inconsistencies where encountered on the fields: ${validationResult.error.toString()}`,
                400,
                MODULE_NAME
            );
        }
        let id = Book.getIdFromString(request.params.id);
        let book = await Book.getBookById(id);
        if(request.body.isbn) {
            book.isbn = request.body.isbn;
        }
        if(request.body.title) {
            book.title = request.body.title;
        }
        if(request.body.author) {
            book.author = request.body.author;
        }
        if(request.body.categories) {
            book.categories = request.body.categories;
        }
        if(request.body.publisher) {
            book.publisher = request.body.publisher;
        }
        if(request.body.edition) {
            book.edition = request.body.edition;
        }
        if(request.body.format) {
            book.format = request.body.format;
        }
        if(request.body.date) {
            book.date = request.body.date;
        }
        if(request.body.pages) {
            book.pages = request.body.pages;
        }
        if(request.body.copies) {
            book.copies = request.body.copies;
        }
        if(request.body.description) {
            book.description = request.body.description;
        }
        if(request.body.location) {
            book.location = request.body.location;
        }
        try {
            await book.commitChanges();
        }catch(exception: any) {
            throw new ApiError(
                `An error was encountered while updating the book with id="${id}". Any changes mede where rolled back. Error: ${exception}`
            );
        }
        response.status(200).send();
    }

    public async deleteBook(
        request: HandlerTypes.DeleteBook.Request,
        response: HandlerTypes.DeleteBook.Response
    ) {
        if(!Book.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided book id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                MODULE_NAME
            );
        }
        let id = Book.getIdFromString(request.params.id);
        await Book.deleteBookById(id);
        response.status(200).send();
    }

    protected _initializeModels() {
        Book.initializeModel(
            this._databaseConfiguration.serverUrl,
            this._databaseConfiguration.serverPort,
            this._databaseConfiguration.databaseName
        ).then(() => { this._isReady = true })
        .catch((exception) => { throw new ApiError(`Book model initialization failed with the following error: ${exception}`); } );
    }

    protected _initializeRoutes() {
        this._registerRoute(HttpMethod.GET, "/search", this.searchBooks);
        this._registerRoute(HttpMethod.GET, "/:id", this.getBookById);
        this._registerRoute(HttpMethod.GET, "/", this.listBooks);
        this._registerRoute(HttpMethod.POST, "/", this.createBook);
        this._registerRoute(HttpMethod.PATCH, "/:id", this.updateBook);
        this._registerRoute(HttpMethod.DELETE, "/:id", this.deleteBook);
    }
}
