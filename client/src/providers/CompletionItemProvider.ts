import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem } from 'vscode';

import mysql = require('mysql');

export class SQLCompletionItemProvider implements CompletionItemProvider {

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Thenable<CompletionItem[]> {
        return new Promise<CompletionItem[]>((resolve, reject) => {

            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                password: "",
                database: "test"
            });

            connection.connect();

            connection.query("select TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME from information_schema.COLUMNS where TABLE_SCHEMA = 'gogs'",(err, rows, fields) => {
                console.log(rows);
            });

        });
    }

}