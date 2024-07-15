import { Point, Segment } from "../geometry";

test("segment has at least one test", () => expect(true).toBe(true));

describe("Segment", () => {
  let s: Segment, a: Point, b: Point;

  describe("horizontal", () => {
    (a = new Point(0, 0)), (b = new Point(1, 0));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      test(`length is 1`, () => expect(segment.length).toBeCloseTo(1));
      test(`slope is 0`, () => expect(segment.slope).toBeCloseTo(0));
    });
  });

  describe("vertical", () => {
    (a = new Point(0, 0)), (b = new Point(0, 1));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      test(`length is 1`, () => expect(segment.length).toBeCloseTo(1));
      test(`slope is null`, () => expect(segment.slope).toBeNull());
    });
  });

  describe("diagonal", () => {
    (a = new Point(0, 0)), (b = new Point(1, 1));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      const length = Math.sqrt(2);
      test(`length is ${length}`, () =>
        expect(segment.length).toBeCloseTo(length));
      test(`slope is 1`, () => expect(segment.slope).toBeCloseTo(1));
    });
  });

  describe("translation doesn't change length or slope", () => {
    (a = new Point(0 + 1, 0 + 1)), (b = new Point(1 + 1, 1 + 1));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      const length = Math.sqrt(2);
      test(`length is ${length}`, () =>
        expect(segment.length).toBeCloseTo(length));
      test(`slope is 1`, () => expect(segment.slope).toBeCloseTo(1));
    });
  });

  describe("order of points is irrelevant", () => {
    (a = new Point(1, 1)), (b = new Point(0, 0));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      const length = Math.sqrt(2);
      test(`length is ${length}`, () =>
        expect(segment.length).toBeCloseTo(length));
      test(`slope is 1`, () => expect(segment.slope).toBeCloseTo(1));
    });
  });

  describe("slope is rise over run", () => {
    (a = new Point(0, 0)), (b = new Point(4, 2));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      test(`slope is 0.5`, () => expect(segment.slope).toBeCloseTo(0.5));
    });
    (a = new Point(4, 2)), (b = new Point(0, 0));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      test(`slope is 0.5`, () => expect(segment.slope).toBeCloseTo(0.5));
    });
    (a = new Point(0, 0)), (b = new Point(4, -2));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      test(`slope is -0.5`, () => expect(segment.slope).toBeCloseTo(-0.5));
    });
    (a = new Point(0, 0)), (b = new Point(2, 4));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      test(`slope is 2`, () => expect(segment.slope).toBeCloseTo(2));
    });
    (a = new Point(0, 4)), (b = new Point(4, 0));
    s = new Segment(a, b);
    describe(s.describe(), () => {
      const segment = s.clone();
      test(`slope is -1`, () => expect(segment.slope).toBeCloseTo(-1));
    });
  });

  describe("intersection", () => {
    const s1 = new Segment(new Point(0, 4), new Point(2, 0));
    const s2 = new Segment(new Point(0, 2), new Point(4, 0));
    const intersection = s1.intersection(s2) as Point;
    test(`${s1.describe()} intersects ${s2.describe()} at (4/3, 4/3)`, () =>
      expect(intersection.x()).toBeCloseTo(4 / 3));
    test(`${s1.describe()} intersects ${s2.describe()} at (4/3, 4/3)`, () =>
      expect(intersection.y()).toBeCloseTo(4 / 3));
  });
});
