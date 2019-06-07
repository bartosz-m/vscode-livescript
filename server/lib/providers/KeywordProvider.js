(function(){
  var fuzzysort, LanguageServer, keywords, CompletionItemKind, SymbolKind, KeywordProvider;
  fuzzysort = require('fuzzysort');
  LanguageServer = require('vscode-languageserver');
  keywords = require('../language/keywords');
  CompletionItemKind = LanguageServer.CompletionItemKind, SymbolKind = LanguageServer.SymbolKind;
  module.exports = KeywordProvider = {
    name: 'KeywordProvider',
    keywords: {
      'class': {
        description: 'class declaration'
      }
    },
    getSuggestions: function(completionContext){
      var scoredKeywords, this$ = this;
      scoredKeywords = fuzzysort.go(completionContext.prefix, keywords);
      return scoredKeywords.map(function(it){
        return {
          score: it.score,
          label: it.target,
          kind: CompletionItemKind.Keyword,
          data: {
            provider: this$.name
          }
        };
      });
    },
    getInformations: function(arg$){
      var label, keyword;
      label = arg$.label;
      if (keyword = this.keywords[label]) {
        return {
          detail: keyword.description
        };
      } else {
        return {};
      }
    }
  };
}).call(this);

//# sourceMappingURL=KeywordProvider.js.map
