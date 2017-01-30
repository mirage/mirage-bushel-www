---
authors: [Thomas Gazagnaire]
categories: [News]
title: "COW: OCaml on the Web"
permalink: /wiki/cow
date: 2010-12-13
layout: page
---

Writing web-applications requires a lot of skills: [HTML](http://en.wikipedia.org/wiki/HTML),
[CSS](http://en.wikipedia.org/wiki/Cascading_Style_Sheets), [XML](http://en.wikipedia.org/wiki/XML),
[JSON](http://en.wikipedia.org/wiki/JSON), [Markdown](http://en.wikipedia.org/wiki/Markdown),
[JavaScript](http://en.wikipedia.org/wiki/JavaScript) and [SQL](http://en.wikipedia.org/wiki/SQL), to name but a few!
You also need to master the art of plumbing: translating concepts across languages is tedious and
error-prone.

This post describes a library we developed to help solve these problems, dubbed
[Cow](http://www.github.com/samoht/mirage/lib/cow) (for __Caml On the Web__).
Cow generalises our previous post about [HTCaML](/wiki/htcaml) by:

* extending standard OCaml syntax with embedded web [DSLs](http://en.wikipedia.org/wiki/Domain-specific_language). It has a quotation mechanism which parses HTML, CSS or XML to OCaml, and also anti-quotations that form a template mechanism.

* using type-driven code generation to generate markup directly from OCaml type declarations. It is possible to mix hand-written and generated code to deal with special-cases.

Most of the work is done at pre-processing time, so there is no runtime costs and the generated OCaml code can be manually inspected if desired.

<img src="/graphics/cow-schema.png" alt="schema" width="50%"/>

####Quotations and anti-quotations

Camlp4 quotations are an easy way to manipulate the OCaml syntax tree and embed custom syntax.
Quotations are named, and are enclosed between `<:name< ... >>`.
Each name has a corresponding parser that handles the contents between the angle brackets.
Code can still be embedded via __anti-quotations__ that escape back to the
OCaml world using `$...$` inside quotations.
Lets show an example of this via a built-in `camlp4` quotation, `<:expr< ... >>`, which translates OCaml syntax into its corresponding AST fragment (as the compiler itself does):

```
let x = <:expr< Random.int 10 >>
let e = <:expr< 1 + $x$ >>
let t = <:ctyp< int list >>
```

instead of the more tedious:

```
let x =
  Ast.ExApp (_loc,
    (Ast.ExId (_loc,
      (Ast.IdAcc (_loc,
        (Ast.IdUid (_loc, "Random")),
        (Ast.IdLid (_loc, "int")))))),
    (Ast.ExInt (_loc, "10")))

let e =
  Ast.ExApp (_loc,
    (Ast.ExApp (_loc,
      (Ast.ExId (_loc,
        (Ast.IdLid (_loc, "+")))),
          (Ast.ExInt (_loc, "1")))),
    x)

let t =
  Ast.TyApp (_loc,
    (Ast.TyId (_loc,
      (Ast.IdLid (_loc, "int")))),
        (Ast.TyId (_loc,
          (Ast.IdLid (_loc, "list")))))
```

In Cow, each web syntax registers its own quotation, within which a user
can write any valid code of the embedded language, and use anti-quotations to call
back into OCaml code. Values produced by anti-quotations should be of
the same type as the quotations they are embedded in.
Below is an example of an HTML quotation:

```
let world : Html.t = <:html< "World" >>
let html = <:html< <h1>Hello $world$!</h1> >>
```

Here, quotations will be expanded to values of type `Html.t` (the type annotation is provided
for clarity, and is usually inferred automatically).

It is possible to give hints to the quotation expander about the expected type of a given anti-quotation.
The hints appear as a prefix of the anti-quotations; the usual
ones are `$str:...$` for strings, `$int:...$` and `$flo:...$` for numerals and `$list:...$` for lists.
The preceding example could thus be written as:

```
let world = "world"
let html = <:html< <h1>Hello $str:world$!</h1> >>
```

It is possible to use different quotations in the same file:

```
let css = : Css.t = <:css<
  h1 $tag$ {
    font-style: bold;
    $Css.rounded_corners$;
  } >>

let xml : Xml.t =
  <:xml< <book><title>foo</title></book> >>

let js : Javascript.t =
  <:js< document.write("This is my first JavaScript!"); >>

let js2 : Javascript.t =
  <:camlscript< List.iter print_int [1;2;3] >>
```

The `<:css< >>`, `<:xml< >>` and `<:html< >>` quotations are present in MirageOS today, and the `<:js< >>` and `<:camlscript< >>` quotations will be integrated soon.  `js` uses Jake Donham's [ocamljs](https://github.com/jaked/ocamljs) and an early prototype of `camlscript` is [available](https://github.com/samoht/camlscript) on Github.

###Type-driven Code Generation

In ML, we rely on the type-inferrer/checker as much as possible. Types are usually specified first, followed by the functions which manipulate values of those types.
The static typing in OCaml means that type information is discarded at run-time, making it cheap to encode as much of the problem in the types as possible. 

* the language of types is expressive (product types, sum types, objects, type variables, etc.)
* the language of types is concise.
* all the complex types are inferred.

So the idea in Cow is to use normal OCaml types in programs and __automatically__ generate web fragments
from them. We previous experimented with a similar approach to [persist ML values](http://gazagnaire.org/pub/GM10.pdf) via a SQL-based Object Relational Mapper.

Let's try to create a web-page containing some [tweets](http://twitter.com) using quotations only.
First of all, let's define the types:

```
type user = {
  id_str      : string;
  screen_name : string;
}

type status = {
  id   : int;
  user : user;
  text : string;
}
```

Then let us reason by induction on the types.

For user:

```
let html_of_user u = <:html<
  <div class=id_str>$str:u.id_str$</div>
  <div class=screen_name>$str:u.screen_name$</div>
>>

let css_of_user = <:css<
  .id_str { display: none; }
  .screen_name { display: inline; color: blue; }
>>
```

For status updates:

```
let html_of_status s = <:html
  <div class=id>$int:s.id$</div>
  <div class=user>$html_of_user s.u$</div>
  <div class=text>$str:s.text$</div>
>>

let css_of_status = <:css<
  .id { display: none; }
  .user $css_of_user$;
  .text { color: grey; }
>>
```

The coding style is nice because we can write HTML and CSS fragments
close to where the type is defined.  However, some of the code
written to generate the HTML fragments is quite repetitive.
Fortunately, Cow can generate default code based on annotated type
definitions. The `html_of_user` and `html_of_status` functions above
can be automatically generated by adding `with html` to type
definitions, as shown below:

```
type user = {
  id_str      : string;
  screen_name : string;
} with html

type status = {
  id   : int;
  user : user;
  text : string;
} with html
```

The `css_of_*` values are very application specific and so there is no support for
auto-generating this. However, it may be possible to generate a CSS validator to
check that the CSS fragment generated for a type does not define classes which are not defined
in the type.

####More code generation

The next step is to use the Twitter API to actually read tweets? The API uses JSON, and most of the
existing implementations use a JSON un-marshaler to association lists, and then build an ML object out of it
(such as [ocamltter](https://github.com/yoshihiro503/ocamltter) or [ocaml-twitterstream](https://github.com/mariusaeriksen/ocaml-twitterstream)).
In Cow, we instead rely on code-generation like [this](https://github.com/avsm/mirage/blob/master/lib/cow/lib/twitter.ml):

```
type user = {
  id_str      : string;
  screen_name : string;
} with json

type status = {
  id   : int;
  user : user;
  text : string;
} with json
```

The `type t = [..] with json` will __automatically__ generate JSON marshal and unmarshalling functions:

```
val t_of_user : t -> Json.t
val user_of_t : Json.t -> t
```

It is possible to combine multiple code generators by separating the annotations with a comma, e.g.
`type t = [..] with html,json`. It is thus possible to use Cow with the [ORM](https://www.github.com/mirage/orm)
library to persist typed values with SQLite (this is not integrated into MirageOS just yet, but will be soon).

####Mixing generated and hand-written code

Manual and automatic code generation can also be easily mixed. The code which is auto-generated simply calls
into other functions with predictable names (e.g. `html_of_foo`). Since OCaml is lexically scoped, the user simply
has to override this function by manually defining it, and it will be used in place of the auto-generated fragment.

A good example of mixing automatically generated and manually written code is the
[bindings](http://www.github.com/avsm/blob/master/mirage/lib/cow/lib/atom.ml) to
[Atom](http://en.wikipedia.org/wiki/Atom_%28standard%29) for blog syndication.
This has some very specific attribute names in the content which cannot be auto-generated:

```
type meta = [..] with xml

type content = Xml.t

let xml_of_content c = <:xml<
  <content type="xhtml">
    <xhtml:div xmlns:xhtml="http://www.w3.org/1999/xhtml">
      $c$
    </xhtml:div>
  </content>
>>

type entry = {
  entry   : meta;
  summary : string option;
  content : content;
} with xml

type feed = {
  feed    : meta;
  entries : entry list;
}

let xml_of_feed f = <:xml<
  <feed xmlns="http://www.w3.org/2005/Atom">
    $xml_of_meta f.feed$
    $list:List.map xml_of_entry f.entries$
  </feed>
>>
```

This has been a quick overview of the Cow syntax handlers in MirageOS. They are still a work-in-progress, but this website is built using them. Thanks to Jake Donham and Nicolas Pouillard for their excellent [meta-programming tutorial](https://github.com/jaked/cufp-metaprogramming-tutorial/tree/master/solutions/ocaml/json_quot) at [CUFP 2010](http://cufp.org/conference/sessions/2010/camlp4-and-template-haskell) that kicked off this work.
