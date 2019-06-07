(function(){
  var path, fs, fuzzysort, LanguageServer, CompletionItemKind, SymbolKind, ImportProvider;
  path = require('path');
  fs = require('fs');
  fuzzysort = require('fuzzysort');
  LanguageServer = require('vscode-languageserver');
  CompletionItemKind = LanguageServer.CompletionItemKind, SymbolKind = LanguageServer.SymbolKind;
  module.exports = ImportProvider = {
    name: 'ImportProvider',
    install: function(completionContext){
      completionContext.isInsideImport = function(){
        var indent, lineChain, i$, i, line, lineIndent, len$;
        indent = this.indent;
        lineChain = [this.line];
        for (i$ = this.position.line - 1; i$ >= 0; --i$) {
          i = i$;
          line = this.lines[i];
          lineIndent = line.match(/^\s*/)[0].length;
          if (lineIndent < indent) {
            indent = lineIndent;
            lineChain.push(line);
          }
        }
        for (i$ = 0, len$ = lineChain.length; i$ < len$; ++i$) {
          line = lineChain[i$];
          if (line.trim().match(/\s*(import(?: all)?|require!)(?:\s+|$)/)) {
            return true;
          }
        }
        return false;
      };
    },
    isRelevant: function(completionContext){
      return completionContext.isInsideImport();
    },
    getSuggestions: function(context){
      var filepath, ref$, importPrefix, dirpath, modulePath, searchDirectory, posibleModules, modules, this$ = this;
      filepath = (ref$ = context.document.uri.match(/file:\/\/(.*)/)) != null ? ref$[1] : void 8;
      if (filepath && this.isRelevant(context)) {
        importPrefix = path.basename(context.prefix);
        dirpath = path.dirname(filepath);
        modulePath = context.prefix.replace(/^[\\'"]/, '');
        searchDirectory = path.normalize(path.resolve(path.dirname(filepath), modulePath));
        posibleModules = fs.readdirSync(searchDirectory);
        modules = posibleModules.filter(function(it){
          return it !== filepath && it.match(/\.ls/);
        }).map(function(it){
          return it.replace('.ls', '');
        });
        return modules.map(function(it){
          return {
            score: 1,
            label: it,
            insertText: (function(){
              switch (importPrefix.length) {
              case 0:
                return '\\./' + it;
              case 1:
                return './' + it;
              default:
                return it;
              }
            }()),
            kind: CompletionItemKind.Module,
            data: {
              provider: this$.name
            }
          };
        });
      } else {
        return [];
      }
    },
    getInformations: function(item){
      return {};
    }
  };
}).call(this);

//# sourceMappingURL=ImportProvider.js.map
