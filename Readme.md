Language Server Protocol for LiveScript implemented as plugin for Atom editor.

Behind the scene it uses pluggable LiveScript [compiler](https://github.com/bartosz-m/livescript-compiler)

WIP!

Features:
- [x] diagnostics
- [x] autocompletion (simple)
- [x] hover (some operators only)
- [ ] code actions
- [ ] outline view
- [ ] data tips
- [ ] signature
- [x] integration with live preview
- [ ] integration with build system

# Diagnostics
## Errors
File is on the fly compiled by LiveScript [compiler](https://github.com/bartosz-m/livescript-compiler) and any errors are reported.

![autocompletion](doc/assets/diagnostics-screen.gif)

# Autocompletion
Very limited at the moment:
* keywords
* build-in types
* variables in current file
* imports (simple)

![autocompletion](doc/assets/autocompletion-screen.gif)

There is limited support for imports autocompletion - only `require! {}` and esm flavored `import` work.
![autocompletion](doc/assets/autocompletion-screen-import.gif)  
![autocompletion](doc/assets/autocompletion-screen-require.gif)
![autocompletion](doc/assets/autocompletion-screen01.gif)

# Hover
Provides simple information based on official livescript documentation.

![autocompletion](doc/assets/hover-screen.gif)

# Plugins
## Live preview

Install [livescript-ide-preview](https://atom.io/packages/livescript-ide-preview) to get preview of current file transpiled to js.
![live preview](https://raw.githubusercontent.com/bartosz-m/livescript-ide-preview/master/doc/assets/screenshot-01.gif)

# License 
**[BSD-3-Clause](License.md)**
