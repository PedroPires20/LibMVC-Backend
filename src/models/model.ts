import { ObjectId, InsertOneResult, DeleteResult, UpdateResult } from "mongodb";
import DatabaseDriver from "database/database_driver";
import { DatabaseError } from "database/driver_exceptions";

export interface ModelSchema {
    _id: ObjectId;
}

type ExcludeId<Schema extends ModelSchema> = Omit<Schema, "_id">;

export abstract class Model<Schema extends ModelSchema> {
    public static async addNew(modelCollection: DatabaseDriver, newInstanceData: any) {
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

    public static async deleteById(modelCollection: DatabaseDriver, documentId: ObjectId) {
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

    protected constructor(modelCollection: DatabaseDriver, id: ObjectId) {
        this._id = id;
        this._changeSet = {};
        this._collection = modelCollection;
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
    
    public async delete() {
        await Model.deleteById(this._collection, this._id);
    }

    public get id() {
        return this._id;
    }

    public get wasEdited() {
        return Object.keys(this._changeSet).length > 0;
    }

    private _collection: DatabaseDriver;
    private _id: ObjectId;
    protected _changeSet: Partial<ExcludeId<Schema>>;
}
