(function(){
  var AutoLanguageClient, config, ref$;
  AutoLanguageClient = require('atom-languageclient').AutoLanguageClient;
  config = require('./config');
  class StandardLanguageClient extends AutoLanguageClient {}
  ref$ = StandardLanguageClient.prototype;
  ref$.config = config;
  ref$.getGrammarScopes = function(){
    return ['source.livescript'];
  };
  ref$.getLanguageName = function(){
    return 'LiveScript';
  };
  ref$.getServerName = function(){
    return 'LiveScript Language Server';
  };
  ref$.startServerProcess = function(){
    var serverFile;
    serverFile = require.resolve('./server');
    return Promise.resolve(this.spawnChildNode([require.resolve('./server'), '--stdio'])).then(function(it){
      console.log('server started');
      return it;
    })['catch'](function(e){
      console.log(e);
      throw e;
    });
  };
  ref$.log = function(it){
    if (this.debug) {
      console.log("server:", it.message);
    }
  };
  ref$.preInitialization = function(connection){
    var this$ = this;
    atom.config.observe('ide-livescript.debug', function(debug){
      this$.debug = debug;
    });
    return connection.onLogMessage(bind$(this, 'log'));
  };
  ref$.provide = function(){
    var this$ = this;
    return {
      fromGrammarName: 'LiveScript',
      fromScopeName: 'source.livescript',
      toScopeName: 'source.js',
      transform: function(arg){
        var ref$, code, uri, options, atomUri, pane, editor, server;
        ref$ = arg != null
          ? arg
          : {}, code = ref$.code, uri = ref$.uri, options = ref$.options;
        if (!(uri != null || code != null)) {
          throw Error("Uri or code argument is needed");
        }
        if (uri) {
          atomUri = uri.replace("file://", '');
          pane = atom.workspace.paneForURI(atomUri);
          editor = pane.itemForURI(atomUri);
          server = this$._serverManager._editorToServer.get(editor);
          return server.connection._sendRequest('compile', {
            uri: uri,
            options: options
          });
        }
      }
    };
  };
  module.exports = new StandardLanguageClient();
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);

//# sourceMappingURL=client.js.map
