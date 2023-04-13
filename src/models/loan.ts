import { ObjectId, Filter, FindOptions, Document, UpdateFilter } from "mongodb";
import { z } from "zod";
import DatabaseDriver from "../database/database_driver";
import { Model, ModelSchema, SchemaValidationResult, ExcludeId, ModelError, SortBySchema } from "./model";

const COLLECTION_NAME = "loans";
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export interface LoanSchema extends ModelSchema {
    reader: string,
    phone: string,
    bookId: ObjectId,
    bookName: string,
    startDate: Date,
    endDate: Date,
    renew: boolean
}

export interface LoanExtraFields {
    duration: number,
    daysRemaining: number,
    late: boolean
}

export type LoanCreationSchema = ExcludeId<LoanSchema>;

export type LoanQueryFilter = Filter<ExcludeId<LoanSchema>>;

type LoanFieldNames = keyof ExcludeId<LoanSchema>;


export default class Loan extends Model<LoanSchema> {
    private constructor(modelCollection: DatabaseDriver, loanData: LoanSchema) {
        super(modelCollection, loanData._id);
        this._reader = loanData.reader;
        this._phone = loanData.phone;
        this._bookId = loanData.bookId;
        this._bookName = loanData.bookName;
        this._startDate = loanData.startDate;
        this._endDate = loanData.endDate;
        this._renew = loanData.renew;
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
            startDate: z.date(),
            endDate: z.date(),
            renew: z.boolean()
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
            startDate: z.date().optional(),
            endDate: z.date().optional(),
            renew: z.boolean().optional()
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

    public override async updateFields(updatedValues: Partial<ExcludeId<LoanSchema>>) {
        Object.keys(updatedValues).forEach((field) => {
            if(!updatedValues[field as keyof Partial<ExcludeId<LoanSchema>>]) {
                delete updatedValues[field as keyof Partial<ExcludeId<LoanSchema>>];
            }
        })
        let updateResult = await this._collection.findOneAndUpdate(
            { _id: this.id },
            { $set: updatedValues },
            { returnDocument: "after" }
        );
        if(!updateResult.ok || updateResult.value == null) {
            throw new ModelError("Loan", "", "");
        }
        let updatedData = updateResult.value as LoanSchema;
        this._reader = updatedData.reader;
        this._phone = updatedData.phone;
        this._bookName = updatedData.bookName;
        this._startDate = updatedData.startDate;
        this._endDate = updatedData.endDate;
        this._renew = updatedData.renew;
    }

    public static async deleteLoanById(id: ObjectId) {
        await this.deleteById(this._modelCollection, id);
    }

    public override getAllFields(): LoanSchema & LoanExtraFields {
        return {
            _id: this.id,
            reader: this._reader,
            phone: this._phone,
            bookId: this._bookId,
            bookName: this._bookName,
            startDate: this._startDate,
            endDate: this._endDate,
            duration: this.duration,
            daysRemaining: this.daysRemaining,
            renew: this._renew,
            late: this.late
        };
    }

    public override async reload() {
        try {
            let updatedData = await this._collection.findOne({ _id: this.id }) as LoanSchema;
            this._reader = updatedData.reader;
            this._phone = updatedData.phone;
            this._bookName = updatedData.bookName;
            this._startDate = updatedData.startDate;
            this._endDate = updatedData.endDate;
            this._renew = updatedData.renew;
        }catch(exception: any) {
            throw new ModelError(this.constructor.name, COLLECTION_NAME, `Failed to reload the model instance data! The following exception was encountered: ${exception}`);
        }
    }

    public get duration() {
        return Math.trunc((this._endDate.getTime() - this._startDate.getTime()) / MILLISECONDS_PER_DAY);
    }

    public get daysRemaining() {
        return Math.trunc((this._endDate.getTime() - Date.now()) / MILLISECONDS_PER_DAY);
    }

    public get late() {
        return this._endDate < new Date();
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
    
    public get startDate() {
        return this._startDate;
    }
    
    public set startDate(date: Date) {
        this._startDate = date;
        this._changeSet.startDate = date;
    }
    
    public get endDate() {
        return this._endDate;
    }
    
    public set endDate(endDate: Date) {
        this._endDate = endDate;
        this._changeSet.endDate = endDate;
    }
    
    public get renew() {
        return this._renew;
    }
    
    public set renew(renew: boolean) {
        this._renew = renew;
        this._changeSet.renew = renew;
    }
    
    private static _modelCollection: DatabaseDriver;

    private _reader: string;
    private _phone: string;
    private _bookId: ObjectId;
    private _bookName: string;
    private _startDate: Date;
    private _endDate: Date;
    private _renew: boolean;
}
