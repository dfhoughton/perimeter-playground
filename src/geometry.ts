export const enum GeometryType {
  Point,
  Segment,
  Vector, // a segment with a defined order to the points, so a defined direction; not really a vector
  Triangle,
  Circle,
}

export class Geometry {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  type(): GeometryType {
    throw new Error("subclasses of Geometry must implement a type method");
  }
  // returns whether the smallest box holding this geometry overlaps the smallest box holding the other geometry
  maybeOverlaps(other: Geometry): boolean {
    return (
      !(this.xMax < other.xMin || other.xMax < this.xMin) && // there is some x overlap
      !(this.yMax < other.yMin || other.yMax < this.yMin) // there is some y overlap
    );
  }
  // return some simple, human-readable stringification of the geometry
  describe(): string {
    throw new Error("subclasses of Geometry must implement a describe method");
  }
}

export class Point extends Geometry {
  constructor(x: number, y: number) {
    super();
    this.xMin = this.xMax = x;
    this.yMin = this.yMax = y;
  }
  type() {
    return GeometryType.Point;
  }
  x() {
    return this.xMin;
  }
  y() {
    return this.yMin;
  }
  equals(other: Point): boolean {
    return this.xMin === other.xMin && this.yMin === other.yMin;
  }
  distanceFrom(other: Point) {
    return Math.sqrt((this.x() - other.x()) ** 2 + (this.y() - other.y()) ** 2);
  }
  describe(): string {
    return `(${this.xMin}, ${this.yMin})`;
  }
  // a convenience method for testing
  clone(): Point {
    return new Point(this.xMin, this.yMin);
  }
}

export class Circle extends Geometry {
  center: Point;
  radius: number;
  constructor(center: Point, radius: number) {
    super();
    this.center = center;
    this.radius = radius;
    this.xMin = center.xMin - radius;
    this.xMax = center.xMax + radius;
    this.yMin = center.yMin - radius;
    this.yMax = center.yMax + radius;
  }
  type() {
    return GeometryType.Circle;
  }
}

