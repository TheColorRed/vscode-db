/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { window, workspace, languages, commands, Disposable, ExtensionContext, Uri } from 'vscode';

import { SQLCompletionItemProvider } from './providers/CompletionItemProvider';
import { db, Database } from './Database';

const fs = require('fs');

export function activate(context: ExtensionContext) {

    context.subscriptions.push(commands.registerCommand('db.connect', () => {
		getConnections().then(dbnames => {
			window.showQuickPick(dbnames).then(value => {
				console.log(`Picked ${value}`);
			});
		});
    }));

	context.subscriptions.push(languages.registerCompletionItemProvider('sql', new SQLCompletionItemProvider()))

	workspace.onDidOpenTextDocument(document => {
		// window.showTextDocument(document);
	});

	getConnections().then(dbnames => {
		if (db.connectionLength == 1) {
			db.build(dbnames[0]);
		}
		// dbnames.forEach(dbname => {
		// 	// console.log(databases[dbname]);
		// });
	}).catch(error => {
		console.log(error);
	});
}

function noConfigFile() {
	window.showInformationMessage('Could not find a dbconfig.json file.', 'Create').then(value => {
		if (workspace.rootPath) {
			fs.readFile(__dirname + '/../../templates/config.tpl.json', (err, data) => {
				if (!err) {
					fs.writeFile(`${workspace.rootPath}/dbconfig.json`, data, function(err){
						if(!err){
							workspace.openTextDocument(Uri.file(workspace.rootPath + '/dbconfig.json')).then(document => {
								window.showTextDocument(document);
							});
						}
					});
				} else {
					console.log(err);
				}
			});
		}
	});
}

function findConfig(): Promise<Uri[]> {
	return new Promise((resolve, reject) => {
		var uri: Uri = Uri.file('/dbconfig.json');
		workspace.findFiles('dbconfig.json', '').then(files => {
			if (files.length == 0) {
				noConfigFile();
				return;
			}
			resolve(files);
		});
	});
}

function getConnections(): Promise<string[]> {
	return new Promise((resolve, reject) => {
		findConfig().then(files => {
			var dbnames: string[] = [];
			files.forEach(file => {
				db.connections = require(file.fsPath).connections;
				for (var name in db.connections) {
					dbnames.push(name);
				};
			});
			resolve(dbnames);
		}).catch(error => {
			console.log(error);
		});
	}).catch(error => {
		console.log(error);
	});
}