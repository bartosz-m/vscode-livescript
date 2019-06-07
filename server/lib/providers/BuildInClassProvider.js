(function(){
  var fuzzysort, LanguageServer, builtInTypes, CompletionItemKind, SymbolKind;
  fuzzysort = require('fuzzysort');
  LanguageServer = require('vscode-languageserver');
  builtInTypes = require('../language/built-in-types');
  CompletionItemKind = LanguageServer.CompletionItemKind, SymbolKind = LanguageServer.SymbolKind;
  module.exports = {
    name: 'BuildInClassProvider',
    install: function(completionContext){},
    getSuggestions: function(completionContext){
      var types, this$ = this;
      types = fuzzysort.go(completionContext.prefix, Object.keys(builtInTypes));
      return types.map(function(it){
        return {
          score: it.score,
          label: it.target,
          kind: CompletionItemKind.Class,
          data: {
            provider: this$.name
          }
        };
      });
    },
    getInformations: function(arg$){
      var label, info, type;
      label = arg$.label;
      info = {
        detail: "built-in type"
      };
      if (type = builtInTypes[label]) {
        info.documentation = type.description + " [link](" + type.link + ")";
      }
      return info;
    }
  };
}).call(this);

//# sourceMappingURL=BuildInClassProvider.js.map