// two points, understood as a line segment
export class Segment extends Geometry {
  a: Point;
  b: Point;
  length: number;
  slope: number | null;
  intercept: number | null;
  constructor(a: Point, b: Point) {
    super();
    this.a = a;
    this.b = b;
    let xDelta = true;
    let aIsStart = true;
    if (a.x() < b.x()) {
      this.xMin = a.x();
      this.xMax = b.x();
    } else {
      this.xMin = b.x();
      this.xMax = a.x();
      if (this.xMin === this.xMax) {
        xDelta = false;
      } else {
        aIsStart = false;
      }
    }
    let yDelta = true;
    if (a.y() < b.y()) {
      this.yMin = a.y();
      this.yMax = b.y();
    } else {
      this.yMin = b.y();
      this.yMax = a.y();
      yDelta = this.yMin !== this.yMax;
    }
    this.length = Math.sqrt(
      Math.pow(this.xMax - this.xMin, 2) + Math.pow(this.yMax - this.yMin, 2)
    );
    if (xDelta) {
      if (yDelta) {
        let start, end: Point;
        if (aIsStart) {
          start = a;
          end = b;
        } else {
          start = b;
          end = a;
        }
        this.slope = (end.y() - start.y()) / (end.x() - start.x());
        this.intercept = start.y() - this.slope * start.x();
      } else {
        this.slope = 0;
        this.intercept = this.yMin;
      }
    } else {
      this.slope = null;
      this.intercept = null;
    }
  }
  type() {
    return GeometryType.Segment;
  }
  describe(): string {
    return `${this.a.describe()} - ${this.b.describe()}`;
  }
  intersection(other: Segment): Segment | Point | null {
    if (this.maybeOverlaps(other)) {
      if (this.slope === other.slope) {
        if (this.intercept === other.intercept) {
          // these necessarily intersect in a segment
          if (this.slope === null) {
            const min = this.yMin < other.yMin ? other.yMin : this.yMin;
            const max = this.yMax < other.yMax ? this.yMax : other.yMax;
            if (min === max) return new Point(this.xMin, min);
            return new Segment(
              new Point(this.xMin, min),
              new Point(this.xMin, max)
            );
          } else if (this.slope === 0) {
            const min = this.xMin < other.xMin ? other.xMin : this.xMin;
            const max = this.xMax < other.xMax ? this.xMax : other.xMax;
            if (min === max) return new Point(min, this.yMin);
            return new Segment(
              new Point(min, this.yMin),
              new Point(max, this.yMin)
            );
          } else {
            const min = this.xMin < other.xMin ? other.xMin : this.xMin;
            const max = this.xMax < other.xMax ? this.xMax : other.xMax;
            return new Segment(
              new Point(min, this.slope * min + this.intercept!),
              new Point(max, this.slope * max + this.intercept!)
            );
          }
        } else {
          // these necessarily do not intersect
          return null;
        }
      } else {
        if (this.slope === null) {
          if (other.slope === 0) {
            // these necessarily intersect, if at all
            if (
              this.yMin >= other.yMin &&
              this.yMax <= other.yMin &&
              other.xMin >= this.xMin &&
              other.xMax <= this.yMin
            ) {
              return new Point(this.xMin, other.yMin);
            } else {
              return null;
            }
          } else {
            const y = other.slope! * this.xMin + other.intercept!;
            if (y >= this.yMin && y <= this.yMax) {
              return new Point(this.xMin, y);
            } else {
              return null;
            }
          }
        } else if (this.slope === 0) {
          if (other.slope === null) {
            // these necessarily intersect, if at all
            if (
              other.yMin >= this.yMin &&
              other.yMax <= this.yMin &&
              this.xMin >= other.xMin &&
              this.xMax <= other.yMin
            ) {
              return new Point(other.xMin, this.yMin);
            } else {
              return null;
            }
          } else {
            const x = (this.yMin - other.intercept!) / other.slope!;
            if (
              x >= this.xMin &&
              x <= this.xMax &&
              x >= other.xMin &&
              x <= other.xMax
            ) {
              return new Point(x, this.yMin);
            } else {
              return null;
            }
          }
        } else {
          if (other.slope === null) {
            const y = this.slope! * other.xMin + this.intercept!;
            if (
              y >= this.yMin &&
              y <= this.yMax &&
              y >= other.yMin &&
              y <= other.yMax
            ) {
              return new Point(other.xMin, y);
            } else {
              return null;
            }
          } else if (other.slope === 0) {
            const x = (other.yMin - this.intercept!) / this.slope!;
            if (
              x >= other.xMin &&
              x <= other.xMax &&
              x >= this.xMin &&
              x <= this.xMax
            ) {
              return new Point(x, other.yMin);
            } else {
              return null;
            }
          } else {
            const x =
              (this.intercept! - other.intercept!) / (other.slope - this.slope);
            const y = this.slope * x + this.intercept!;
            const p = new Point(x, y);
            if (p.maybeOverlaps(this) && p.maybeOverlaps(other)) return p;
            return null;
          }
        }
      }
    } else {
      return null;
    }
  }
  midpoint(): Point {
    let x, y: number;
    if (this.slope === null) {
      x = this.xMin;
      y = (this.yMin + this.yMax) / 2;
    } else if (this.slope === 0) {
      x = (this.xMin + this.xMax) / 2;
      y = this.yMin;
    } else {
      x = (this.xMin + this.xMax) / 2;
      y = (this.yMin + this.yMax) / 2;
    }
    return new Point(x, y);
  }
  // return a segment with the terminal points reversed
  reverse(): Segment {
    return new Segment(this.b, this.a);
  }
  // convenient for debugging
  clone(): Segment {
    return new Segment(this.a.clone(), this.b.clone());
  }
  toVector(): Vector {
    return new Vector(this.a, this.b);
  }
}

enum Quadrant {
  PositiveX,
  I,
  PostiveY,
  II,
  NegativeX,
  III,
  NegativeY,
  IV,
  Null,
}

export enum Curvature {
  Left = "left",
  Colinear = "colinear",
  Right = "right",
}

