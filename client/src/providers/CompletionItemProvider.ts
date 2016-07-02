import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind } from 'vscode';
import { db, Connection, Database, Table, Column } from '../Database';

import mysql = require('mysql');
const Parser = require('node-sql-parser').Parser;
const parser = new Parser();

import {keywords} from '../util/keywords';

export class SQLCompletionItemProvider implements CompletionItemProvider {

    protected prevWord = '';
    protected databases: string[] = [];
    protected tables: string[] = [];

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Thenable<CompletionItem[]> {
        return new Promise<CompletionItem[]>((resolve, reject) => {

            let wordAtPosition = document.getWordRangeAtPosition(position);
            let word = document.getText(wordAtPosition);

            let ast: Connection = db.ast;
            let items: CompletionItem[] = [];

            try {
                // var astObj = parse(document.getText().replace(';', ''));
                var astObj: { from: { db: string, table: string, as: string }[] } = parser.parse(document.getText().replace(';', ''));
                this.tables = [];
                this.databases = [];
                if (db.currentDatabase.length > 0) {
                    this.databases.push(db.currentDatabase);
                }
                astObj.from.forEach(table => {
                    if (table.db != null) {
                        this.databases.push(table.db);
                    }
                    this.tables.push(table.table);
                });
                console.log(astObj);
            } catch (e) {
                // console.error(e);
            }

            let reg: RegExp = new RegExp(`${word}`, 'ig');

            // keywords.forEach(keyword => {
            //     if (reg.test(keyword)) {
            //         let insertString = keyword;
            //         if (word == word.toLowerCase()) {
            //             insertString = keyword.toLocaleLowerCase();
            //         }
            //         let c = new CompletionItem(insertString);
            //         c.kind = CompletionItemKind.Keyword;
            //         items.push(c);
            //     }
            // });

            ast.databases.forEach(databaseNode => {
                if (reg.test(databaseNode.name)) {
                    let c = new CompletionItem(databaseNode.name);
                    c.kind = CompletionItemKind.Class;
                    items.push(c);
                }
                databaseNode.tables.forEach(tableNode => {
                    if (reg.test(tableNode.name)) {
                        let insertString = `${databaseNode.name}.${tableNode.name}`;
                        if (db.currentDatabase == databaseNode.name) {
                            insertString = `${tableNode.name}`;
                        }
                        let c = new CompletionItem(`${databaseNode.name}.${tableNode.name}`);
                        c.kind = CompletionItemKind.Property;
                        c.insertText = insertString;
                        c.documentation = tableNode.comment;
                        items.push(c);
                    }
                    tableNode.columns.forEach(columnNode => {
                        if (this.tables.indexOf(tableNode.name) > -1) {
                            if (reg.test(columnNode.name)) {
                                let insertString: string = `${databaseNode.name}.${tableNode.name}.${columnNode.name}`;
                                if (this.hasMultipleCol(databaseNode, tableNode.name, columnNode.name)) {
                                    insertString = `${tableNode.name}.${columnNode.name}`;
                                } else {
                                    insertString = columnNode.name;
                                }
                                let c = new CompletionItem(`${databaseNode.name}.${tableNode.name}.${columnNode.name}`);
                                c.kind = CompletionItemKind.Value;
                                c.insertText = insertString;
                                c.documentation = columnNode.comment;
                                items.push(c);
                            }
                        }
                    });
                });
            });

            resolve(items);

        });
    }

    protected hasMultipleCol(database: Database, table: string, column: string): boolean {
        let isDup = false;
        for (var t in database.tables) {
            var testTable: Table = database.tables[t];
            if (this.tables.indexOf(testTable.name) == -1 || testTable.name == table) {
                continue;
            }
            testTable.columns.forEach(col => {
                if (col.name == column) {
                    isDup = true;
                }
            });
        }
        return isDup;
    }

}