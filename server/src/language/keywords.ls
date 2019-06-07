KEYWORDS_SHARED = <[
    true false null this void super return throw break continue
    if else for while switch case default try catch finally
    function class extends implements new do delete typeof in instanceof
    let with var const import export debugger yield await
]>

# The list of keywords that are reserved by JavaScript, but not used.
# We throw a syntax error for these to avoid runtime errors.
KEYWORDS_UNUSED =
    <[ enum interface package private protected public static ]>

JS_KEYWORDS = KEYWORDS_SHARED ++ KEYWORDS_UNUSED

LS_KEYWORDS = <[ xor match where ]>

keywords = LS_KEYWORDS ++ JS_KEYWORDS

module.exports = keywords