export class Vector extends Segment {
  quadrant: Quadrant;
  constructor(start: Point, end: Point) {
    super(start, end);
    if (start.equals(end)) {
      this.quadrant == Quadrant.Null;
    } else {
      if (this.slope === null) {
        this.quadrant =
          start.yMin < end.yMin ? Quadrant.PostiveY : Quadrant.NegativeY;
      } else if (this.slope === 0) {
        this.quadrant =
          start.xMin < end.xMin ? Quadrant.PositiveX : Quadrant.NegativeX;
      } else {
        const positiveXDelta = start.xMin < end.xMin;
        const positiveYDelta = start.yMin < end.yMin;
        this.quadrant = positiveXDelta
          ? positiveYDelta
            ? Quadrant.I
            : Quadrant.IV
          : positiveYDelta
          ? Quadrant.II
          : Quadrant.III;
      }
    }
  }
  type() {
    return GeometryType.Vector;
  }
  describe(): string {
    return `${this.start().describe()} -> ${this.end().describe()}`;
  }
  start(): Point {
    return this.a;
  }
  end(): Point {
    return this.b;
  }
  // as you move from the start of this vector to the end of the next, which why are you rotating?
  // hopefully this is computationally cheaper than doing any trigonometry
  curvature(other: Vector): Curvature {
    if (!this.end().equals(other.start()))
      throw new Error("the other vector must begin where this one ends");
    if (this.quadrant === Quadrant.Null || other.quadrant === Quadrant.Null)
      return Curvature.Colinear;
    if (this.slope === other.slope) return Curvature.Colinear;
    switch (this.quadrant) {
      case Quadrant.PositiveX:
        switch (other.quadrant) {
          case Quadrant.PositiveX:
          case Quadrant.NegativeX:
            return Curvature.Colinear;
          case Quadrant.I:
          case Quadrant.PostiveY:
          case Quadrant.II:
            return Curvature.Left;
          default:
            return Curvature.Right;
        }
      case Quadrant.I:
        switch (other.quadrant) {
          case Quadrant.I:
            return other.slope! > this.slope!
              ? Curvature.Left
              : Curvature.Right;
          case Quadrant.PostiveY:
          case Quadrant.II:
          case Quadrant.NegativeX:
            return Curvature.Left;
          case Quadrant.III:
            return other.slope! < this.slope!
              ? Curvature.Left
              : Curvature.Right;
          default:
            return Curvature.Right;
        }
      case Quadrant.PostiveY:
        switch (other.quadrant) {
          case Quadrant.PostiveY:
          case Quadrant.NegativeY:
            return Curvature.Colinear;
          case Quadrant.II:
          case Quadrant.NegativeX:
          case Quadrant.III:
            return Curvature.Left;
          default:
            return Curvature.Right;
        }
      case Quadrant.II:
        switch (other.quadrant) {
          case Quadrant.II:
            return other.slope! > this.slope!
              ? Curvature.Left
              : Curvature.Right;
          case Quadrant.NegativeX:
          case Quadrant.III:
          case Quadrant.NegativeY:
            return Curvature.Left;
          case Quadrant.IV:
            return other.slope! < this.slope!
              ? Curvature.Left
              : Curvature.Right;
          default:
            return Curvature.Right;
        }
      case Quadrant.NegativeX:
        switch (other.quadrant) {
          case Quadrant.PositiveX:
          case Quadrant.NegativeX:
            return Curvature.Colinear;
          case Quadrant.I:
          case Quadrant.PostiveY:
          case Quadrant.II:
            return Curvature.Right;
          default:
            return Curvature.Left;
        }
      case Quadrant.III:
        switch (other.quadrant) {
          case Quadrant.III:
            return other.slope! > this.slope!
              ? Curvature.Left
              : Curvature.Right;
          case Quadrant.NegativeY:
          case Quadrant.IV:
          case Quadrant.PositiveX:
            return Curvature.Left;
          case Quadrant.I:
            return other.slope! < this.slope!
              ? Curvature.Left
              : Curvature.Right;
          default:
            return Curvature.Right;
        }
      case Quadrant.NegativeY:
        switch (other.quadrant) {
          case Quadrant.PostiveY:
          case Quadrant.NegativeY:
            return Curvature.Colinear;
          case Quadrant.II:
          case Quadrant.NegativeX:
          case Quadrant.III:
            return Curvature.Right;
          default:
            return Curvature.Left;
        }
      case Quadrant.IV:
        switch (other.quadrant) {
          case Quadrant.IV:
            return other.slope! > this.slope!
              ? Curvature.Left
              : Curvature.Right;
          case Quadrant.PositiveX:
          case Quadrant.I:
          case Quadrant.PostiveY:
            return Curvature.Left;
          case Quadrant.II:
            return other.slope! < this.slope!
              ? Curvature.Left
              : Curvature.Right;
          default:
            return Curvature.Right;
        }
    }
  }
}

