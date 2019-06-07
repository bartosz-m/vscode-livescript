require! {
    \path
    \fs
    \fuzzysort
    \vscode-languageserver : LanguageServer
}

const { CompletionItemKind, SymbolKind } = LanguageServer

module.exports = ImportProvider =
    name: \ImportProvider
    
    install: (completion-context)!->
      completion-context.is-inside-import = ->
          indent = @indent
          line-chain = [@line]
          for i from @position.line - 1 to 0 by -1
              line = @lines[i]
              line-indent = line.match /^\s*/ .0.length
              if line-indent < indent
                  indent = line-indent
                  line-chain.push line
                  
          for line in line-chain
              if line.trim!match /\s*(import(?: all)?|require!)(?:\s+|$)/
                  return true
          false
    
    is-relevant: (completion-context) -> completion-context.is-inside-import!
    
    get-suggestions: (context) ->
        filepath = context.document.uri.match /file:\/\/(.*)/ ?.1
        if filepath and @is-relevant context
            import-prefix = path.basename context.prefix
            dirpath = path.dirname filepath
            module-path = context.prefix.replace /^[\\'"]/ '' 
            search-directory = path.normalize path.resolve (path.dirname filepath), module-path
            posible-modules = fs.readdir-sync search-directory
            modules = posible-modules
                .filter -> it != filepath and it.match /\.ls/
                .map -> it.replace '.ls' ''
            
          # modules = 
          # types = fuzzysort.go context.prefix, built-in-types
            modules.map ~>
                score: 1
                label: it
                insert-text:
                  switch import-prefix.length
                  | 0 => '\\./' + it
                  | 1 => './' + it
                  | _ => it
                kind: CompletionItemKind.Module
                data: 
                    provider: @name
            # sorted = fuzzysort.go import-prefix, modules
            # .map ->
            #     score: it.score
            #     label: it.target
            #     kind: CompletionItemKind.Class
        else
            []
            
    get-informations: (item) -> {}
        