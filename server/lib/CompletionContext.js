(function(){
  var CompletionContext;
  module.exports = CompletionContext = {
    init: function(arg$){
      var ref$;
      this.document = arg$.document, this.position = arg$.position;
      this.lines = this.document.getText().split('\n');
      this.line = this.lines[this.position.line];
      this.indent = this.line.match(/^\s*/)[0].length;
      this.toPosition = this.line.substring(0, this.position.character);
      this.before = this.toPosition.substring(0, this.toPosition.length - 1);
      this.text = this.toPosition.trimLeft();
      this.prefix = (ref$ = this.text.split(' '))[ref$.length - 1];
    },
    create: function(){
      var x$;
      x$ = Object.create(this);
      x$.init.apply(x$, arguments);
      return x$;
    }
  };
}).call(this);

//# sourceMappingURL=CompletionContext.js.map
