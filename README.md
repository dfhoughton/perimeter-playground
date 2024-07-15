# Perimeter Playground

This project is about visualizing algorithms, specifically algorithms relating to perimeters.

It began because through work I suddenly became interested in the GPS perimeters of farms thanks to the EU Deforestation
Regulation. With a farm perimeter and aerial photography one could determine whether a particular farm was associated with
deforestation, but also whether it was contained within a larger perimeter -- the border of a country or region -- its
area, its geographic center, and so on. All the algorithms relating to these things have been written and well optimized,
but it was amusing to me to reinvent them, and in particular, to visualize them.

Given a perimeter one should confirm that it is well-formed -- fully connected without crossing lines. One might want to
remove colinear points to simplify it and ensure that all triangles one decomposed it into had non-zero area. One would want
to decompose it into triangles from which one could compute its area and geographic center. One could convert these triangles
into a binary search tree to rapidly determine whether the perimeter contained a given point.

I wanted to do these things, and I wanted to do them with algorithms which avoided as much as possible expensive transcendental
functions -- minimize trigonometry and square roots. And when I was done, I wanted to watch the algorithm work.

So the code in this project consists of a GraphicalTutor, which fascilitates representing any algorithm as an animation, some
general geometric classes -- point, segment, vector, triangle, circle -- and some algorithms specific to perimeters. The point
is not to invent a better algorithm, since this is well-trodden ground, but to have fun reinventing algorithms, and to produce
something one could use to explain these algorithms.

## Building and running the code

I have deliberately avoided all non-development dependencies. There is no React. There is no D3. This is just raw typescript
compiled to raw javascript.

There are two scripts in its `package.json`: build and test. The latter consists of some unit tests confirming particular
algorithms work (in all the cases tested). The former uses esbuild to compile the typescript into `bundle.js`. Having compiled
it, you can open the `test.html` file and play with the code. It compiles to about 1000 lines of unminimized javascript.

## Dedication

This project is dedicated, like all my projects, to my son Jude, known on github as [TurkeyMcMac]( https://github.com/TurkeyMcMac). He would have appreciated this
more than anyone. It's the sort of thing he might have done himself. He would have done it better and with less gassing about.

I miss you, Jude. You were the best person I've ever known. I love you.
