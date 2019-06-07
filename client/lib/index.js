var path = (require('path')['__default__'] || require('path'));
var { workspace : Workspace, window : Window, ExtensionContext, TextDocument, OutputChannel, WorkspaceFolder, Uri } = require('vscode');
var { LanguageClient, LanguageClientOptions, TransportKind } = require('vscode-languageclient');
(function(){
  var defaultClient, soloClient, clients, _sortedWorkspaceFolders, sortedWorkspaceFolders, getOuterMostWorkspaceFolder, activate, deactivate;
  clients = new Map;
  sortedWorkspaceFolders = function(){
    var ref$;
    if (!_sortedWorkspaceFolders) {
      _sortedWorkspaceFolders = (ref$ = Workspace.workspaceFolders) != null
        ? ref$
        : Workspace.workspaceFolders.map(function(folder){
          var result;
          result = folder.uri.toString();
          if (result.charAt(result.length - 1 !== '/')) {
            return result + '/';
          } else {
            return result;
          }
        }).sort(function(a, b){
          return a.length - b.length;
        });
    }
    return _sortedWorkspaceFolders;
  };
  Workspace.onDidChangeWorkspaceFolders(function(){
    _sortedWorkspaceFolders = undefined;
  });
  getOuterMostWorkspaceFolder = function(folder){
    var uri, sorted, i$, len$, element;
    sorted = sortedWorkspaceFolders();
    for (i$ = 0, len$ = sorted.length; i$ < len$; ++i$) {
      element = sorted[i$];
      uri = folder.uri.toString();
      if (uri.charAt(uri.length - 1 !== '/')) {
        uri = uri + '/';
      }
      if (uri.startsWith(element)) {
        return Workspace.getWorkspaceFolder(Uri.parse(element));
      }
    }
    return folder;
  };
  exports.activate = activate = function(context){
    var module, outputChannel, didOpenTextDocument;
    console.log("activating livescript lsp client");
    module = context.asAbsolutePath(path.join('server', 'lib', 'server.js'));
    console.log("Server module", module);
    outputChannel = Window.createOutputChannel('lsp-livescript');
    didOpenTextDocument = function(document){
      var uri, debugOptions, serverOptions, clientOptions, x$, workspaceFolder, folder;
      console.log("document opened", document);
      if (document.languageId !== 'livescript' || (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled')) {
        console.log('unsupported');
        return;
      }
      uri = document.uri;
      if (uri.scheme === 'untitled' && !defaultClient) {
        console.log("starting default");
        debugOptions = {
          execArgv: ["--nolazy", "--inspect=6010"]
        };
        serverOptions = {
          run: {
            module: module,
            transport: TransportKind.ipc
          },
          debug: {
            module: module,
            transport: TransportKind.ipc,
            options: debugOptions
          }
        };
        clientOptions = {
          documentSelector: [{
            scheme: 'untitled',
            language: 'livescript'
          }],
          diagnosticCollectionName: 'lsp-livescript',
          outputChannel: outputChannel
        };
        x$ = defaultClient = new LanguageClient('lsp-livescript', 'LSP Livescript', serverOptions, clientOptions);
        x$.start();
        return;
      }
      workspaceFolder = Workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder && !soloClient) {
        (async function(){
          var debugOptions, serverOptions, clientOptions, x$, y$, connection;
          console.log("starting solo");
          debugOptions = {
            execArgv: ["--nolazy", "--inspect=6010"]
          };
          serverOptions = {
            run: {
              module: module,
              transport: TransportKind.ipc
            },
            debug: {
              module: module,
              transport: TransportKind.ipc,
              options: debugOptions
            }
          };
          clientOptions = {
            documentSelector: [{
              scheme: 'file',
              language: 'livescript'
            }],
            diagnosticCollectionName: 'lsp-livescript',
            outputChannel: outputChannel
          };
          x$ = soloClient = new LanguageClient('lsp-livescript', 'LSP Livescript', serverOptions, clientOptions);
          x$.start();
          y$ = connection = (await soloClient._connectionPromise);
          y$.onLogMessage(function(it){
            console.log('server', it.message);
          });
          console.log(connection);
        })();
        return;
      }
      folder = getOuterMostWorkspaceFolder(workspaceFolder);
      if (!clients.has(folder.uri.toString())) {
        (function(){
          var debugOptions, serverOptions, clientOptions, x$, client;
          debugOptions = {
            execArgv: ["--nolazy", "--inspect=" + (6011 + clients.size)]
          };
          serverOptions = {
            run: {
              module: module,
              transport: TransportKind.ipc
            },
            debug: {
              module: module,
              transport: TransportKind.ipc,
              options: debugOptions
            }
          };
          clientOptions = {
            documentSelector: [{
              scheme: 'file',
              language: 'livescript',
              pattern: folder.uri.fsPath + "/**/*"
            }],
            diagnosticCollectionName: 'lsp-livescript',
            workspaceFolder: folder,
            outputChannel: outputChannel
          };
          console.log("starting client for " + folder.uri.toString());
          x$ = client = new LanguageClient('lsp-livescript', 'LSP Livescript', serverOptions, clientOptions);
          x$.start();
          clients.set(folder.uri.toString(), x$);
        })();
      }
    };
    Workspace.onDidOpenTextDocument(didOpenTextDocument);
    Workspace.textDocuments.forEach(didOpenTextDocument);
    Workspace.onDidChangeWorkspaceFolders(function(event){
      var i$, ref$, len$, folder, client, e;
      try {
        for (i$ = 0, len$ = (ref$ = event.removed).length; i$ < len$; ++i$) {
          folder = ref$[i$];
          if (client = clients.get(folder.uri.toString())) {
            clients['delete'](folder.uri.toString());
            client.stop();
          }
        }
      } catch (e$) {
        e = e$;
        console.log(e);
      }
    });
    console.log("client started");
  };
  exports.deactivate = deactivate = async function(){
    var promises, iterator, result, client;
    console.log("deactivating livescript lsp client");
    promises = [];
    if (defaultClient) {
      promises.push(defaultClient.stop());
    }
    if (soloClient) {
      promises.push(soloClient.stop());
    }
    iterator = clients.values();
    while (!(result = iterator.next()).done) {
      client = result.value;
      promises.push(client.stop());
    }
    (await Promise.all(promises));
  };
}).call(this);

//# sourceMappingURL=index.js.map
