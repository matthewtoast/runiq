# Runiq (WIP)

**Runiq** is a little Lisp-inspired scripting language that runs atop JavaScript.

Runiq is three things: (1) A [**syntax**][syntax] that makes it easy to express async algorithms as functional data structures, (2) a JavaScript-hosted [**parser and interpreter**][tool] that can run Runiq code on most platforms, and (3) an [**API for DSL-building**][dsl] that you can use to create your own mini-languages.

Runiq is free software, released under an **ISC License.**

**[Try Runiq &raquo;][try]**

## Features

* Lisp-esque syntax
* Runnable in Node or browser
* Functional paradigm
* Human-writable JSON AST
* Async processing
* Stepwise computation (pause &amp; resume)
* Code as data, data as code
* Serializable programs &amp; state
* DSL builder for developers
* Localizable
* Macros _(coming soon)_

## Example

Here's a sample Runiq program:

    ; Compute eighth Fibonacci number ;
    (ycomb (lambda fn n (quote
      (if (<= n 2)
        (quote (1))
       else
        (quote (+ (ycomb fn (- n 1))
                  (ycomb fn (- n 2)))))
    )) 8)

And here's the AST of that same program:

    ["ycomb", ["lambda", "fn", "n", ["quote",
      ["if", ["<=", "n", 2],
        ["quote", [1]],
       "else",
        ["quote", ["+",
           ["ycomb", "fn", ["-", "n", 1]],
           ["ycomb", "fn", ["-", "n", 2]]]]]
    ]], 8]

[For more, see the Runiq wiki &raquo;][wiki]

## Installation

Runiq may be installed via NPM:

    $ npm install runiq

[For more, see the Runiq wiki &raquo;][wiki]

## Usage

### Programmatic

Here's the simplest example:

    var Runiq = require('runiq');
    Runiq.run("(+ 5 3)", {
      success: function(result) {
        // result will be 8
      }
    });

Lower-level hooks are available.

[For more, see the Runiq wiki &raquo;][wiki].

### Command Line

To use the Runiq CLI, install Runiq globally...

    $ npm i -g runiq

Then try this:

    $ echo '(print "Hello World")' > hello.rune
    $ runiq hello.rune

Or open a (feature-lacking) "REPL":

    $ runiq
    > (+ 1 2)

[For more, see the Runiq wiki &raquo;][wiki].

## [API Documentation][docs]

## Motivation

Runiq begain as an experiment in safely running untrusted code. I wanted to create a mini-language that could act as a sandbox, whose level of "power" I could easily customize for different users and use cases. I wanted a language where...

* Sandbox escape would be impossible (by default)
* Coders could gain access to language features via trust systems
* No requirement of booting up a VM
* Programs could run "anywhere"
* I could pause long-running (or never-ending) programs...
* ...and resume them without corrupting their state

Along the way I added more requirements (why not?), such as the ability for engineers to plug their own keywords into the language, and a Lisp-inspired syntax that could be approachable for beginners yet also appealing to hackers. The result is what you have here.

[For more, see the Runiq wiki &raquo;][wiki]

## See Also

* [LispyScript](http://lispyscript.com/)
* [LJSON](https://github.com/MaiaVictor/LJSON)
* [Wildflower](https://github.com/pschanely/wildflower)
* [Paredit.js](http://robert.kra.hn/projects/paredit-js)
* [Transit](https://github.com/cognitect/transit-format)

## Help & Troubleshooting

[Join the Runiq Slack channel][help].

## Reporting Bugs

[File bugs on GitHub Issues][issues].

## Development

To get your local setup going:

* Clone the repo
* `npm install`
* `npm run test`

## Contributing

Please submit pull requests!

## Author

[Matthew Trost][me]

## Copyright

Copyright (c) 2015-2016 Matthew Trost

## License

ISC License. See LICENSE.txt.

[me]: http://trost.co
[docs]: https://github.com/matthewtoast/runiq/wiki/API-Documentation
[help]: https://runiq.slack.com/messages/general/
[issues]: https://github.com/matthewtoast/runiq/issues
[wiki]: https://github.com/matthewtoast/runiq/wiki
[syntax]: https://github.com/matthewtoast/runiq/wiki/Syntax
[tool]: https://github.com/matthewtoast/runiq/wiki/Usage
[dsl]: https://github.com/matthewtoast/runiq/wiki/DSL-Builder
[try]: http://matthewtoast.github.io/runiq/
