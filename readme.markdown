# mask

This is `mask`, a tiny MIT-licensed library providing collision masks
and thus pixel-perfect collision detection in JavaScript. Collision
masks are read from [PBM][] files.

[PBM]: http://netpbm.sourceforge.net/doc/pbm.html

## what's a PBM?

PBM is a minimalistic monochrome image format. One variant of it looks
like this:

````
P1
10 10
0000000000
0111111110
0110000010
0101000010
0100110010
0100110010
0100001010
0100000110
0111111110
0000000000
````

There are a number of tools to make PBM images -- ImageMagick's
`convert` tool will do it, and NetPBM [provides][pbm-tools] a suite of
confusing tools for working with it and its sister formats. You
probably want something like
`pngtopnm < in.png | pamditherbw | pamtopnm > out.pbm`.

[pbm-tools]: http://netpbm.sourceforge.net/doc/

# cool, how do I use this?

You probably want `mask.fromPBMUrl`, `mask.collision`, and
`mask.within`. There are some just-alright [docs][]. The source is
well-commented and not difficult; might as well take a look.

[docs]: https://github.com/startling/mask

# how can I help?

Pull requests are welcome; tests and jslint compliance are
appreciated.

You could also [toss me a few dollars][].

[toss me a few dollars]: https://www.gittip.com/startling/
