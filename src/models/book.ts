import { ObjectId, Filter, FindOptions, Document } from "mongodb";
import DatabaseDriver from "database/database_driver";
import { Model, ModelSchema, ExcludeId, ModelError } from "./model";

const COLLECTION_NAME = "books";

interface BookSchema extends ModelSchema {
    isbn: string,
    title: string,
    author: string,
    categories: string[],
    publisher: string,
    edition: string,
    format: string,
    date: string,
    pages: number,
    copies: number,
    description: string,
    location: string
}

type BookQueryFilter = Filter<ExcludeId<BookSchema>>;

type BookFieldNames = keyof ExcludeId<BookSchema>;

export default class Book extends Model<BookSchema> {
    private constructor(modelCollection: DatabaseDriver, bookData: BookSchema) {
        super(modelCollection, bookData._id);
        this._isbn = bookData.isbn;
        this._title = bookData.title;
        this._author = bookData.author;
        this._categories = bookData.categories;
        this._publisher = bookData.publisher;
        this._edition = bookData.edition;
        this._format = bookData.format;
        this._date = bookData.date;
        this._pages = bookData.pages;
        this._copies = bookData.copies;
        this._description = bookData.description;
        this._location = bookData.location;
    }

    public static initializeModel(dbServerAddress: string, dbServerPort: number, dbName: string) {
        this._modelCollection = new DatabaseDriver(dbServerAddress, dbServerPort, dbName);
        this._modelCollection.activeCollection = COLLECTION_NAME;
    }

    public static async createBook(newBookData: ExcludeId<BookSchema>) {
        let newBookId = await super.addNew(this._modelCollection, newBookData);
        return new Book(this._modelCollection, { _id: newBookId, ...newBookData });
    }

    public static async getBookById(id: ObjectId) {
        let resultData = await this._modelCollection.findOne({ _id: id });
        if(resultData == null) {
            throw new ModelError(
                this.name,
                COLLECTION_NAME,
                `A book with id="${id}" was not found on the database (no data returned)`,
                404
            );
        }
        return new Book(this._modelCollection, resultData as BookSchema);
    }

    public static async getBookByIsbn(isbn: string) {
        let resultData = await this._modelCollection.findOne({ isbn: isbn });
        if(resultData == null) {
            throw new ModelError(
                this.name,
                COLLECTION_NAME,
                `A book with the ISBN "${isbn}" was not found on the database (no data returned)`,
                404
            );
        }
        return new Book(this._modelCollection, resultData as BookSchema);
    }

    public static async runQuery(filter: BookQueryFilter = {}, options?: FindOptions) {
        return this._modelCollection.find(filter as Filter<Document>, options).map(
            (bookData) => new Book(this._modelCollection, bookData as BookSchema)
        ).toArray();
    }

    public static async textSearch(searchQuery: string, options?: FindOptions) {
        return this._modelCollection.find({
            $text: {
                $search: searchQuery,
                $language: "portuguese",
                $caseSensitive: false,
                $diacriticSensitive: true
            }
        }, options).map((bookData) => new Book(
            this._modelCollection, bookData as BookSchema)
        ).toArray();
    }

    public static async getAllFieldValues(fieldName: BookFieldNames) {
        return this._modelCollection.distinct(fieldName);
    }

    public override async reload() {
        try {
            let updatedData = await Book._modelCollection.findOne({ _id: this.id }) as BookSchema;
            this._isbn = updatedData.isbn;
            this._title = updatedData.title;
            this._author = updatedData.author;
            this._categories = updatedData.categories;
            this._publisher = updatedData.publisher;
            this._edition = updatedData.edition;
            this._format = updatedData.format;
            this._date = updatedData.date;
            this._pages = updatedData.pages;
            this._copies = updatedData.copies;
            this._description = updatedData.description;
            this._location = updatedData.location;
        }catch(exception: any) {
            throw new ModelError(this.constructor.name, COLLECTION_NAME, `Failed to reload the model instance data! The following exception was encountered: ${exception}`);
        }
    }

    public get isbn() {
        this._changeSet
        return this._isbn;
    }

    public set isbn(isbn: string) {
        this._isbn = isbn;
        this._changeSet.isbn = isbn;
    }
    
    public get title() {
        return this._title;
    }
    
    public set title(title: string) {
        this._title = title;
        this._changeSet.title = title;
    }

    public get author() {
        return this._author;
    }

    public set author(author: string) {
        this._author = author;
        this._changeSet.author = author;
    }
    
    public get categories() {
        return this._categories;
    }
    
    public set categories(categories: string[]) {
        this._categories = categories;
        this._changeSet.categories = categories;
    }
    
    public get publisher() {
        return this._publisher;
    }
    
    public set publisher(publisher: string) {
        this._publisher = publisher;
        this._changeSet.publisher = publisher;
    }
    
    public get edition() {
        return this._edition;
    }
    
    public set edition(edition: string) {
        this._edition = edition;
        this._changeSet.edition = edition;
    }
    
    public get format() {
        return this._format;
    }
    
    public set format(format: string) {
        this._format = format;
        this._changeSet.format = format;
    }
    
    public get date() {
        return this._date;
    }
    
    public set date(date: string) {
        this._date = date;
        this._changeSet.date = date;
    }
    
    public get pages() {
        return this._pages;
    }
    
    public set pages(pages: number) {
        this._pages = pages;
        this._changeSet.pages = pages;
    }
    
    public get copies() {
        return this._copies;
    }
    
    public set copies(copies: number) {
        this._copies = copies;
        this._changeSet.copies = copies;
    }
    
    public get description() {
        return this._description;
    }
    
    public set description(description: string) {
        this._description = description;
        this._changeSet.description = description;
    }
    
    public get location() {
        return this._location;
    }
    
    public set location(location: string) {
        this._location = location;
        this._changeSet.location = location;
    }
    
    private static _modelCollection: DatabaseDriver;

    private _isbn: string;
    private _title: string;
    private _author: string;
    private _categories: string[];
    private _publisher: string;
    private _edition: string;
    private _format: string;
    private _date: string;
    private _pages: number;
    private _copies: number;
    private _description: string;
    private _location: string;    
}
