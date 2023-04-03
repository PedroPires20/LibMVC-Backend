import { ObjectId, Filter, FindOptions, Document, UpdateFilter } from "mongodb";
import { z } from "zod";
import DatabaseDriver from "../database/database_driver";
import { Model, ModelSchema, SchemaValidationResult, ExcludeId, ModelError, SortBySchema } from "./model";

const COLLECTION_NAME = "loans";

export interface LoanSchema extends ModelSchema {
    reader: string,
    phone: string,
    bookId: ObjectId,
    bookName: string,
    date: Date,
    duration: number,
    isRenew: boolean
}

export type LoanQueryFilter = Filter<ExcludeId<LoanSchema>>;

type LoanFieldNames = keyof ExcludeId<LoanSchema>;


export default class Loan extends Model<LoanSchema> {
    private constructor(modelCollection: DatabaseDriver, loanData: LoanSchema) {
        super(modelCollection, loanData._id);
        this._reader = loanData.reader;
        this._phone = loanData.phone;
        this._bookId = loanData.bookId;
        this._bookName = loanData.bookName;
        this._date = loanData.date;
        this._duration = loanData.duration;
        this._isRenew = loanData.isRenew;
    }

    public static async initializeModel(dbServerAddress: string, dbServerPort: number, dbName: string) {
        this._modelCollection = new DatabaseDriver(dbServerAddress, dbServerPort, dbName);
        await this._modelCollection.connect();
        this._modelCollection.activeCollection = COLLECTION_NAME;
    }

    public static async createLoan(newLoanData: ExcludeId<LoanSchema>) {
        let newBookId = await super.addNew(this._modelCollection, newLoanData);
        return new Loan(this._modelCollection, { _id: newBookId, ...newLoanData });
    }

    public static validateSchema(targetObject: any): SchemaValidationResult {
        const loanSchemaValidator = z.object({
            reader: z.string().nonempty(),
            phone: z.string(),
            bookName: z.string().nonempty(),
            date: z.date(),
            duration: z.number().int().positive(),
            isRenew: z.boolean()
        });
        let parseResult = loanSchemaValidator.safeParse(targetObject);
        if(!parseResult.success) {
            return { isValid: false, errorMessage: parseResult.error.format().toString() };    
        }
        return { isValid: true };
    }

    public static validateUpdateSchema(targetObject: any): SchemaValidationResult {
        const loanSchemaValidator = z.object({
            reader: z.string().nonempty().optional(),
            phone: z.string().optional(),
            bookName: z.string().nonempty().optional(),
            date: z.date().optional(),
            duration: z.number().int().positive().optional(),
            isRenew: z.boolean().optional()
        });
        let parseResult = loanSchemaValidator.safeParse(targetObject);
        if(!parseResult.success) {
            return { isValid: false, errorMessage: parseResult.error.format().toString() };    
        }
        return { isValid: true };
    }


    public static async getLoanById(id: ObjectId) {
        let resultData = await this._modelCollection.findOne({ _id: id });
        if(resultData == null) {
            throw new ModelError(
                this.name,
                COLLECTION_NAME,
                `A loan with id="${id}" was not found on the database (no data returned)`,
                404
            );
        }
        return new Loan(this._modelCollection, resultData as LoanSchema);
    }

    public static async queryLoans(
        filter: LoanQueryFilter = {},
        skip = 0,
        limit = 0,
        sortBy?: SortBySchema<LoanSchema>,
        options?: FindOptions
    ) {
        let cursor = this._modelCollection.find(
            filter as Filter<Document>,
            options
        ).skip(skip).limit(limit);
        if(sortBy) {
            cursor.sort(sortBy);
        }
        return cursor.map(
            (loanData) => new Loan(this._modelCollection, loanData as LoanSchema)
        ).toArray();
    }

    public static async getDistinctFieldValues(fieldName: LoanFieldNames) {
        return this._modelCollection.distinct(fieldName);
    }

    public override async updateFields(updatedValues: UpdateFilter<LoanSchema>) {
        let updateResult = await this._collection.findOneAndUpdate(
            { _id: this.id },
            updatedValues as UpdateFilter<Document>,
            { returnDocument: "after" }
        );
        if(!updateResult.ok || updateResult.value == null) {
            throw new ModelError("Loan", "", "");
        }
        let updatedData = updatedValues.value as LoanSchema;
        this._reader = updatedData.reader;
        this._phone = updatedData.phone;
        this._bookName = updatedData.bookName;
        this._date = updatedData.date;
        this._duration = updatedData.duration;
        this._isRenew = updatedData.isRenew;
    }

    public static async deleteLoanById(id: ObjectId) {
        await this.deleteById(this._modelCollection, id);
    }

    public override getAllFields(): LoanSchema {
        return {
            _id: this.id,
            reader: this._reader,
            phone: this._phone,
            bookId: this._bookId,
            bookName: this._bookName,
            date: this._date,
            duration: this._duration,
            isRenew: this._isRenew
        };
    }

    public override async reload() {
        try {
            let updatedData = await this._collection.findOne({ _id: this.id }) as LoanSchema;
            this._reader = updatedData.reader;
            this._phone = updatedData.phone;
            this._bookName = updatedData.bookName;
            this._date = updatedData.date;
            this._duration = updatedData.duration;
            this._isRenew = updatedData.isRenew;
        }catch(exception: any) {
            throw new ModelError(this.constructor.name, COLLECTION_NAME, `Failed to reload the model instance data! The following exception was encountered: ${exception}`);
        }
    }

    public get reader() {
        return this._reader;
    }
    
    public set reader(reader: string) {
        this._reader = reader;
        this._changeSet.reader = reader;
    }
    
    public get phone() {
        return this._phone;
    }
    
    public set phone(phone: string) {
        this._phone = phone;
        this._changeSet.phone = phone;
    }
    
    public get bookId() {
        return this._bookId;
    }
    
    public set bookId(bookId: ObjectId) {
        this._bookId = bookId;
        this._changeSet.bookId = bookId;
    }

    public get bookName() {
        return this._bookName;
    }
    
    public set bookName(book: string) {
        this._bookName = book;
        this._changeSet.bookName = book;
    }
    
    public get date() {
        return this._date;
    }
    
    public set date(date: Date) {
        this._date = date;
        this._changeSet.date = date;
    }
    
    public get duration() {
        return this._duration;
    }
    
    public set duration(duration: number) {
        this._duration = duration;
        this._changeSet.duration = duration;
    }
    
    public get isRenew() {
        return this._isRenew;
    }
    
    public set isRenew(isRenew: boolean) {
        this._isRenew = isRenew;
        this._changeSet.isRenew = isRenew;
    }
    
    private static _modelCollection: DatabaseDriver;

    private _reader: string;
    private _phone: string;
    private _bookId: ObjectId;
    private _bookName: string;
    private _date: Date;
    private _duration: number;
    private _isRenew: boolean;
}