export class Triangle extends Geometry {
  a: Point;
  b: Point;
  c: Point;
  ab: Segment;
  ac: Segment;
  bc: Segment;
  area: number;
  centroid: Point;
  contains: (p: Point) => boolean;
  constructor(a: Point, b: Point, c: Point) {
    super();
    this.a = a;
    this.b = b;
    this.c = c;
    this.ab = new Segment(a, b);
    this.ac = new Segment(a, c);
    if (this.ab.slope === this.ac.slope)
      throw new Error("points a, b, and c are colinear");
    this.bc = new Segment(b, c);
    this.xMin =
      a.xMin < b.xMin
        ? a.xMin < c.xMin
          ? a.xMin
          : c.xMin
        : b.xMin < c.xMin
        ? b.xMin
        : c.xMin;
    this.xMax =
      a.xMax > b.xMax
        ? a.xMax > c.xMax
          ? a.xMax
          : c.xMax
        : b.xMax > c.xMax
        ? b.xMax
        : c.xMax;
    this.yMin =
      a.yMin < b.yMin
        ? a.yMin < c.yMin
          ? a.yMin
          : c.yMin
        : b.yMin < c.yMin
        ? b.yMin
        : c.yMin;
    this.yMax =
      a.yMax > b.yMax
        ? a.yMax > c.yMax
          ? a.yMax
          : c.yMax
        : b.yMax > c.yMax
        ? b.yMax
        : c.yMax;
    const semiperimeter =
      (this.ab.length + this.ac.length + this.bc.length) / 2;
    // Heron's formula
    this.area = Math.sqrt(
      semiperimeter *
        (semiperimeter - this.ab.length) *
        (semiperimeter - this.ac.length) *
        (semiperimeter - this.bc.length)
    );
    const midlineAB = new Segment(c, this.ab.midpoint());
    const midlineAC = new Segment(b, this.ac.midpoint());
    this.centroid = midlineAB.intersection(midlineAC) as Point;
    // compile a function that returns whether a point falls within this triangle
    const makeInequality = (
      s: Segment,
      p: Point
    ): ((x: number, y: number) => boolean) => {
      if (s.slope === null) {
        const threshold = s.a.x();
        if (p.x() < threshold) return (x: number, _y: number) => x <= threshold;
        return (x: number, _y: number) => x >= threshold;
      }
      if (s.slope === 0) {
        const threshold = s.a.y();
        if (p.y() < threshold) return (_x: number, y: number) => y <= threshold;
        return (_x: number, y: number) => y >= threshold;
      }
      const m = s.slope,
        b = s.intercept!;
      const yForX = (x: number) => m * x + b;
      if (yForX(p.x()) < p.y()) return (x: number, y: number) => yForX(x) <= y;
      return (x: number, y: number) => yForX(x) >= y;
    };
    const inequalityAB = makeInequality(this.ab, this.c);
    const inequalityAC = makeInequality(this.ac, this.b);
    const inequalityBC = makeInequality(this.bc, this.a);
    this.contains = (p: Point) => {
      if (!this.maybeOverlaps(p)) return false;

      const x = p.x(),
        y = p.y();
      return inequalityAB(x, y) && inequalityAC(x, y) && inequalityBC(x, y);
    };
  }
  type() {
    return GeometryType.Triangle;
  }
  describe(): string {
    return `△(${this.a.describe()}, ${this.b.describe()}, ${this.c.describe()})`;
  }
  // a convience method for testing
  clone(): Triangle {
    return new Triangle(this.a.clone(), this.b.clone(), this.c.clone());
  }
}
export type Centroid = [center: Point, weight: number];
// given two centriods -- two weighted points -- find the segment connecting
// them and their join centroid
export const centroid = (c1: Centroid, c2: Centroid): [Segment, Centroid] => {
  const [p1, w1] = c1;
  const [p2, w2] = c2;
  const s = new Segment(p1, p2);
  const d = w1 + w2; // d for "denominator"
  // now we find a point that divides this segment into two sub-segments, such that the
  // weight to the one side of the point times the length of that sub-segment equals the
  // weight to the other side times the length of the other sub-segment
  const m = s.slope;
  if (m === null) {
    // vertical
    const y = p1.y() + ((p2.y() - p1.y()) * w2) / d;
    const p3 = new Point(p1.x(), y);
    return [s, [p3, d]];
  } else if (m === 0) {
    // horizontal
    const x = p1.x() + ((p2.x() - p1.x()) * w2) / d;
    const p3 = new Point(x, p1.y());
    return [s, [p3, d]];
  } else {
    // diagonal
    const x3 = (w1 * p1.x() + w2 * p2.x()) / d;
    const y3 = (w1 * p1.y() + w2 * p2.y()) / d;
    const p3 = new Point(x3, y3);
    return [s, [p3, d]];
  }
};

