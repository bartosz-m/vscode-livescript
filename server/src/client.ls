require! {
    \atom-languageclient : { AutoLanguageClient }
    \./config
}

# es classes bullshit
``class StandardLanguageClient extends AutoLanguageClient {}``
StandardLanguageClient.prototype <<<
  config: config
  # activate: ->
  #     @debug = atom.config.get \atom-livescript-provider.debug
  #     AutoLanguageClient::activate ...
      
  getGrammarScopes: -> ['source.livescript']
  getLanguageName: -> \LiveScript
  getServerName: -> 'LiveScript Language Server'

  start-server-process:  ->
      server-file = require.resolve('./server')
      Promise.resolve @spawnChildNode [require.resolve('./server'), '--stdio']
      .then ->
          console.log 'server started'
          it
      .catch (e) !->
          console.log e
          throw e
  
  log: !->
      console.log "server:", it.message if @debug 
      
  pre-initialization: (connection) ->
      atom.config.observe \ide-livescript.debug (@debug) !~>
      connection.onLogMessage @~log
  provide: ->
      from-grammar-name: 'LiveScript'
      from-scope-name: 'source.livescript'
      to-scope-name: 'source.js'    
      transform: ({code, uri, options}:arg = {}) ~>
          unless uri? or code?
              throw Error "Uri or code argument is needed"
          if uri
                atom-uri = uri.replace "file://" '' # atom uris do not have protocol
                pane = atom.workspace.pane-for-URI atom-uri
                editor = pane.item-for-URI atom-uri
                server = @._server-manager._editor-to-server.get editor
                server.connection._send-request \compile {uri,options}
          
  

module.exports = new StandardLanguageClient!
