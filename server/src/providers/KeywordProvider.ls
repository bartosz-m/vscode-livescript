require! {
    \fuzzysort
    \vscode-languageserver : LanguageServer
    \../language/keywords
}

const { CompletionItemKind, SymbolKind } = LanguageServer

module.exports = KeywordProvider =
    name: \KeywordProvider
  
    keywords:
        class: 
            description: 'class declaration'
    
    get-suggestions: (completion-context) ->
        scored-keywords = fuzzysort.go completion-context.prefix, keywords
        scored-keywords.map ~>
            score: it.score
            label: it.target
            kind: CompletionItemKind.Keyword
            data: 
                provider: @name
    
    get-informations: ({label})->
        if keyword = @keywords[label]
            detail: keyword.description
        else
            {}