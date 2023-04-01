import { ObjectId, InsertOneResult, DeleteResult, UpdateResult } from "mongodb";
import DatabaseDriver from "../database/database_driver";
import { ApiError } from "../helpers/error_handlers";
import { DatabaseError } from "../database/driver_exceptions";

export interface ModelSchema {
    _id: ObjectId;
}

export type ExcludeId<Schema extends ModelSchema> = Omit<Schema, "_id">;

export type SortBySchema<Schema extends ModelSchema> = { [Field in keyof Schema]: -1 | 1 };

export abstract class Model<Schema extends ModelSchema> {
    protected constructor(modelCollection: DatabaseDriver, id: ObjectId) {
        this._id = id;
        this._changeSet = {};
        this._collection = modelCollection;
    }

    public static isValidId(id: string | number | ObjectId) {
        return ObjectId.isValid(id);
    }

    public static getIdFromString(id: string) {
        return new ObjectId(id);
    }

    public static getIdFromHexString(id: string) {
        return ObjectId.createFromHexString(id);
    }

    protected static async addNew(modelCollection: DatabaseDriver, newInstanceData: any) {
        let insertResult: InsertOneResult;
        try {
            insertResult = await modelCollection.insertOne(newInstanceData);
        }catch(exception: any) {
            throw new DatabaseError(
                modelCollection.connectionString,
                `Failed to create a new document! The following exception was encountered: ${exception.message}`,
                "Model",
                modelCollection.activeCollection
            );
        }
        if(!insertResult.acknowledged) {
            throw new DatabaseError(
                modelCollection.connectionString,
                "Failed to create a new document! The operation was not acknowledged by the database.",
                "Model",
                modelCollection.activeCollection
            );
        }
        return insertResult.insertedId;
    }

    protected static async deleteById(modelCollection: DatabaseDriver, documentId: ObjectId) {
        let deleteResult: DeleteResult;
        try {
            deleteResult = await modelCollection.deleteOne({ _id: documentId });
        }catch(exception: any) {
            throw new DatabaseError(
                modelCollection.connectionString,
                `Failed to delete the document with id: ${documentId}! The following exception was encountered: ${exception.message}`,
                "Model",
                modelCollection.activeCollection
            );
        }
        if(!deleteResult.acknowledged) {
            throw new DatabaseError(
                modelCollection.connectionString,
                `Failed to delete the document with id: ${documentId}! The operation was not acknowledged by the database.`,
                "Model",
                modelCollection.activeCollection
            );
        }
    }

    public updateFields(updatedValues: Partial<Schema>) {
        this._changeSet = updatedValues;
    }
    
    public async commitChanges() {
        if(this.wasEdited) {
            let updateResult: UpdateResult;
            try {
                updateResult = await this._collection.updateOne({ _id: this._id }, this._changeSet);
            }catch(exception: any) {
                throw new DatabaseError(
                    this._collection.connectionString,
                    `Failed to update the document with id: ${this._id}! The following exception was encountered: ${exception.message}`,
                    "Model",
                    this._collection.activeCollection
                );
            }
            if(!updateResult.acknowledged) {
                throw new DatabaseError(
                    this._collection.connectionString,
                    `Failed to update the document with id: ${this._id}! The operation was not acknowledged by the database.`,
                    "Model",
                    this._collection.activeCollection
                );
            }
            this._changeSet = {};
        }
    }

    public abstract getAllFields(): ModelSchema;

    public abstract reload(): Promise<void>;
    
    public async delete() {
        await Model.deleteById(this._collection, this._id);
    }

    public get id() {
        return this._id;
    }

    public get wasEdited() {
        return Object.keys(this._changeSet).length > 0;
    }

    protected _collection: DatabaseDriver;
    protected _changeSet: Partial<ExcludeId<Schema>>;
    private _id: ObjectId;
}

export class ModelError extends ApiError {
    constructor(modelName: string, modelCollection: string, errorMessage: string, statusCode = 500) {
        super(`An error was encountered on the ${modelName} model (collection "${modelCollection}"): ${errorMessage}`, statusCode, modelName);
    }
}
