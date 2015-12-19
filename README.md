# Runiq (WIP)

**Runiq** is a customizable scripting language for tinkerers. Runiq allows engineers to create simple mini-languages with Lisp-like syntax that can run in almost any environment, and which are easy to learn. It's great for making things programmable but only as programmable as you want.

Runiq is three things: (1) A [**syntax**][syntax] for writing functional code snippets, (2) a [**software tool**][tool] for parsing and interpreting Runiq syntax, and (3) a hacker's [**API for DSL-building**][dsl]. Your own Runiq-based mini-language can abstract away complex async logic with little boilerplate.

The Runiq interpreter is written in JavaScript; you can run Runiq scripts most places JavaScript runs. Runiq scripts, including their state, are entirely serializable. In fact, the AST is human-writable JSON. Runiq is free software, released under an **ISC License.**

## Features

* Functional paradigm
* Minimal, Lisp-esque syntax
* Runnable in Node or browser
* Simple, human-writable JSON AST
* Trivial async processing
* Stepwise computation (pause &amp; resume)
* Code as data, data as code
* DSL builder for developers
* Localizable

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

Here's the simplest example of how to run a Runiq script:

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

Along the way I added more requirements (why not?), such as the ability for engineers to build their own variants of the language, and a syntax, based on Lisp, that could be approachable for beginners yet also appealing to hackers. The result is what you have here.

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
