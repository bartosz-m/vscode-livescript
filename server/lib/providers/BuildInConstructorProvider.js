(function(){
  var fuzzysort, LanguageServer, CompletionItemKind, SymbolKind, builtInTypes, BuildInConstructorProvider;
  fuzzysort = require('fuzzysort');
  LanguageServer = require('vscode-languageserver');
  CompletionItemKind = LanguageServer.CompletionItemKind, SymbolKind = LanguageServer.SymbolKind;
  builtInTypes = ['Boolean', 'Date', 'Error', 'EvalError', 'Function', 'Map', 'Number', 'Object', 'Promise', 'Proxy', 'Set', 'String', 'Symbol', 'WeakMap', 'WeakSet'];
  module.exports = BuildInConstructorProvider = {
    name: 'BuildInConstructorProvider',
    install: function(completionContext){
      completionContext.isInsideNew = function(){
        var re;
        re = /\s*new\s+/;
        return re.test(this.before);
      };
    },
    isRelevant: function(completionContext){
      return completionContext.isInsideNew();
    },
    provide: function(completionContext){
      var types, this$ = this;
      types = fuzzysort.go(completionContext.prefix, builtInTypes);
      return types.map(function(it){
        return {
          score: it.score,
          label: it.target,
          kind: CompletionItemKind.Constructor,
          data: {
            provider: this$.name
          }
        };
      });
    },
    getSuggestions: function(completionContext){
      if (this.isRelevant(completionContext)) {
        return this.provide(completionContext);
      } else {
        return [];
      }
    },
    getInformations: function(item){
      return {};
    }
  };
}).call(this);

//# sourceMappingURL=BuildInConstructorProvider.js.map
