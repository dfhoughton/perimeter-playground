import { Point, Segment, Triangle } from "../geometry";

test("triangle has at least one test", () => expect(true).toBe(true));

const generalTriangleTest = (t: Triangle, area: number) => {
  t = t.clone();
  test(`area is ${area}`, () => expect(t.area).toBeCloseTo(area));
  for (const p of [
    t.a,
    t.b,
    t.c,
    new Segment(t.ab.midpoint(), t.c).midpoint(),
    new Segment(t.ac.midpoint(), t.b).midpoint(),
    new Segment(t.bc.midpoint(), t.a).midpoint(),
  ]) {
    test(`maybe contains ${p.describe()}`, () =>
      expect(t.maybeOverlaps(p)).toBe(true));
    test(`contains ${p.describe()}`, () => expect(t.contains(p)).toBe(true));
  }
  test(`contains centroid`, () => expect(t.contains(t.centroid)).toBe(true));
  const outsidePoints: Point[] = [];
  for (let i = 0; i < 10; i++) {
    outsidePoints.push(
      new Point(
        t.xMin - Math.random(),
        Math.random() * 100 - 50 + t.centroid.yMin
      )
    );
    outsidePoints.push(
      new Point(
        t.xMax + Math.random(),
        Math.random() * 100 - 50 + t.centroid.yMin
      )
    );
    outsidePoints.push(
      new Point(
        Math.random() * 100 - 50 + t.centroid.xMin,
        t.yMin - Math.random()
      )
    );
    outsidePoints.push(
      new Point(
        Math.random() * 100 - 50 + t.centroid.xMin,
        t.yMax + Math.random()
      )
    );
  }
  for (const p of outsidePoints) {
    test(`${p.describe()} does not overlap the minimal containing box`, () =>
      expect(t.maybeOverlaps(p)).toBe(false));
  }
  return t;
};

describe("Triangle", () => {
  let a: Point, b: Point, c: Point, t: Triangle;

  // half a 4 x 4 square
  (a = new Point(0, 0)), (b = new Point(0, 4)), (c = new Point(4, 0));
  t = new Triangle(a, b, c);
  describe(t.describe(), () => {
    const triangle = generalTriangleTest(t, 8);
    const p = new Point(3, 3);
    describe(`${p.describe()} is inside ${triangle.describe()}'s minimal box but outside of the triangle itself`, () => {
      test(`maybeOverlaps is true`, () =>
        expect(triangle.maybeOverlaps(p)).toBe(true));
      test(`contains is false`, () => expect(triangle.contains(p)).toBe(false));
    });
  });
  (a = new Point(4, 3)), (b = new Point(7, 5)), (c = new Point(5, 7));
  t = new Triangle(a, b, c);
  describe(t.describe(), () => {
    const triangle = t.clone(); //generalTriangleTest(t, 5);
    for (const [x, y] of [
      [6.5, 3.5],
      [6.5, 6.5],
      [4.5, 6.5],
    ]) {
      const p = new Point(x, y);
      describe(`${p.describe()} is inside ${triangle.describe()}'s minimal box but outside of the triangle itself`, () => {
        test(`maybeOverlaps is true`, () =>
          expect(triangle.maybeOverlaps(p)).toBe(true));
        test(`contains is false`, () =>
          expect(triangle.contains(p)).toBe(false));
      });
    }
  });
  // some regressions
  const points: [x: number, y: number][] = [
    [8, -10.8],
    [2.7, -16.9],
    [6, -4.7],
  ];
  describe("all permutations of the same 3 points give the same centroid", () => {
    let commonCentroid: Point | null = null;
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1, c1 = 0; c1 < 3; j++, c1++) {
        if (j === 3) j = 0;
        if (j === i) continue;
        for (let k = j + 1, c2 = 0; c2 < 3; k++, c2++) {
          if (k === 3) k = 0;
          if (k === j || k === i) continue;
          const t = new Triangle(
            new Point(...points[i]),
            new Point(...points[j]),
            new Point(...points[k])
          );
          test(`${t.describe()} has a defined centroid`, () =>
            expect(commonCentroid).not.toBeNull());
          if (commonCentroid === null) {
            commonCentroid = t.centroid;
          } else {
            test(`the x coordinate of the centroid of ${t.describe()} is ${commonCentroid.x()}`, () =>
              expect(t.centroid.x()).toBeCloseTo(commonCentroid!.x()));
            test(`the y coordinate of the centroid of ${t.describe()} is ${commonCentroid.y()}`, () =>
              expect(t.centroid.y()).toBeCloseTo(commonCentroid!.y()));
          }
        }
      }
    }
  });
});
