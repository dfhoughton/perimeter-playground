import {
  centroid,
  Centroid,
  Curvature,
  determineConvexDirection,
  Point,
  Segment,
} from "../geometry";

test("utility_functions has at least one test", () => expect(true).toBe(true));

const describePerimeter = (p: Point[]): string => {
  let s = p.map((s) => s.describe()).join(" -> ");
  s += " -> " + p[0].describe();
  return s;
};

const pointsToPerimeter = (points: Point[]): Segment[] => {
  const perimeter: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    perimeter.push(new Segment(points[i], points[i+1]));
  }
  perimeter.push(new Segment(points[points.length - 1], points[0]));
  return perimeter;
};

const allStartingPoints = (points: Point[]): Point[][] => {
  const allPerimeters: Point[][] = [];
  for (let i = 0; i < points.length; i++) {
    let k = i;
    let perimeter: Point[] = [];
    for (let j = 0; j < points.length; j++) {
      perimeter.push(points[k++]);
      if (k == points.length) k = 0;
    }
    allPerimeters.push(perimeter);
  }
  return allPerimeters;
};

const testAllStartingPoints = (perimeter: Point[], curvature: Curvature) => {
  for (const p of allStartingPoints(perimeter)) {
    describe(describePerimeter(p), () => {
      test(`curves to the ${curvature}`, () =>
        expect(determineConvexDirection(pointsToPerimeter(p))).toEqual(
          curvature
        ));
    });
  }
};

describe("determineConvexDirection", () => {
  testAllStartingPoints(
    [new Point(0, 0), new Point(3, -3), new Point(3, 3)],
    Curvature.Left
  );
  testAllStartingPoints(
    [new Point(0, 0), new Point(3, 3), new Point(3, -3)],
    Curvature.Right
  );
  testAllStartingPoints(
    [
      new Point(0, 0),
      new Point(0, -1),
      new Point(0, -2),
      new Point(1, -2),
      new Point(1, -3),
      new Point(0, -3),
      new Point(0, -4),
      new Point(0, -5),
      new Point(2, -5),
      new Point(2, 0),
    ],
    Curvature.Left
  );
  testAllStartingPoints(
    [new Point(0, 0), new Point(2, 0), new Point(2, -2), new Point(0, -2)],
    Curvature.Right
  );
  testAllStartingPoints(
    [new Point(0, 0), new Point(2, 0), new Point(2, 2), new Point(0, 2)],
    Curvature.Left
  );
  testAllStartingPoints(
    [new Point(0, 2), new Point(0, -2), new Point(2, 0)],
    Curvature.Left
  );
  testAllStartingPoints(
    [new Point(0, 2), new Point(2, 0), new Point(0, -2)],
    Curvature.Right
  );
});

const testCentroids = (c1: Centroid, c2: Centroid, p: Point) => {
  const [p1, w1] = c1;
  const [p2, w2] = c2;
  describe(`${p1.describe()}, ${w1} and ${p2.describe()}, ${w2} have centroid ${p.describe()}`, () => {
    const [_s2, [p3, _w4]] = centroid(c1, c2);
    expect(p3.x()).toBeCloseTo(p.x())
    expect(p3.y()).toBeCloseTo(p.y())
  })
}
describe('centroid', () => {
  testCentroids([new Point(0, 0), 1], [new Point(0, 2), 1], new Point(0, 1));
  testCentroids([new Point(0, 0), 1], [new Point(2, 0), 1], new Point(1, 0));
  testCentroids([new Point(0, 0), 2], [new Point(3, 0), 1], new Point(1, 0));
  testCentroids([new Point(0, 0), 2], [new Point(0, 3), 1], new Point(0, 1));
  // diagonals
  testCentroids([new Point(0, 0), 1], [new Point(2, 2), 1], new Point(1, 1));
  testCentroids([new Point(0, 0), 2], [new Point(4, 4), 1], new Point(4 / 3, 4 / 3));
});