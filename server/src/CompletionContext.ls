module.exports = CompletionContext =
    init: ({@document,@position}) !->
        @lines = @document.get-text!split '\n'
        @line = @lines[@position.line]
        @indent = @line.match /^\s*/ .0.length
        @to-position = @line.substring 0, @position.character
        @before = @to-position.substring 0, @to-position.length - 1
        @text =  @to-position .trim-left!
        @prefix = @text.split ' ' .[* - 1]
        
    # is-inside-new: ->
    #     const re = /\s*new\s+/
    #     re.test @before
    # 
    # is-inside-import: ->
    #     indent = @indent
    #     line-chain = [@line]
    #     for i from @position.line - 1 to 0 by -1
    #         line = @lines[i]
    #         line-indent = line.match /^\s*/ .0.length
    #         if line-indent < indent
    #             indent = line-indent
    #             line-chain.push line
    # 
    #     for line in line-chain
    #         if line.trim!match /\s*(import(?: all)?|require!)(?:\s+|$)/
    #             return true
    #     false
        
    create: ->
        Object.create @
            ..init ...&