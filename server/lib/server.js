var LanguageServer = (require('vscode-languageserver')['__default__'] || require('vscode-languageserver'));
var path = (require('path')['__default__'] || require('path'));
var fuzzysort = (require('fuzzysort')['__default__'] || require('fuzzysort'));
var { SourceMapConsumer } = require('source-map');
var livescript = (require('livescript')['__default__'] || require('livescript'));
var lexer = (require('livescript/lib/lexer')['__default__'] || require('livescript/lib/lexer'));
var Compiler = (require('livescript-compiler/lib/livescript/Compiler')['__default__'] || require('livescript-compiler/lib/livescript/Compiler'));
var { type, parent } = require('livescript-compiler/lib/livescript/ast/symbols');
var transformEsm = (require('livescript-transform-esm/lib/plugin')['__default__'] || require('livescript-transform-esm/lib/plugin'));
var livescriptTransformImplicitAsync = (require('livescript-transform-implicit-async')['__default__'] || require('livescript-transform-implicit-async'));
var CompletionContext = (require('./CompletionContext')['__default__'] || require('./CompletionContext'));
var BuildInClassProvider = (require('./providers/BuildInClassProvider')['__default__'] || require('./providers/BuildInClassProvider'));
var BuildInConstructorProvider = (require('./providers/BuildInConstructorProvider')['__default__'] || require('./providers/BuildInConstructorProvider'));
var KeywordProvider = (require('./providers/KeywordProvider')['__default__'] || require('./providers/KeywordProvider'));
var OperatorProvider = (require('./providers/OperatorProvider')['__default__'] || require('./providers/OperatorProvider'));
var ImportProvider = (require('./providers/ImportProvider')['__default__'] || require('./providers/ImportProvider'));
(function(){
  var CompletionItemKind, SymbolKind, connection, documents, activeContext, compiler, ref$, lastValid, symbols, Code, inCodeName, startsWithUpperCase, toDashCase, analyzeAst, safeCall, safeDelay, compileCode, verify, settings, workspaceRoot, providers, i$, provider, nodeDebugInfo, nodeDebugParents, nodeLocation, symbolProvider, e, message, toString$ = {}.toString;
  CompletionItemKind = LanguageServer.CompletionItemKind, SymbolKind = LanguageServer.SymbolKind;
  connection = LanguageServer.createConnection();
  process.on('uncaughtException', function(it){
    connection.console.log(it);
  });
  process.on('unhandledRejection', function(it){
    connection.console.log(it);
  });
  documents = new LanguageServer.TextDocuments();
  documents.listen(connection);
  activeContext = {};
  try {
    compiler = Compiler.create({
      livescript: (ref$ = Object.create(livescript), ref$.lexer = lexer, ref$)
    });
    transformEsm.install(compiler);
    livescriptTransformImplicitAsync.install(compiler);
    lastValid = {};
    symbols = {};
    Code = Symbol['for']('code.ast.livescript');
    inCodeName = Symbol['for']('name.ast.livescript');
    startsWithUpperCase = /^[A-Z]\s*/;
    toDashCase = function(it){
      if (startsWithUpperCase.test(it)) {
        return it;
      } else {
        return it.replace(/(?:^|\.?)([A-Z]+)/g, function(x, y){
          switch (false) {
          case y.length !== 1:
            return "-" + y.toLowerCase();
          default:
            return '-' + y;
          }
        }).replace(/^-/, "");
      }
    };
    analyzeAst = function(arg$){
      var ast, code, lines, walk, e, ref$;
      ast = arg$.ast, code = arg$.code;
      try {
        lines = code.split('\n');
        symbols[ast.filename] = {
          variables: []
        };
        walk = function(node){
          var ref$;
          if (node[type] === 'Var') {
            node[Code] = node.line != null ? lines[node.line - 1]
              ? lines[node.line - 1].substring(node.first_column, node.last_column).trim()
              : (connection.console.error("Analyzing error no line at index(" + node.line + ") in " + ast.filename), connection.console.error(((ref$ = node[parent]) != null ? ref$[type] : void 8) + " -> " + node.value), node[Code] = '') : "";
            node[inCodeName] = node[Code].match(/\-/)
              ? toDashCase(node.value)
              : node.value;
            symbols[ast.filename].variables.push(node);
          }
        };
        ast.traverseChildren(walk, true);
      } catch (e$) {
        e = e$;
        connection.console.error("Analyzing error " + ast.filename + ": " + ((ref$ = e.stack) != null
          ? ref$
          : e.message));
      }
    };
    safeCall = function(fn){
      return function(){
        var e, ref$;
        try {
          return fn.apply(this, arguments);
        } catch (e$) {
          e = e$;
          return connection.console.error("Error: " + ((ref$ = e.stack) != null
            ? ref$
            : e.message));
        }
      };
    };
    safeDelay = function(t, fn){
      return setTimeout(safeCall(fn), t);
    };
    compileCode = function(uri, code){
      var defaultOptions, options, ast, valid, x$, jsResult, y$, e, diagnostics, m, ref$;
      try {
        defaultOptions = {
          map: 'linked'
        };
        options = {
          filename: uri
        };
        ast = compiler.generateAst(code, import$(options, defaultOptions));
        if (!(valid = lastValid[uri])) {
          valid = lastValid[uri] = {};
        }
        valid.ast = ast;
        safeDelay(10, function(){
          return analyzeAst({
            ast: ast,
            code: code
          });
        });
        x$ = jsResult = compiler.compileAst({
          ast: ast,
          code: code,
          options: options
        });
        x$.sourceMap = x$.map.toJSON();
        y$ = (valid.map = jsResult.map, valid);
        y$.generatedCode = jsResult.code;
        y$.originalCode = code;
        y$.sourceMap = new SourceMapConsumer(jsResult.sourceMap);
        connection.sendDiagnostics({
          uri: uri,
          diagnostics: []
        });
      } catch (e$) {
        e = e$;
        diagnostics = [];
        try {
          if (!e.hash) {
            if (m = e.message.match(/.*at ([^:]+)\:([^\s]+) in/)) {
              e.hash = {
                loc: {
                  first_line: m[1] - 1,
                  first_column: m[2],
                  last_line: m[1] - 1,
                  last_column: m[2]
                }
              };
            } else if (m = e.message.match(/.*on line (\d+)/)) {
              e.hash = {
                loc: {
                  first_line: m[1] - 1,
                  first_column: 0,
                  last_line: {
                    first_line: m[1] - 1
                  },
                  last_column: 0
                }
              };
            } else {
              e.hash = {
                loc: {
                  first_line: 0,
                  first_column: 0,
                  last_line: 0,
                  last_column: 0
                }
              };
            }
          }
          diagnostics.push({
            range: {
              start: {
                line: e.hash.loc.first_line,
                character: e.hash.loc.first_column
              },
              end: {
                line: e.hash.loc.last_line,
                character: e.hash.loc.last_column
              }
            },
            severity: 1,
            code: 0,
            message: e.message,
            source: 'LiveScript'
          });
        } catch (e$) {
          e = e$;
          connection.console.log((ref$ = e.stack) != null
            ? ref$
            : e.message);
        }
        connection.sendDiagnostics({
          uri: uri,
          diagnostics: diagnostics
        });
      }
    };
    verify = function(uri, code){
      compileCode(uri, code);
    };
    settings = {
      style: 'standard'
    };
    connection.onInitialize(function(params){
      workspaceRoot = params.rootUri;
      return {
        capabilities: {
          textDocumentSync: documents.syncKind,
          completionProvider: {
            resolveProvider: true
          },
          hoverProvider: true,
          documentSymbolProvider: true
        }
      };
    });
    connection.onRequest('compile', function(arg$){
      var uri, code, options, defaultOptions, ast, valid, x$, jsResult, e;
      uri = arg$.uri, code = arg$.code, options = arg$.options;
      try {
        if (uri) {
          code = documents.get(uri).getText();
        }
        defaultOptions = {
          map: 'linked'
        };
        options = {
          filename: uri
        };
        ast = compiler.generateAst(code, import$(options, defaultOptions));
        if (!(valid = lastValid[uri])) {
          valid = lastValid[uri] = {};
        }
        valid.ast = ast;
        x$ = jsResult = compiler.compileAst({
          ast: ast,
          code: code,
          options: options
        });
        x$.sourceMap = x$.map.toJSON();
        delete jsResult.ast;
        return jsResult;
      } catch (e$) {
        e = e$;
        return e;
      }
    });
    connection.onDidChangeConfiguration(function(change){
      var settings;
      settings = change.settings.standard;
      documents.all().forEach(diagnose);
    });
    documents.onDidChangeContent(function(change){
      activeContext.document = change.document;
      diagnose(change.document);
    });
    (ref$ = String.prototype).trimLeft == null && (ref$.trimLeft = function(){
      return this.replace.replace(/^\s+/, '');
    });
    providers = {
      ImportProvider: ImportProvider,
      BuildInClassProvider: BuildInClassProvider,
      BuildInConstructorProvider: BuildInConstructorProvider,
      OperatorProvider: OperatorProvider,
      KeywordProvider: KeywordProvider
    };
    for (i$ in providers) {
      provider = providers[i$];
      if (typeof provider.install == 'function') {
        provider.install(CompletionContext);
      }
    }
    connection.onCompletion(function(context){
      var result, completionContext, s, id, variableNames, sorted, variableHints, i$, ref$, provider, e;
      result = [];
      try {
        completionContext = CompletionContext.create({
          document: documents.get(context.textDocument.uri),
          position: context.position
        });
        if (s = symbols[completionContext.document.uri]) {
          id = 0;
          variableNames = Array.from(new Set(s.variables.map(function(it){
            return it[inCodeName];
          })));
          sorted = fuzzysort.go(completionContext.prefix, variableNames);
          variableHints = sorted.slice(0, 4).map(function(it){
            return {
              score: it.score,
              label: it.target,
              kind: CompletionItemKind.Variable,
              data: {
                id: id++,
                provider: "VariableProvider"
              }
            };
          });
          result.push.apply(result, variableHints);
        }
        for (i$ in ref$ = providers) {
          provider = ref$[i$];
          try {
            result.push.apply(result, provider.getSuggestions(completionContext));
          } catch (e$) {
            e = e$;
            connection.console.log(e.message + "\n" + e.stack);
          }
        }
        result.sort(function(a, b){
          return b.score - a.score;
        });
      } catch (e$) {
        e = e$;
        connection.console.log(e.message + "\n" + e.stack);
      }
      return result;
    });
    connection.onCompletionResolve(function(item){
      var providerName, ref$, provider, e;
      try {
        if (providerName = (ref$ = item.data) != null ? ref$.provider : void 8) {
          if (provider = providers[providerName]) {
            import$(item, provider.getInformations(item));
          }
        }
      } catch (e$) {
        e = e$;
        connection.console.error(e.message);
      }
      return item;
    });
    nodeDebugInfo = function(node){
      var result, k, v, access, that, own$ = {}.hasOwnProperty;
      result = [];
      for (k in node) if (own$.call(node, k)) {
        v = node[k];
        access = Object.hasOwnProperty.call(node, k) ? '.' : '::';
        result.push((fn$()));
      }
      return result;
      function fn$(){
        var ref$;
        switch (that = toString$.call(v).slice(8, -1)) {
        case 'Object':
          return access + "" + k + " : [" + ((ref$ = v[type]) != null ? ref$ : 'Object') + "]";
        case 'Array':
          return access + "" + k + " : [Array]";
        case 'Function':
          return access + "" + k + " : [Function]";
        default:
          return access + "" + k + " : " + that + " = " + v;
        }
      }
    };
    nodeDebugParents = function(node){
      var parents, p;
      parents = [];
      while (p = node[parent]) {
        parents.push(p[type]);
        node = p;
      }
      return parents.reverse().join('->');
    };
    connection.onHover(function(arg$, span){
      var position, textDocument, valid, ast, first_line, first_column, last_column, last_line, nodeOnLine, maxLineLength, vposition, nodeRange, hoverPosition, findOnLine, best, smallest, i$, len$, node, range, contents, operator, x$, ref$, ref1$, e;
      position = arg$.position, textDocument = arg$.textDocument;
      try {
        if ((valid = lastValid[textDocument.uri]) && (ast = valid.ast)) {
          position.line += 1;
          first_line = ast.first_line;
          first_column = ast.first_column, last_column = ast.last_column;
          last_line = ast.last_line;
          nodeOnLine = [];
          maxLineLength = 1000;
          vposition = function(line, character){
            return line * maxLineLength + character;
          };
          nodeRange = function(node){
            var x$;
            x$ = {};
            x$.start = vposition(node.first_line, node.first_column);
            x$.end = vposition(node.last_line, node.last_column);
            x$.size = x$.end - x$.start;
            return x$;
          };
          hoverPosition = vposition(position.line, position.character);
          findOnLine = function(node){
            var range;
            range = nodeRange(node);
            if (range.start <= hoverPosition && hoverPosition < range.end) {
              nodeOnLine.push(node);
            }
          };
          ast.traverseChildren(findOnLine, true);
          (ast.exports || (ast.exports = [])).forEach(function(it){
            findOnLine(it);
            return it.traverseChildren(findOnLine, true);
          });
          (ast.imports || (ast.imports = [])).forEach(function(it){
            findOnLine(it);
            return it.traverseChildren(findOnLine, true);
          });
          best = nodeOnLine[nodeOnLine.length - 1];
          smallest = nodeRange(best);
          for (i$ = 0, len$ = nodeOnLine.length; i$ < len$; ++i$) {
            node = nodeOnLine[i$];
            range = nodeRange(node);
            if (range.size < smallest) {
              smallest = range.size;
              best = node;
            }
          }
          contents = (operator = providers.OperatorProvider.operators[best.op])
            ? (x$ = [], operator.detail && x$.push(operator.detail), operator.documentation && x$.push(operator.documentation), operator.example && x$.push(operator.example), x$)
            : [];
          return {
            contents: contents,
            range: {
              start: {
                line: best.first_line - 1,
                character: (ref$ = best.first_column) < (ref1$ = position.character) ? ref$ : ref1$
              },
              end: {
                line: best.last_line - 1,
                character: (ref$ = best.last_column) > (ref1$ = position.character) ? ref$ : ref1$
              }
            }
          };
        } else {
          return {
            contents: ["position " + position.line + ", " + position.character, "nothing"]
          };
        }
      } catch (e$) {
        e = e$;
        return {
          contents: ["error", e.message + "", e.stack + ""]
        };
      }
    });
    nodeLocation = function(node){
      var ref$;
      return {
        range: {
          start: {
            line: ((ref$ = node.first_line) != null
              ? ref$
              : node.line) - 1,
            character: (ref$ = node.first_column) != null
              ? ref$
              : node.column
          },
          end: {
            line: ((ref$ = node.last_line) != null
              ? ref$
              : node.line) - 1,
            character: (ref$ = node.last_column) != null
              ? ref$
              : node.column
          }
        }
      };
    };
    symbolProvider = {
      'Var': function(node){
        return {
          name: node.value,
          kind: SymbolKind.Variable,
          location: nodeLocation(node)
        };
      }
    };
    connection.onDocumentSymbol(function(arg$){
      var textDocument, result, valid, ast, walk, e, ref$;
      textDocument = arg$.textDocument;
      result = [];
      try {
        if ((valid = lastValid[textDocument.uri]) && (ast = valid.ast)) {
          walk = function(node, parent){
            var provider, x$, symbol;
            if (provider = symbolProvider[node[type]]) {
              x$ = symbol = provider(node, parent);
              x$.location.uri = textDocument.uri;
              result.push(symbol);
            }
          };
          ast.traverseChildren(walk, true);
        }
      } catch (e$) {
        e = e$;
        connection.console.log((ref$ = e.stack) != null
          ? ref$
          : e.message);
      }
      return result;
    });
  } catch (e$) {
    e = e$;
    message = (function(){
      var ref$;
      try {
        return "Error: " + ((ref$ = e.stack) != null
          ? ref$
          : e.message);
      } catch (e$) {}
    }());
    connection.console.error("Error: " + message);
  }
  function diagnose(textDocument){
    var uri, text;
    uri = textDocument.uri;
    text = textDocument.getText();
    return verify(uri, text);
  }
  connection.listen();
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);

//# sourceMappingURL=server.js.map
