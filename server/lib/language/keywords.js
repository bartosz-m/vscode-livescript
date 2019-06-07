(function(){
  var KEYWORDS_SHARED, KEYWORDS_UNUSED, JS_KEYWORDS, LS_KEYWORDS, keywords;
  KEYWORDS_SHARED = ['true', 'false', 'null', 'this', 'void', 'super', 'return', 'throw', 'break', 'continue', 'if', 'else', 'for', 'while', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'function', 'class', 'extends', 'implements', 'new', 'do', 'delete', 'typeof', 'in', 'instanceof', 'let', 'with', 'var', 'const', 'import', 'export', 'debugger', 'yield', 'await'];
  KEYWORDS_UNUSED = ['enum', 'interface', 'package', 'private', 'protected', 'public', 'static'];
  JS_KEYWORDS = KEYWORDS_SHARED.concat(KEYWORDS_UNUSED);
  LS_KEYWORDS = ['xor', 'match', 'where'];
  keywords = LS_KEYWORDS.concat(JS_KEYWORDS);
  module.exports = keywords;
}).call(this);

//# sourceMappingURL=keywords.js.map
