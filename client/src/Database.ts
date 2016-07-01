import mysql = require('mysql');

export class db {

    public static connections = {};
    public static ast: Database;
    public static connection: mysql.IConnection = null;

    protected static connectionName = '';
    protected static curConnection = null;

    public static connect(connectionName: string) {
        db.curConnection = db.getConnectionInfo(connectionName);
        db.connection = mysql.createConnection(db.curConnection);
        db.connection.connect(err => {
            if (err) {
                throw "Could not connect";
            }
        });
    }

    public static build(connectionName: string) {
        db.connect(connectionName);
        if (db.connectionName != connectionName) {
            db.connectionName = connectionName;
            var database: string = db.curConnection.database;
            var d = new Database(database);

            db.connection.query("select TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME from information_schema.COLUMNS where TABLE_SCHEMA = '" + database + "'", (err, rows: Array<{TABLE_SCHEMA:string,TABLE_NAME:string,COLUMN_NAME:string}>, fields) => {
                rows.forEach(item => {
                    let tableset = false;
                    for (var i in d.tables) {
                        if (d.tables[i].name == item.TABLE_NAME) {
                            let column: Column = new Column(item.COLUMN_NAME);
                            d.tables[i].columns.push(column);
                            tableset = true;
                            break;
                        }
                    }
                    if (!tableset) {
                        let table: Table = new Table(item.TABLE_NAME);
                        let column: Column = new Column(item.COLUMN_NAME);
                        table.columns.push(column);
                        d.tables.push(table);
                    }
                });
                db.ast = d;
            });
        }
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

export class Database extends Base {

    public tables: Table[] = [];

}

export class Table extends Base {

    public columns: Column[] = [];

}

export class Column extends Base {

}