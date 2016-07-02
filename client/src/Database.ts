import { window } from 'vscode';
import mysql = require('mysql');

export class db {

    public static connections = {};
    public static ast: Connection;
    public static connection: mysql.IConnection = null;

    protected static connName = '';
    protected static curConnection: any = null;
    protected static curDatabase: string = '';

    public static connect(connectionName: string, database: string = '') {
        db.curConnection = db.getConnectionInfo(connectionName);
        db.connection = mysql.createConnection(db.curConnection);
        db.connection.connect(err => {
            if (err) {
                throw "Could not connect";
            } else {
                if (database.length > 0) {
                    db.curDatabase = database;
                }
            }
        });
    }

    public static get connectionName(): string {
        return db.connName;
    }

    public static get currentConnection(): any {
        return db.curConnection;
    }

    public static get currentDatabase(): string {
        return db.curDatabase;
    }

    public static getDbNames(): string[] {
        var dbnames: string[] = [];
        db.ast.databases.forEach(d => {
            dbnames.push(d.name);
        })
        return dbnames;
    }

    public static useDatabase(dbname: string): Thenable<boolean> {
        return new Promise(resolve => {
            console.log(`selected ${dbname}`);
            db.connection.query(`use ${dbname}`, err => {
                if (!err) {
                    db.curDatabase = dbname;
                    resolve(true);
                } else {
                    console.log(err);
                    resolve(false);
                }
            });
        })
    }

    public static build(connectionName: string): Promise<boolean> {
        return new Promise(resolve => {
            db.connect(connectionName);
            if (db.connName != connectionName) {
                db.connName = connectionName;
                var connNode = new Connection(connectionName);

                db.connection.query("select TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_COMMENT from information_schema.COLUMNS", (err, rows: Array<{TABLE_SCHEMA:string,TABLE_NAME:string,COLUMN_NAME:string,COLUMN_COMMENT:string}>, fields) => {

                    rows.forEach(item => {
                        // console.log(`${item.TABLE_SCHEMA}.${item.TABLE_NAME}.${item.COLUMN_NAME}`);
                        let d = db.getDatabase(connNode, item.TABLE_SCHEMA);
                        if (d === null) {
                            d = new Database(item.TABLE_SCHEMA);
                            connNode.databases.push(d);
                        }

                        let t = db.getTable(d, item.TABLE_NAME);
                        if (t === null) {
                            t = new Table(item.TABLE_NAME);
                            d.tables.push(t);
                        }

                        let c = db.getColumn(t, item.COLUMN_NAME);
                        if (c === null) {
                            c = new Column(item.COLUMN_NAME);
                            t.columns.push(c);
                        }

                        // // Handle the database list
                        // var dbexists: boolean = false;
                        // var dbNode = null;
                        // for (var d in connNode.databases) {
                        //     dbNode = connNode.databases[d];
                        //     if (dbNode.name == item.TABLE_SCHEMA) {
                        //         dbexists = true;
                        //         break;
                        //     }
                        // }
                        // if (!dbexists) {
                        //     connNode.databases.push(db);
                        // }

                    });

                    // rows.forEach(item => {
                        // let dbset = false;
                        // for (var d in connNode.databases) {
                        //     // Database node exists
                        //     if (connNode.databases[d].name == item.TABLE_SCHEMA) {
                        //         let dbNode: Database = connNode.databases[d];
                        //         let tableset = false;
                        //         for (var t in dbNode.tables) {
                        //             if (dbNode.tables[t].name == item.TABLE_NAME) {
                        //                 let column: Column = new Column(item.COLUMN_NAME);
                        //                 column.comment = item.COLUMN_COMMENT;
                        //                 dbNode.tables[t].columns.push(column);
                        //                 tableset = true;
                        //                 break;
                        //             }
                        //         }
                        //         // Table node does not exist
                        //         if (!tableset) {
                        //             let table: Table = new Table(item.TABLE_NAME);
                        //             let column: Column = new Column(item.COLUMN_NAME);
                        //             column.comment = item.COLUMN_COMMENT;
                        //             table.columns.push(column);
                        //             dbNode.tables.push(table);
                        //         }
                        //         dbset = true;
                        //         break;
                        //     }
                        // }
                        // // Database node does not exist
                        // if (!dbset) {
                        //     let dbNode: Database = new Database(item.TABLE_SCHEMA);
                        //     let table: Table = new Table(item.TABLE_NAME);
                        //     let column: Column = new Column(item.COLUMN_NAME);
                        //     table.columns.push(column);
                        //     dbNode.tables.push(table);
                        //     connNode.databases.push(dbNode);
                        // }
                    // });

                    // db.connection.query('select TABLE_SCHEMA, TABLE_NAME, TABLE_COMMENT from information_schema.TABLES', (err, rows: Array<{TABLE_SCHEMA:string,TABLE_NAME:string,TABLE_COMMENT:string}>, fields) => {
                    //     rows.forEach(row => {
                    //         connNode.databases.forEach(databaseNode => {
                    //             databaseNode.tables.forEach(tableNode => {
                    //                 if (databaseNode.name == row.TABLE_SCHEMA && tableNode.name == row.TABLE_NAME) {
                    //                     tableNode.comment = row.TABLE_COMMENT;
                    //                 }
                    //             });
                    //         });
                    //     });
                    // });
                    db.ast = connNode;
                    resolve(true);
                });
            }
        });
    }

    protected static getDatabase(conn: Connection, dbname: string): Database {
        for (var i in conn.databases) {
            if (conn.databases[i].name == dbname) {
                return conn.databases[i];
            }
        }
        return null;
    }

    protected static getTable(database: Database, tblname: string): Table {
        for (var i in database.tables) {
            if (database.tables[i].name == tblname) {
                return database.tables[i];
            }
        }
        return null;
    }

    protected static getColumn(table: Table, colname: string): Column {
        for (var i in table.columns) {
            if (table.columns[i].name == colname) {
                return table.columns[i];
            }
        }
        return null;
    }

    public static get connectionLength() {
        return Object.keys(db.connections).length;
    }

    public static getConnectionInfo(name: string): {} {
        for (var title in db.connections) {
            if (title == name) {
                return db.connections[title].connection;
            }
        }
        return {};
    }

}



class Base {

    public name: string = '';

    public constructor(name: string) {
        this.name = name;
    }
}

export class Connection extends Base {

    /**
     * An array of databases in the connection
     *
     * @type {Database[]}
     */
    public databases: Database[] = [];

}

export class Database extends Base {

    /**
     * An array of tables in the database
     *
     * @type {Table[]}
     */
    public tables: Table[] = [];

}

export class Table extends Base {

    /**
     * A list of columns in the table
     *
     * @type {Column[]}
     */
    public columns: Column[] = [];
    public engine: string = '';
    public indexes: any;
    public comment: string;

}

export enum DataType {
    Bit, TinyInt, Boolean, SmallInt, MediumInt, Integer, BigInt, Decimal, Float, Double,
    Date, DateTime, TimeStamp, Time, Year,
    Character, VarChar, Binary, VarBinary, TinyBlob, TinyText, Blob, Text, MediumBlob, MediumText, LongBlob, LongText, Enum, Set
}

export class Column extends Base {

    public type: DataType;
    public unsigned: boolean;
    public allowNull: boolean;
    public default: any;
    public comment: string = '';
    public collation: string = '';

}