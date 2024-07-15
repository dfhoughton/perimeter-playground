import { Curvature, Point, Vector } from "../geometry";

test("vector has at least one test", () => expect(true).toBe(true));

// rotate the given vector beta degrees counterclockwise about its start point
const rotate = (v: Vector, beta: number): Vector => {
  // move so start is at origin
  const start = v.start().clone();
  const x = v.end().x() - start.x();
  const y = v.end().y() - start.y();
  // see https://matthew-brett.github.io/teaching/rotation_2d.html
  const x2 = Math.cos(beta) * x - Math.sin(beta) * y;
  const y2 = Math.sin(beta) * x + Math.cos(beta) * y;
  // translate this new endpoint
  const end = new Point(x2 + start.x(), y2 + start.y());
  return new Vector(start, end);
};
// return a vector identical to the current vector but which starts where this vector ends
const translate = (v: Vector): Vector => {
  const start = new Point(
    v.start().x() + v.end().x(),
    v.start().y() + v.end().y()
  );
  const end = new Point(v.end().x() + v.end().x(), v.end().y() + v.end().y());
  return new Vector(start, end);
};
const randomRotationLeft = () => Math.random() * Math.PI;
const randomRotationRight = () => randomRotationLeft() + Math.PI;
// returns 101 vectors that start where the given vector ends
// the first of these is colinear and points in the same direction
const oneHundredAndOneSampleVectors = (
  initial: Vector
): Array<[Vector, Curvature]> => {
  const seed = translate(initial);
  const ar: Array<[Vector, Curvature]> = [[seed, Curvature.Colinear]];
  const nonColinearAmt = (f: () => number): number => {
    let n = f();
    const divisibleByPi = (n: number): boolean => {
      return Math.floor(n / Math.PI) === n / Math.PI;
    };
    while (divisibleByPi(n)) n = f();
    return n;
  };
  for (let i = 0; i < 50; i++) {
    let l = nonColinearAmt(randomRotationLeft);
    let r = nonColinearAmt(randomRotationRight);
    ar.push([rotate(seed, l), Curvature.Left]);
    ar.push([rotate(seed, r), Curvature.Right]);
  }
  return ar;
};
describe("Vector", () => {
  describe("curvature", () => {
    const initialVectors: Array<Vector> = [];
    for (const [x, y] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const v = new Vector(new Point(0, 0), new Point(x, y));
      initialVectors.push(v);
      initialVectors.push(rotate(v, Math.PI / 6));
      initialVectors.push(rotate(v, Math.PI / 3));
    }
    for (const v1 of initialVectors) {
      for (const [v2, curvature] of oneHundredAndOneSampleVectors(v1)) {
        test(`${v1.describe()} to ${v2.describe()} curves as expected`, () =>
          expect(v1.curvature(v2)).toEqual(curvature));
      }
    }
  });
});
