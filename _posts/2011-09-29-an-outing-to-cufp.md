---
authors: [Anil Madhavapeddy]
category: Events
title: "An Outing to CUFP 2011"
permalink: an-outing-to-cufp
layout: post
---

The team signed up to do a tutorial at [CUFP](http://cufp.org) on the topic of [Building a Functional OS](http://cufp.org/conference/sessions/2011/t3-building-functional-os), which meant zooming off to Tokyo!  This was the first public show of the project, and resulted in a furious [flurry of commits](https://github.com/avsm/mirage/graphs/impact) from the whole team to get it ready. The 45-strong crowd at the tutorial were really full of feedback, and particular thanks to [Michael](http://www.deinprogramm.de/sperber/) for organising the event, and [Yaron](http://ocaml.janestreet.com/?q=blog/5), [Marius](http://monkey.org/~marius/), [Steve](https://twitter.com/#!/stevej), [Wil](https://twitter.com/wil), [Adrian](https://twitter.com/#!/adoemon) and the rest for shouting out questions regularly!

* *The tutorial* is [a Mirage application](http://github.com/avsm/mirage-tutorial), so you can clone it and view it locally through your web browser. The content is mirrored at [tutorial.openmirage.org](http://tutorial.openmirage.org), although it does require cleanup to make it suitable to an online audience. The SVG integration is awkward and it only works on Chrome/Safari, so I will probably rewrite it using [deck.js](http://imakewebthings.github.com/deck.js/) soon. The tutorial is a good showcase of Mirage, as it compiles to Xen, UNIX (both kernel sockets and direct tuntap) with a RAMdisk or external filesystem, and is a good way to mess around with application synthesis (look at the `Makefile` targets in `slides/`).

* *Installation*: [instructions](/wiki/install) have been simplified, and we now only require OCaml on the host and include everything else in-tree. Thomas has also made Emacs and Vim plugins that are compatible with the ocamlbuild layout.

* *Lwt*: a [new tutorial](/wiki/tutorial-lwt) which walks you through the cooperative threading library we use, along with exercises (all available in [mirage-tutorial](http://github.com/avsm/mirage-tutorial)). Raphael and Balraj are looking for feedback on this, so get in touch!

* *Javascript*: via [node.js](http://nodejs.org) did not work in time for the tutorial, as integrating I/O is a tangled web that will take some time to sort out. Raphael is working on this in a [separate tree](https://github.com/raphael-proust/nodejs_of_ocaml) for now.  As part of this effort though, he integrated a pure OCaml [regular expression library](/wiki/ocaml-regexp) that does not require C bindings, and is surprisingly fast.

* *Devices*: we can now synthesise binaries that share common code but have very different I/O interfaces. This is due to a new device manager, and David also heroically wrote a complete [FAT12/16/32 library](http://github.com/avsm/mirage/tree/master/lib/fs) that we demonstrated.  Yaron Minsky suggested a [different approach](https://gist.github.com/1245418) to the device manager using [first-class modules](http://caml.inria.fr/pub/docs/manual-ocaml/manual021.html#toc81) instead of objects, so I am experimentally trying this before writing documentation on it.

* *TCP*: the notorious Mirage stack is far more robust due to our resident networking guru Balraj hunting down last-minute bugs. Although it held together with sticky tape during the tutorial, he is now adding retransmission and congestion control to make it actually standards-compliant.  Still, if you dont have any packet loss, the [unikernel version](http://xen.openmirage.org/) of this website does actually serve pages.

* *OpenFlow*: is a new [standard](http://www.openflow.org/wk/index.php/OpenFlow_v1.0) for [Software Defined Networking](http://networkheresy.wordpress.com/), and Haris and Mort have been hacking away at a complete implementation directly in Mirage!  We will be giving a tutorial on this at the [OFELIA summer school](http://changeofelia.info.ucl.ac.be/) in November (it is summer somewhere, I guess). The prospect of a high-speed unikernel switching fabric for the cloud, programmed in a functional style, is something I am really looking forward to seeing!

* *Jane Street Core*: preceeding us was Yaron's [Core](http://cufp.org/conference/sessions/2011/t2-janestreets-ocaml-core-library) tutorial. Since Mirage provides it own complete standard library, we can adopt portions of Core that do not require OS threads or UNIX-specific features.  I really like the idea that Mirage enforces a discipline on writing portable interfaces, as dependencies on OS-specific features do sneak in insiduously and make switching to different platforms very difficult (e.g. Windows support). Incidentally, Yaron's [ACM Queue](http://queue.acm.org/detail.cfm?id=2038036&ref=fullrss) article is a great introduction to OCaml.

So as you can see, it has been a busy few months!  Much of the core of Mirage is settling down now, and we are writing a paper with detailed performance benchmarks of our various backends.  Keep an eye on the [Github milestone](https://github.com/avsm/mirage/issues?milestone=2&state=open) for the preview release, join our [new mailing list](https://lists.cam.ac.uk/mailman/listinfo/cl-mirage), or follow the newly sentient [openmirage on twitter](http://twitter.com/openmirage)!
