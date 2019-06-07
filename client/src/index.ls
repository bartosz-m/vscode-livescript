import
    \path
    \vscode : { workspace: Workspace, window: Window, ExtensionContext, TextDocument, OutputChannel, WorkspaceFolder, Uri }
    \vscode-languageclient : { LanguageClient, LanguageClientOptions, TransportKind }

var default-client
var solo-client
clients = new Map
var _sorted-workspace-folders

sorted-workspace-folders = ->
    unless _sortedWorkspaceFolders 
        _sortedWorkspaceFolders := Workspace.workspaceFolders ? Workspace.workspaceFolders.map (folder) ->
            result = folder.uri.to-string!
            if result.char-at (result.length - 1) != '/'
            then result + '/'
            else result
        .sort (a, b) -> a.length - b.length
    _sortedWorkspaceFolders

Workspace.on-did-change-workspace-folders  !-> _sortedWorkspaceFolders := undefined

get-outer-most-workspace-folder = (folder) ->
    var uri
    sorted = sorted-workspace-folders!
    for element in sorted
        uri := folder.uri.to-string!
        if uri.char-at (uri.length - 1) != '/'
            uri := uri + '/'
        if uri.starts-with element
            return Workspace.get-workspace-folder Uri.parse element
    folder
 
export activate = (context) !->
    console.log "activating livescript lsp client"
    module = context.as-absolute-path path.join 'server', 'lib', 'server.js'
    console.log "Server module", module
    output-channel = Window.create-output-channel 'lsp-livescript'
    did-open-text-document = (document) !->
        console.log "document opened" document
        # We are only interested in language mode livescript
        if document.language-id != 'livescript' or (document.uri.scheme != 'file' and document.uri.scheme != 'untitled')
            console.log \unsupported
            return

        uri = document.uri
        # Untitled files go to a default client.
        if uri.scheme == 'untitled' and !default-client
            console.log "starting default"
            debug-options = execArgv: ["--nolazy", "--inspect=6010"]
            server-options =
                run: { module, transport: TransportKind.ipc }
                debug: { module, transport: TransportKind.ipc, options: debugOptions}
            
            client-options =
                documentSelector: [
                    * scheme: 'untitled', language: 'livescript'
                ]
                diagnostic-collection-name: 'lsp-livescript'
                output-channel: output-channel
            
            default-client := new LanguageClient 'lsp-livescript', 'LSP Livescript', server-options, client-options
                ..start!
            return
        workspace-folder = Workspace.get-workspace-folder uri
        # Files outside a folder can't be handled. This might depend on the language.
        # Single file languages like JSON might handle files outside the workspace folders.
        if !workspace-folder and !solo-client
            do !->
                console.log "starting solo"
                debug-options = execArgv: ["--nolazy", "--inspect=6010"]
                server-options =
                    run: { module, transport: TransportKind.ipc }
                    debug: { module, transport: TransportKind.ipc, options: debugOptions}
                
                client-options =
                    documentSelector: [
                        * scheme: 'file', language: 'livescript'
                    ]
                    diagnostic-collection-name: 'lsp-livescript'
                    output-channel: output-channel
                
                solo-client := new LanguageClient 'lsp-livescript', 'LSP Livescript', server-options, client-options
                    ..start!
                connection = await solo-client._connection-promise
                    ..on-log-message !-> console.log 'server', it.message
                console.log connection
            return
        # If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = getOuterMostWorkspaceFolder workspace-folder

        unless clients.has folder.uri.to-string!
            do !->
                
                debug-options = exec-argv: ["--nolazy", "--inspect=#{6011 + clients.size}"]
                server-options =
                    run: { module, transport: TransportKind.ipc }
                    debug: { module, transport: TransportKind.ipc, options: debug-options }
                client-options =
                    documentSelector: [
                        * scheme: 'file', language: 'livescript', pattern: "#{folder.uri.fs-path}/**/*"
                    ],
                    diagnosticCollectionName: 'lsp-livescript',
                    workspace-folder: folder,
                    output-channel: output-channel
                console.log "starting client for #{folder.uri.to-string!}"
                client = new LanguageClient 'lsp-livescript', 'LSP Livescript', server-options, client-options
                    ..start!
                    clients.set folder.uri.to-string!, ..
                    

    Workspace.on-did-open-text-document did-open-text-document
    Workspace.text-documents.for-each did-open-text-document
    Workspace.on-did-change-workspace-folders (event) !->
        try
            for folder in event.removed
                if client = clients.get folder.uri.to-string!
                    clients.delete folder.uri.to-string!
                    client.stop!
        catch
            console.log e
    console.log "client started"

export deactivate = !->
    console.log "deactivating livescript lsp client"
    promises = []
    
    promises.push default-client.stop! if default-client
    promises.push solo-client.stop! if solo-client

    iterator = clients.values!
    var result
    until (result := iterator.next!).done
        client = result.value
        promises.push client.stop!

    await Promise.all promises
