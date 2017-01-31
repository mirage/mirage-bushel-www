---
authors: [Anil Madhavapeddy]
category: General
title: "A Spring Wiki Cleaning"
permalink: spring-cleaning
layout: post
---

We've been plugging away on Mirage for the last few months, and things are starting to take shape nicely. As the older blog entries were out-of-date, we have shifted the descriptive material to a new [wiki](/wiki) section instead. What else has been happening?

* The Xen unikernel backend is fully event-driven (no interrupts) and very stable under stress testing now. The TCP stack is also complete enough to self-host this website, and you can try it out by navigating to [xen.openmirage.org](http://xen.openmirage.org). The stack doesnt actually do retransmissions yet, so your user experience may "vary". Check out the [installation](/wiki/install) and [hello world](/wiki/hello-world) guides to try it out for yourself.
* [Richard Mortier](http://www.cs.nott.ac.uk/~rmm/) has put together a performance testing framework that lets us analyse the performance of Mirage applications on different backends (e.g. UNIX vs Xen), and against other conventional applications (e.g. BIND for DNS serving). Read more in the wiki [here](/wiki/performance).
* [Thomas Gazagnaire](http://gazagnaire.org) has rewritten the website to use the COW syntax extensions. He has also started a new job with [OCamlPro](http://www.ocamlpro.com/) doing consultancy on OCaml, so congratulations are in order!
* Thomas has also started integrating experimental Node.js support to fill in our buzzword quota for the year (and more seriously, to explore alternative VM backends for Mirage applications). 
* The build system (often a bugbear of such OS projects) now fully uses [ocamlbuild](http://brion.inria.fr/gallium/index.php/Ocamlbuild) for all OCaml and C dependencies, and so the whole OS can be rebuilt with different compilers (e.g. LLVM) or flags with a single invocation.

There are some exciting developments coming up later this year too!

* [Raphael Proust](https://github.com/raphael-proust) will be joining the Mirage team in Cambridge over the summer in an internship.
* Anil Madhavapeddy will be giving several [tech talks](/wiki/talks) on Mirage: at the [OCaml User's Group](https://forge.ocamlcore.org/plugins/mediawiki/wiki/ocaml-meeting/index.php/OCamlMeeting2011) in Paris this Friday, at [Acunu](http://acunu.com) in London on May 31st, and at Citrix Cambridge on June 3rd. If you are interested, please do drop by and say hi.
* Verisign has supported the project with an [Internet Infrastructure Grant](http://www.marketwire.com/press-release/Verisign-Announces-Winners-of-Grants-Aimed-at-Strengthening-Internet-Infrastructure-NASDAQ-VRSN-1412893.htm).
* [David Scott](http://dave.recoil.org) (chief architect of the Xen Cloud Platform) and [Anil Madhavapeddy](http://anil.recoil.org) will give a joint tutorial on constructing functional operating systems at the [Commercial Users of Functional Programming](http://cufp.org) workshop in Tokyo, Japan in September.
