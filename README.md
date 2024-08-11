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
functions -- trigonometry and square roots. And when I was done, I wanted to watch the algorithm work.

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

## Algorithm

The algorithm demonstrated by this code is meant to find the area and centroid of a perimeter represented as a sequence of
cartesian coordinates, where these are understood to be connected by edges, the last point in the sequence further connected
to the first by an edge. It consists of the following steps:

1. Find and discard the central of a trio of colinear points. The points that remain will then always mark a bend in the perimeter. This facilitates later steps.
2. Look for any crossing segments. If these are found, this sequence does not represent a perimeter and the algorithm aborts.
3. Determine whether the convex direction of curvature when tracing the perimeter in the order the points are listed is to the right or to the left. This will allow us to find concavities -- places where the perimeter dips in and then back out.
4. Find and eliminate concavities by adding lines of cleavage that divide the perimeter into purely convex shapes.
5. Divide these convex shapes into triangles.
6. Map these triangles to their centroids and areas.
7. Merge the centroids by taking pairs of points and areas and replacing them with the balance point between them and their summed area, iterating until one pair remains. This is the centroid and area of the entire perimeter.

Is this the universal algorithm for finding the centroid and area of a perimeter? I don't know. It's just something it occurred to me might be fun to implement.

This algorithm has a number of nice properties: the only expensive math it requires is square roots, which are required to implement Heron's Formula to find the area of the triangles. Other than that, it just uses arithmetic and numeric comparisons. Because we are only interested in colinearity, curving to the left, or curving to the right, not exact angles, we avoid trigonometry.

To find the convex curvature, we find the points with the lowest x coordinate. The direction of curvature of two segments meeting at these points is necessarily the convex direction. Otherwise, one or the two segments would be terminated at the other end by a point with a still lower x coordinate. There is nothing special about x versus y or positive versus negative. We just need to choose one side of the bounding box for the whole perimeter and look at the points on that side. The left side of the box -- the minimal x direction -- seemed more convenient.

To find concavities we go around the perimeter, considering each pair of adjoining segments. If they curve the right way, we move on. Otherwise, we scan forward, looking for a point we could connect this point to such that this new segment and the first segment curve convexly and such that it doesn't cross any segments in the perimeter. When we find such a segment, which we necessarily will, we split the perimenter into two along this new segment and recurse. If we find a triangle, we test no corners because it is necessarily convex. When all we have is convex polygons, we are done.

It might be possible to make this algorithm more efficient by optimizing the scanning. It could be that the optimization step would be more expensive than any gain from improving the scanning strategy.

## Interface

The point of this was partly to play with this particular algorithm, but partly simply to create a framework to facilitate visualizing algorithms generally. One could pop `GraphicalTutor` out and make a nicer interface. This repo, though, provides a simple interface via the `index.html` file that sits alongside this README. 

## Dedication

This project is dedicated, like all my projects, to my son Jude, known on github as [TurkeyMcMac]( https://github.com/TurkeyMcMac). He would have appreciated this
more than anyone. It's the sort of thing he might have done himself. He would have done it better and with less gassing about.

I miss you, Jude. You were the best person I've ever known. I love you.
