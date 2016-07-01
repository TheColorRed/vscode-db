/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';

import { window, workspace, languages, commands, Disposable, ExtensionContext, Uri } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

import { SQLCompletionItemProvider } from './providers/CompletionItemProvider';
import { Database } from './Database';

const fs = require('fs');

let databases = {};
let database: Database;

export function activate(context: ExtensionContext) {

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: ['plaintext'],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'languageServerExample',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	}

	// Create the language client and start the client.
	// let disposable = new LanguageClient('Language Server Example', serverOptions, clientOptions).start();

    context.subscriptions.push(commands.registerCommand('db.connect', () => {
		getConnections().then(dbnames => {
			window.showQuickPick(dbnames).then(value => {
				console.log(`Picked ${value}`);
			});
		});
    }));

	context.subscriptions.push(languages.registerCompletionItemProvider('sql', new SQLCompletionItemProvider()))

	// Push the disposable to the context's subscriptions so that the
	// client can be deactivated on extension deactivation
	// context.subscriptions.push(disposable);

	workspace.onDidOpenTextDocument(document => {
		window.showTextDocument(document);
	});

	getConnections().then(dbnames => {
		console.log('here i am')
		dbnames.forEach(dbname => {
			console.log(databases[dbname]);
		});
	});
}

function noConfigFile() {
	window.showInformationMessage('Could not find a dbconfig.json file.', 'Create').then(value => {
		if (workspace.rootPath) {
		fs.writeFile(`${workspace.rootPath}/dbconfig.json`,'{\n\
    "databases": {\n\
        "Localhost": {\n\
            "host": "localhost",\n\
            "user": "root",\n\
            "password": "",\n\
            "database": "test"\n\
        }\n\
    }\n\
}', function(err){
	if(!err){
		workspace.openTextDocument(Uri.file(workspace.rootPath+'/dbconfig.json'));
	}
});
				}
			});
}

function findConfig(): Thenable<Uri[]> {
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
	return new Promise((resolve, reject)=>{
		findConfig().then(files => {
			var dbnames: string[] = [];
			files.forEach(file => {
				fs.open(file.fsPath, function(err, data){
					databases = JSON.parse(data).databases;
					for(var name in databases){
						dbnames.push(name);
					};
				});
			});
			console.log(dbnames)
			resolve(dbnames);
		});
	});
}