import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind } from 'vscode';
import { db, Database } from '../Database';
import mysql = require('mysql');

export class SQLCompletionItemProvider implements CompletionItemProvider {

    protected prevWord = '';

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Thenable<CompletionItem[]> {
        return new Promise<CompletionItem[]>((resolve, reject) => {

            let wordAtPosition = document.getWordRangeAtPosition(position);
            let word = document.getText(wordAtPosition);

            let ast: Database = db.ast;
            let items: CompletionItem[] = [];

            ast.tables.forEach(tableNode => {
                let reg: RegExp = new RegExp(`^${word}`);
                if (reg.test(tableNode.name)) {
                    let c = new CompletionItem(tableNode.name);
                    c.kind = CompletionItemKind.Keyword;
                    items.push(c);
                }
                tableNode.columns.forEach(columnNode => {
                    if (reg.test(columnNode.name)) {
                        let c = new CompletionItem(columnNode.name);
                        c.kind = CompletionItemKind.Field;
                        items.push(c);
                    }
                });
            });

            resolve(items);

        });
    }

}