// given a perimeter, determine whether in making a full circuit one curves to the left, counterclockwise,
// or to the right, clockwise
// this is useful for finding concavities in a perimeter
export const determineConvexDirection = (
  perimeter: Segment[]
): Curvature.Left | Curvature.Right => {
  let optima: [Segment, number][] = [];
  perimeter
    .map((s, i) => [s, i] as [Segment, number])
    .forEach((pair) => {
      if (optima.length) {
        const x = optima[0][0].xMin;
        if (x > pair[0].xMin) {
          optima.length = 0;
          optima.push(pair);
        } else if (x === pair[0].xMin) {
          optima.push(pair);
        }
      } else {
        optima.push(pair);
      }
    });
  // there should be at least two optima, since the segments should share points
  optima = optima.sort(([_a, ia], [_b, ib]) => ia - ib);
  const j = optima.length - 1;
  if (optima[j][1] === perimeter.length - 1 && optima[0][1] === 0) {
    // rearrange things so that connected segments are all together
    let k = j;
    while (k > 0) {
      if (optima[k - 1][1] !== optima[k][1]) break;
      k--;
    }
    const thingsToMove = optima.slice(k, optima.length);
    optima.splice(j, thingsToMove.length);
    optima.splice(0, 0, ...thingsToMove);
  }
  for (let i = 0; i < optima.length - 1; i++) {
    const v1 = optima[i][0].toVector();
    const v2 = optima[i + 1][0].toVector();
    const c = v1.curvature(v2);
    if (c !== Curvature.Colinear) return c;
  }
  throw "we should never get here";
};
export const findCrossings = (segments: Segment[]): Set<Segment> => {
  const crossed = new Set<Segment>();
  const last = segments.length - 1;
  for (let i = 0; i < last; i++) {
    const s1 = segments[i];
    for (let j = i + 1; j < segments.length; j++) {
      if (i === 0 && j === last) continue;

      const s2 = segments[j];
      if (
        s1.a.equals(s2.a) ||
        s1.a.equals(s2.b) ||
        s1.b.equals(s2.a) ||
        s1.b.equals(s2.b)
      )
        continue;
      const p = s1.intersection(s2);
      const debug = () => {
        console.log({
          i,
          j,
          s1: s1.describe(),
          s2: s2.describe(),
          p: p!.describe(),
        });
      };
      if (p) {
        if (j === i + 1 || (i === 0 && j === last)) {
          // adjacent segments will always have a point in common
          // there is only a problem if they have a segment in common
          if (p.type() === GeometryType.Segment) {
            debug();
            crossed.add(s1);
            crossed.add(s2);
          }
        } else {
          debug();
          crossed.add(s1);
          crossed.add(s2);
        }
      }
    }
  }
  return crossed;
};
