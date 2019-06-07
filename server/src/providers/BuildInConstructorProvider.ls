require! {
    \fuzzysort
    \vscode-languageserver : LanguageServer
}

const { CompletionItemKind, SymbolKind } = LanguageServer

const built-in-types = <[
    Boolean
    Date
    Error
    EvalError
    Function
    Map
    Number
    Object
    Promise
    Proxy
    Set
    String
    Symbol
    WeakMap
    WeakSet
]>

module.exports = BuildInConstructorProvider =
    name: \BuildInConstructorProvider
    
    install: (completion-context) !->
        completion-context.is-inside-new = ->
            const re = /\s*new\s+/
            re.test @before
    
    is-relevant: (completion-context) -> completion-context.is-inside-new!
    
    provide: (completion-context) ->
        types = fuzzysort.go completion-context.prefix, built-in-types
        types.map ~>
            score: it.score
            label: it.target
            kind: CompletionItemKind.Constructor
            data: 
                provider: @name
    
    get-suggestions: (completion-context) ->
        if @is-relevant completion-context
        then @provide completion-context
        else []
        
    get-informations: (item) -> {}