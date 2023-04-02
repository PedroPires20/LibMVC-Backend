import { MongoClient, Collection } from "mongodb";
import { DatabaseConnectionError, DriverNotConnected, NoActiveCollection, DatabaseError } from "./driver_exceptions";

export default class DatabaseDriver {
    constructor(serverAddress: string, serverPort: number, databaseName: string) {
        this._serverAddress = serverAddress;
        this._serverPort = serverPort;
        this._databaseName = databaseName;
        this._connectionString = `mongodb://${this._serverAddress}:${this._serverPort}/${this._databaseName}`;
        this._mongoClient = new MongoClient(this._connectionString);
        this._isConnected = false;
        this._activeCollectionName = "";
    }

    public async connect() {
        try {
            await this._mongoClient.connect();
            this._isConnected = true;
        }catch(exception: any) {
            throw new DatabaseConnectionError(this._serverAddress, this._serverPort, exception.message);
        }
    }

    public async disconnect(forceDisconnect = false) {
        try {
            await this._mongoClient.close(forceDisconnect);
        }catch(exception: any) {
            throw new DatabaseError(this._connectionString, "Failed to close connection with the database!\nThe following error was encountered: " + exception.message);
        }
    }

    public listCollections() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        let collectionNames: string[] = [];
        this._mongoClient.db().listCollections({}, { nameOnly: true }).forEach((collectionInfo) => {
            collectionNames.push(collectionInfo.name)
        });
        return collectionNames;
    }

    public async createCollection(newCollectionName: string) {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        await this._mongoClient.db().createCollection(newCollectionName);
    }

    public async dropCollection(collectionName: string) {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        await this._mongoClient.db().dropCollection(collectionName);
    }
    
    public get activeCollection() {
        return this._activeCollectionName;
    }

    public set activeCollection(collectionName: string) {
        this._activeCollectionName = collectionName;
        this._activeCollection = this._mongoClient.db().collection(this._activeCollectionName);
    }

    public get find() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.find.bind(this._activeCollection);
    }

    public get findOne() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.findOne.bind(this._activeCollection);
    }

    public get distinct() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.distinct.bind(this._activeCollection);
    }

    public get insertOne() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.insertOne.bind(this._activeCollection);
    }

    public get insertMany() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.insertMany.bind(this._activeCollection);
    }

    public get updateOne() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.updateOne.bind(this._activeCollection);
    }

    public get updateMany() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.updateMany.bind(this._activeCollection);
    }

    public get findOneAndUpdate() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.findOneAndUpdate.bind(this._activeCollection);
    }

    public get deleteOne() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.deleteOne.bind(this._activeCollection);
    }

    public get deleteMany() {
        if(!this._isConnected) {
            throw new DriverNotConnected(this._connectionString);
        }
        if(!this._activeCollection) {
            throw new NoActiveCollection(this._connectionString);
        }
        return this._activeCollection.deleteMany.bind(this._activeCollection);
    }
    
    public get connectionString() {
        return this._connectionString;
    }

    public get databaseName() {
        return this._databaseName;
    }

    public get isConnected() {
        return this._isConnected;
    }

    private _serverAddress: string;
    private _serverPort: number;
    private _databaseName: string;
    private _connectionString: string;
    private _mongoClient: MongoClient;
    private _isConnected: boolean;
    private _activeCollectionName: string;
    private _activeCollection?: Collection;
}
