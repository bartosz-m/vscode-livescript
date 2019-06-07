#BEWARE OF USING console.log in any submodule because client and server communicate using standard input
import
    \vscode-languageserver : LanguageServer
    \path
    \fuzzysort
    \source-map : { SourceMapConsumer }
    'livescript' : livescript
    'livescript/lib/lexer'
    'livescript-compiler/lib/livescript/Compiler'
    'livescript-compiler/lib/livescript/ast/symbols' : { type,parent }
    'livescript-transform-esm/lib/plugin' : transform-esm
    'livescript-transform-implicit-async'
    
    \./CompletionContext
    \./providers/BuildInClassProvider
    \./providers/BuildInConstructorProvider
    \./providers/KeywordProvider
    \./providers/OperatorProvider
    \./providers/ImportProvider

{ CompletionItemKind, SymbolKind } = LanguageServer


const connection = LanguageServer.create-connection!

process.on 'uncaughtException' !-> connection.console.log it
process.on 'unhandledRejection' !-> connection.console.log it

const documents = new LanguageServer.TextDocuments!
documents.listen connection

active-context = {}

try
    # put imports inside try block to catch import errors
  
    
    compiler = Compiler.create livescript: livescript with {lexer}
    transform-esm.install compiler
    livescript-transform-implicit-async.install compiler
    
    last-valid = {}

    symbols = {}

    Code = Symbol.for \code.ast.livescript
    in-code-name = Symbol.for \name.ast.livescript

    starts-with-upper-case = /^[A-Z]\s*/

    to-dash-case = ->
        if starts-with-upper-case.test it
            it
        else
            it.replace do
                /(?:^|\.?)([A-Z]+)/g
                (x,y) ->
                    | y.length == 1 => "-" + y.toLowerCase!
                    | otherwise => '-' + y
            .replace /^-/, ""

    analyze-ast = ({ast,code}) !->
        try
            lines = code.split '\n'
            symbols[ast.filename] =
                variables: []
                
            walk = (node) !->
                if node[type] == \Var
                    node[Code] = if node.line?
                        if lines[node.line - 1]
                            lines[node.line - 1].substring node.first_column, node.last_column .trim!
                        else
                            connection.console.error "Analyzing error no line at index(#{node.line}) in #{ast.filename}"
                            connection.console.error "#{node[parent]?[type]} -> #{node.value}"
                            node[Code] = ''
                    else
                        ""
                    node[in-code-name] = if node[Code].match /\-/
                        then to-dash-case node.value
                        else node.value
                    symbols[ast.filename].variables.push node
            ast.traverse-children walk, true
        catch
            connection.console.error "Analyzing error #{ast.filename}: #{e.stack ? e.message}"

    safe-call = (fn) ->
        ->
            try
                fn ...
            catch
                connection.console.error "Error: #{e.stack ? e.message}"

    safe-delay = (t,fn) -> set-timeout (safe-call fn), t

    compile-code = (uri, code) !->
        try

            default-options =
                map: \linked
                
            options =
                filename: uri
            ast = compiler.generate-ast code, options <<< default-options
            unless valid = last-valid[uri]
                valid = last-valid[uri] = {}
            valid <<< {ast}
            safe-delay 10, -> analyze-ast {ast,code}
            js-result = compiler.compile-ast {ast,code, options}
                ..source-map = ..map.to-JSON!
            valid <<< js-result{map}
                ..generated-code = js-result.code
                ..original-code = code
                ..source-map = new SourceMapConsumer js-result.source-map
            connection.sendDiagnostics {uri, diagnostics:[] }
            
        # ?
        catch
            diagnostics = []
            try
                # finding from where error comes from
                unless e.hash
                    if m = e.message.match /.*at ([^:]+)\:([^\s]+) in/
                        e.hash =
                            loc:
                                first_line: m.1 - 1
                                first_column: m.2
                                last_line: m.1 - 1
                                last_column: m.2
                    else if m = e.message.match /.*on line (\d+)/
                        e.hash =
                            loc:
                                first_line: m.1 - 1
                                first_column: 0
                                last_line: first_line: m.1 - 1
                                last_column: 0
                    else
                        e.hash =
                            loc:
                                first_line: 0
                                first_column: 0
                                last_line: 0
                                last_column: 0
                diagnostics.push do
                    range:
                        start:
                            line: e.hash.loc.first_line
                            character: e.hash.loc.first_column
                        end:
                            line: e.hash.loc.last_line
                            character: e.hash.loc.last_column
                    # ESLint uses 2 for errors and 1 for warnings. LSP uses the opposite 2 warnings 1 for errors.
                    severity: 1
                    code: 0 #message.ruleId,
                    message: e.message
                    source: \LiveScript
            catch
                connection.console.log e.stack ? e.message
                # connection.console.log e.message

            connection.sendDiagnostics {uri, diagnostics}

    verify = (uri, code) !-> compile-code uri, code

    settings = style: 'standard'

    var workspace-root

    connection.on-initialize (params) ->
        workspace-root := params.root-uri
        capabilities:
            text-document-sync: documents.sync-kind
            completion-provider:
                resolve-provider: true
            hover-provider : true
            document-symbol-provider : true

    connection.on-request \compile ({uri,code,options}) ->
        try
            if uri
                code = documents.get uri .get-text!
            default-options =
                map: \linked
                
            options =
                filename: uri
            ast = compiler.generate-ast code, options <<< default-options
            unless valid = last-valid[uri]
                valid = last-valid[uri] = {}
            valid <<< {ast}
            js-result = compiler.compile-ast {ast,code, options}
                ..source-map = ..map.to-JSON!
            delete js-result.ast
            js-result
        catch e
            e
        
        
        
    connection.on-did-change-configuration (change) !->
        settings = change.settings.standard

        documents.all!forEach diagnose

    documents.on-did-change-content (change) !->
        active-context.document = change.document
        diagnose change.document    

    # Some say that extending prototype of buildins is wrong. 
    # We know better.
    String::trim-left ?= -> @replace.replace /^\s+/, ''
        
    providers = 
        ImportProvider: ImportProvider
        BuildInClassProvider: BuildInClassProvider
        BuildInConstructorProvider: BuildInConstructorProvider
        OperatorProvider: OperatorProvider
        KeywordProvider: KeywordProvider   
    
    for ,provider of providers
        provider.install? CompletionContext
    
    connection.on-completion (context) ->
        result = []
        try
            completion-context = CompletionContext.create do
                document: documents.get context.text-document.uri
                position: context.position
            if s =  symbols[completion-context.document.uri]
                id = 0
                variable-names = Array.from new Set s.variables.map (.[in-code-name])
                sorted = fuzzysort.go completion-context.prefix, variable-names
                variable-hints = sorted.slice 0, 4 .map ->
                    score: it.score
                    label: it.target
                    kind:CompletionItemKind.Variable
                    data: 
                        id: id++
                        provider: "VariableProvider"
                result.push ...variable-hints
            for ,provider of providers
                try
                    result.push ...provider.get-suggestions completion-context
                catch
                    connection.console.log "#{e.message}\n#{e.stack}"
            
            result.sort (a,b) -> b.score - a.score
        catch
            connection.console.log "#{e.message}\n#{e.stack}"
        result

    connection.on-completion-resolve (item) ->
        try
            if provider-name = item.data?provider
                if provider = providers[provider-name]
                    item <<< provider.get-informations item
        catch
            connection.console.error e.message
        item


    node-debug-info = (node) ->
        result = []
        for own k,v of node
            access = if Object.has-own-property.call node, k
                  then '.'
                  else '::'
            
            result.push switch typeof! v
                | \Object   => "#{access}#{k} : [#{ v[type] ? \Object }]"
                | \Array    => "#{access}#{k} : [Array]"
                | \Function => "#{access}#{k} : [Function]"
                | otherwise => "#{access}#{k} : #{that} = #{v}"
        result

    node-debug-parents = (node) ->
        parents = []
        while p = node[parent]
            parents.push p[type]
            node = p
        parents.reverse!join \->
    
    # trying to find which **semantic** node is selected
    connection.on-hover ({position, text-document},span) ->
        try            
            if (valid = last-valid[text-document.uri])
            and ast = valid.ast
                position.line += 1
                first_line = ast.first_line
                {first_column,last_column} = ast
                last_line = ast.last_line
                node-on-line = []
                max-line-length = 1000
                vposition = (line,character) -> line * max-line-length + character
                node-range = (node) -> 
                    {}
                        ..start = vposition node.first_line, node.first_column
                        ..end = vposition node.last_line, node.last_column
                        ..size = ..end - ..start
                        
                hover-position = vposition position.line, position.character
                find-on-line = (node) !->
                    range = node-range node
                    if range.start <= hover-position < range.end
                        node-on-line.push node
                ast.traverse-children find-on-line, true
                                
                ast[]exports.for-each ->
                    find-on-line it
                    it.traverse-children find-on-line, true
                ast[]imports.for-each ->
                    find-on-line it
                    it.traverse-children find-on-line, true
                    
                best = node-on-line[* - 1]
                smallest = node-range best
                for node in node-on-line
                    range = node-range node
                    if range.size < smallest
                        smallest = range.size
                        best = node
                
                contents = if operator = providers.OperatorProvider.operators[best.op]
                then
                    []
                        ..push operator.detail if operator.detail
                        ..push operator.documentation if operator.documentation
                        ..push operator.example if operator.example
                else []
                # else [ (node-debug-parents best) + ".**" + best[type] + "**", ...node-debug-info best ]
                
                contents: contents
                range:
                    start:
                        line: best.first_line - 1
                        character: best.first_column <? position.character
                    end:
                        line: best.last_line - 1
                        character: best.last_column >? position.character
    
            else
                contents: ["position #{position.line}, #{position.character}", "nothing"]
        catch
            contents: ["error", "#{e.message}", "#{e.stack}"]
                

    node-location = (node) ->
        range:
            start:
                line: (node.first_line ? node.line) - 1
                character: node.first_column ? node.column
            end:
                line: (node.last_line ? node.line) - 1
                character: node.last_column ? node.column

    symbol-provider =
        \Var : (node) ->
            name: node.value
            kind: SymbolKind.Variable
            location: node-location node
        # \Fun : (node) ->
        #     name: node.value
        #     kind: SymbolKind.Function
        #     location: node-location node
                

    connection.on-document-symbol ({text-document}) ->
        result = []
        try        
            if (valid = last-valid[text-document.uri])
            and ast = valid.ast
                walk = (node, parent) !->
                    if provider = symbol-provider[node[type]]
                        symbol = provider node, parent
                            ..location <<< text-document{uri}
                        result.push symbol
                ast.traverse-children walk, true
        catch
            connection.console.log e.stack ? e.message
        result
        # and source-map = valid.source-map
        #     # { line } = transpiled-position = source-map.generated-position-for do
        #     #     source: source-map.sources.0
        #     #     line: position.line + 1
        #     #     column: character + 1
        #     contents: [ "got source-map"]
        # else
        #     contents: ["tekst"]
        # range: 
        #     start: context.position
        #     end: 
        #         line: context.posistion.line
        #         character: context.posistion.character + 3
        
        # interface Location {
        # 	uri: DocumentUri;
        # 	range: Range;
        # }


        # 	containerName?: string;
catch
    message = try
        "Error: #{e.stack ? e.message}"
    connection.console.error "Error: #{message}"    

function diagnose textDocument
    const uri = textDocument.uri
    const text = textDocument.get-text!
    verify uri, text

connection.listen!

