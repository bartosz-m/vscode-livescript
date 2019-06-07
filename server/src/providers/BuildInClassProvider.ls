require! {
    \fuzzysort
    \vscode-languageserver : LanguageServer
    \../language/built-in-types
}

const { CompletionItemKind, SymbolKind } = LanguageServer


module.exports =
    name: \BuildInClassProvider
    
    install: (completion-context) !->
    
    get-suggestions: (completion-context) ->
        types = fuzzysort.go completion-context.prefix, Object.keys built-in-types
        types.map ~>
            score: it.score
            label: it.target
            kind: CompletionItemKind.Class
            data: 
                provider: @name
      
    get-informations: ({label}) ->
        info = 
            detail: "built-in type"
        if type = built-in-types[label]
            info.documentation = "#{type.description} [link](#{type.link})"
        info