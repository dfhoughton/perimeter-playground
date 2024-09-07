(() => {
  // src/geometry.ts
  var Geometry = class {
    xMin;
    xMax;
    yMin;
    yMax;
    type() {
      throw new Error("subclasses of Geometry must implement a type method");
    }
    // returns whether the smallest box holding this geometry overlaps the smallest box holding the other geometry
    maybeOverlaps(other) {
      return !(this.xMax < other.xMin || other.xMax < this.xMin) && // there is some x overlap
      !(this.yMax < other.yMin || other.yMax < this.yMin);
    }
    // return some simple, human-readable stringification of the geometry
    describe() {
      throw new Error("subclasses of Geometry must implement a describe method");
    }
  };
  var Point = class _Point extends Geometry {
    constructor(x, y) {
      super();
      this.xMin = this.xMax = x;
      this.yMin = this.yMax = y;
    }
    type() {
      return 0 /* Point */;
    }
    x() {
      return this.xMin;
    }
    y() {
      return this.yMin;
    }
    equals(other) {
      return this.xMin === other.xMin && this.yMin === other.yMin;
    }
    distanceFrom(other) {
      return Math.sqrt((this.x() - other.x()) ** 2 + (this.y() - other.y()) ** 2);
    }
    describe() {
      return `(${this.xMin}, ${this.yMin})`;
    }
    // a convenience method for testing
    clone() {
      return new _Point(this.xMin, this.yMin);
    }
  };
  var Circle = class extends Geometry {
    center;
    radius;
    constructor(center, radius) {
      super();
      this.center = center;
      this.radius = radius;
      this.xMin = center.xMin - radius;
      this.xMax = center.xMax + radius;
      this.yMin = center.yMin - radius;
      this.yMax = center.yMax + radius;
    }
    type() {
      return 4 /* Circle */;
    }
  };
  var Segment = class _Segment extends Geometry {
    a;
    b;
    length;
    slope;
    intercept;
    constructor(a, b) {
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
          let start, end;
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
      return 1 /* Segment */;
    }
    describe() {
      return `${this.a.describe()} - ${this.b.describe()}`;
    }
    // the second, optional parameter is a workaround for floating point issues
    intersection(other, trustMe = false) {
      if (this.maybeOverlaps(other)) {
        if (this.slope === other.slope) {
          if (this.intercept === other.intercept) {
            if (this.slope === null) {
              const min = this.yMin < other.yMin ? other.yMin : this.yMin;
              const max = this.yMax < other.yMax ? this.yMax : other.yMax;
              if (min === max) return new Point(this.xMin, min);
              return new _Segment(
                new Point(this.xMin, min),
                new Point(this.xMin, max)
              );
            } else if (this.slope === 0) {
              const min = this.xMin < other.xMin ? other.xMin : this.xMin;
              const max = this.xMax < other.xMax ? this.xMax : other.xMax;
              if (min === max) return new Point(min, this.yMin);
              return new _Segment(
                new Point(min, this.yMin),
                new Point(max, this.yMin)
              );
            } else {
              const min = this.xMin < other.xMin ? other.xMin : this.xMin;
              const max = this.xMax < other.xMax ? this.xMax : other.xMax;
              return new _Segment(
                new Point(min, this.slope * min + this.intercept),
                new Point(max, this.slope * max + this.intercept)
              );
            }
          } else {
            return null;
          }
        } else {
          if (this.slope === null) {
            if (other.slope === 0) {
              return new Point(this.xMin, other.yMin);
            } else {
              const y = other.slope * this.xMin + other.intercept;
              if (y >= this.yMin && y <= this.yMax) {
                return new Point(this.xMin, y);
              } else {
                return null;
              }
            }
          } else if (this.slope === 0) {
            if (other.slope === null) {
              return new Point(other.xMin, this.yMin);
            } else {
              const x = (this.yMin - other.intercept) / other.slope;
              if (x >= this.xMin && x <= this.xMax && x >= other.xMin && x <= other.xMax) {
                return new Point(x, this.yMin);
              } else {
                return null;
              }
            }
          } else {
            if (other.slope === null) {
              const y = this.slope * other.xMin + this.intercept;
              if (y >= this.yMin && y <= this.yMax && y >= other.yMin && y <= other.yMax) {
                return new Point(other.xMin, y);
              } else {
                return null;
              }
            } else if (other.slope === 0) {
              const x = (other.yMin - this.intercept) / this.slope;
              if (x >= other.xMin && x <= other.xMax && x >= this.xMin && x <= this.xMax) {
                return new Point(x, other.yMin);
              } else {
                return null;
              }
            } else {
              const x = (this.intercept - other.intercept) / (other.slope - this.slope);
              const y = this.slope * x + this.intercept;
              const p = new Point(x, y);
              if (trustMe || this.maybeOverlaps(p) && other.maybeOverlaps(p))
                return p;
              return null;
            }
          }
        }
      } else {
        return null;
      }
    }
    midpoint() {
      let x, y;
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
    reverse() {
      return new _Segment(this.b, this.a);
    }
    // convenient for debugging
    clone() {
      return new _Segment(this.a.clone(), this.b.clone());
    }
    toVector() {
      return new Vector(this.a, this.b);
    }
  };
  var Vector = class extends Segment {
    quadrant;
    constructor(start, end) {
      super(start, end);
      if (start.equals(end)) {
        this.quadrant == 8 /* Null */;
      } else {
        if (this.slope === null) {
          this.quadrant = start.yMin < end.yMin ? 2 /* PostiveY */ : 6 /* NegativeY */;
        } else if (this.slope === 0) {
          this.quadrant = start.xMin < end.xMin ? 0 /* PositiveX */ : 4 /* NegativeX */;
        } else {
          const positiveXDelta = start.xMin < end.xMin;
          const positiveYDelta = start.yMin < end.yMin;
          this.quadrant = positiveXDelta ? positiveYDelta ? 1 /* I */ : 7 /* IV */ : positiveYDelta ? 3 /* II */ : 5 /* III */;
        }
      }
    }
    type() {
      return 2 /* Vector */;
    }
    describe() {
      return `${this.start().describe()} -> ${this.end().describe()}`;
    }
    start() {
      return this.a;
    }
    end() {
      return this.b;
    }
    // as you move from the start of this vector to the end of the next, which way are you rotating?
    // hopefully this is computationally cheaper than doing any trigonometry
    curvature(other) {
      if (!this.end().equals(other.start()))
        throw new Error("the other vector must begin where this one ends");
      if (this.quadrant === 8 /* Null */ || other.quadrant === 8 /* Null */)
        return "colinear" /* Colinear */;
      if (this.slope === other.slope) return "colinear" /* Colinear */;
      switch (this.quadrant) {
        case 1 /* I */:
          switch (other.quadrant) {
            case 3 /* II */:
            case 2 /* PostiveY */:
            case 4 /* NegativeX */:
              return "left" /* Left */;
            case 1 /* I */:
              return other.slope > this.slope ? "left" /* Left */ : "right" /* Right */;
            case 5 /* III */:
              return other.slope < this.slope ? "left" /* Left */ : "right" /* Right */;
            default:
              return "right" /* Right */;
          }
        case 3 /* II */:
          switch (other.quadrant) {
            case 5 /* III */:
            case 4 /* NegativeX */:
            case 6 /* NegativeY */:
              return "left" /* Left */;
            case 3 /* II */:
              return other.slope > this.slope ? "left" /* Left */ : "right" /* Right */;
            case 7 /* IV */:
              return other.slope < this.slope ? "left" /* Left */ : "right" /* Right */;
            default:
              return "right" /* Right */;
          }
        case 5 /* III */:
          switch (other.quadrant) {
            case 7 /* IV */:
            case 6 /* NegativeY */:
            case 0 /* PositiveX */:
              return "left" /* Left */;
            case 5 /* III */:
              return other.slope > this.slope ? "left" /* Left */ : "right" /* Right */;
            case 1 /* I */:
              return other.slope < this.slope ? "left" /* Left */ : "right" /* Right */;
            default:
              return "right" /* Right */;
          }
        case 7 /* IV */:
          switch (other.quadrant) {
            case 1 /* I */:
            case 0 /* PositiveX */:
            case 2 /* PostiveY */:
              return "left" /* Left */;
            case 3 /* II */:
              return other.slope < this.slope ? "left" /* Left */ : "right" /* Right */;
            case 7 /* IV */:
              return other.slope > this.slope ? "left" /* Left */ : "right" /* Right */;
            default:
              return "right" /* Right */;
          }
        case 0 /* PositiveX */:
          switch (other.quadrant) {
            case 1 /* I */:
            case 3 /* II */:
            case 2 /* PostiveY */:
              return "left" /* Left */;
            case 0 /* PositiveX */:
            case 4 /* NegativeX */:
              return "colinear" /* Colinear */;
            default:
              return "right" /* Right */;
          }
        case 2 /* PostiveY */:
          switch (other.quadrant) {
            case 3 /* II */:
            case 5 /* III */:
            case 4 /* NegativeX */:
              return "left" /* Left */;
            case 2 /* PostiveY */:
            case 6 /* NegativeY */:
              return "colinear" /* Colinear */;
            default:
              return "right" /* Right */;
          }
        case 4 /* NegativeX */:
          switch (other.quadrant) {
            case 1 /* I */:
            case 3 /* II */:
            case 2 /* PostiveY */:
              return "right" /* Right */;
            case 0 /* PositiveX */:
            case 4 /* NegativeX */:
              return "colinear" /* Colinear */;
            default:
              return "left" /* Left */;
          }
        case 6 /* NegativeY */:
          switch (other.quadrant) {
            case 3 /* II */:
            case 5 /* III */:
            case 4 /* NegativeX */:
              return "right" /* Right */;
            case 2 /* PostiveY */:
            case 6 /* NegativeY */:
              return "colinear" /* Colinear */;
            default:
              return "left" /* Left */;
          }
      }
    }
  };
  var Triangle = class _Triangle extends Geometry {
    a;
    b;
    c;
    ab;
    ac;
    bc;
    area;
    centroid;
    contains;
    constructor(a, b, c) {
      super();
      this.a = a;
      this.b = b;
      this.c = c;
      this.ab = new Segment(a, b);
      this.ac = new Segment(a, c);
      if (this.ab.slope === this.ac.slope)
        throw new Error("points a, b, and c are colinear");
      this.bc = new Segment(b, c);
      this.xMin = a.xMin < b.xMin ? a.xMin < c.xMin ? a.xMin : c.xMin : b.xMin < c.xMin ? b.xMin : c.xMin;
      this.xMax = a.xMax > b.xMax ? a.xMax > c.xMax ? a.xMax : c.xMax : b.xMax > c.xMax ? b.xMax : c.xMax;
      this.yMin = a.yMin < b.yMin ? a.yMin < c.yMin ? a.yMin : c.yMin : b.yMin < c.yMin ? b.yMin : c.yMin;
      this.yMax = a.yMax > b.yMax ? a.yMax > c.yMax ? a.yMax : c.yMax : b.yMax > c.yMax ? b.yMax : c.yMax;
      const semiperimeter = (this.ab.length + this.ac.length + this.bc.length) / 2;
      this.area = Math.sqrt(
        semiperimeter * (semiperimeter - this.ab.length) * (semiperimeter - this.ac.length) * (semiperimeter - this.bc.length)
      );
      const midlineAB = new Segment(c, this.ab.midpoint());
      const midlineAC = new Segment(b, this.ac.midpoint());
      this.centroid = midlineAB.intersection(midlineAC, true);
      const makeInequality = (s, p) => {
        if (s.slope === null) {
          const threshold = s.a.x();
          if (p.x() < threshold) return (x, _y) => x <= threshold;
          return (x, _y) => x >= threshold;
        }
        if (s.slope === 0) {
          const threshold = s.a.y();
          if (p.y() < threshold) return (_x, y) => y <= threshold;
          return (_x, y) => y >= threshold;
        }
        const m = s.slope, b2 = s.intercept;
        const yForX = (x) => m * x + b2;
        if (yForX(p.x()) < p.y()) return (x, y) => yForX(x) <= y;
        return (x, y) => yForX(x) >= y;
      };
      const inequalityAB = makeInequality(this.ab, this.c);
      const inequalityAC = makeInequality(this.ac, this.b);
      const inequalityBC = makeInequality(this.bc, this.a);
      this.contains = (p) => {
        if (!this.maybeOverlaps(p)) return false;
        const x = p.x(), y = p.y();
        return inequalityAB(x, y) && inequalityAC(x, y) && inequalityBC(x, y);
      };
    }
    type() {
      return 3 /* Triangle */;
    }
    describe() {
      return `\u25B3(${this.a.describe()}, ${this.b.describe()}, ${this.c.describe()})`;
    }
    // a convenience method for testing
    clone() {
      return new _Triangle(this.a.clone(), this.b.clone(), this.c.clone());
    }
  };
  var centroid = (c1, c2) => {
    const [p1, w1] = c1;
    const [p2, w2] = c2;
    const s = new Segment(p1, p2);
    const d = w1 + w2;
    const m = s.slope;
    if (m === null) {
      const y = p1.y() + (p2.y() - p1.y()) * w2 / d;
      const p3 = new Point(p1.x(), y);
      return [s, [p3, d]];
    } else if (m === 0) {
      const x = p1.x() + (p2.x() - p1.x()) * w2 / d;
      const p3 = new Point(x, p1.y());
      return [s, [p3, d]];
    } else {
      const x3 = (w1 * p1.x() + w2 * p2.x()) / d;
      const y3 = (w1 * p1.y() + w2 * p2.y()) / d;
      const p3 = new Point(x3, y3);
      return [s, [p3, d]];
    }
  };
  var determineConvexDirection = (perimeter) => {
    let optima = [];
    perimeter.map((s, i) => [s, i]).forEach((pair) => {
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
    optima = optima.sort(([_a, ia], [_b, ib]) => ia - ib);
    const j = optima.length - 1;
    if (optima[j][1] === perimeter.length - 1 && optima[0][1] === 0) {
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
      if (c !== "colinear" /* Colinear */) return c;
    }
    throw "we should never get here";
  };
  var findCrossings = (segments) => {
    const crossed = /* @__PURE__ */ new Set();
    const last = segments.length - 1;
    for (let i = 0; i < last; i++) {
      const s1 = segments[i];
      for (let j = i + 1; j < segments.length; j++) {
        if (i === 0 && j === last) continue;
        const s2 = segments[j];
        if (s1.a.equals(s2.a) || s1.a.equals(s2.b) || s1.b.equals(s2.a) || s1.b.equals(s2.b))
          continue;
        const p = s1.intersection(s2);
        const debug = () => {
          console.log({
            i,
            j,
            s1: s1.describe(),
            s2: s2.describe(),
            p: p.describe()
          });
        };
        if (p) {
          if (j === i + 1 || i === 0 && j === last) {
            if (p.type() === 1 /* Segment */) {
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

  // src/GraphicalTutor.ts
  var defaultOptions = {
    delay: 0,
    color: "black",
    fill: "transparent",
    erasure: "#ddd",
    axisColor: "#eee",
    scale: 10,
    dotRadius: 0.2,
    axes: true
  };
  var GraphicalTutor = class {
    context;
    options;
    interval;
    current;
    startState;
    pending;
    going;
    onFinished;
    constructor(canvas, options = {}) {
      this.context = canvas.getContext("2d");
      this.options = this.setDefaultOptions(options, canvas);
      this.current = [];
      this.pending = [];
      this.startState = [];
      this.going = false;
      this.interval = null;
      this.onFinished = [];
      this.reset();
    }
    // have we not yet recorded a run?
    fresh() {
      return this.startState.length === 0;
    }
    incomplete() {
      return this.pending.length > 0;
    }
    paused() {
      return !this.going && this.incomplete();
    }
    // restore things to their condition before the last time we "went"
    rollback() {
      if (this.startState.length) {
        this.current = [...this.startState];
        this.pending.length = 0;
      }
    }
    // enqueue something for the current frame
    enqueue(assemblage, options = {}) {
      let { color, after } = options;
      color = options.color ?? this.options.color;
      this.current.push([assemblage, { color, after }]);
    }
    // add an assemblage to be drawn after a delay
    addFrame(assemblage, options = {}) {
      let { delay, color, after, once } = options;
      delay ??= this.options.delay;
      color ??= this.options.color;
      let frame = this.incomplete() ? this.pending[this.pending.length - 1][0] : this.current;
      frame = frame.filter((item) => !item[1].once);
      frame.push([assemblage, { color, after, once }]);
      this.pending.push([frame, delay]);
    }
    recordStartState() {
      if (this.startState.length === 0) this.startState = [...this.current];
    }
    go(onFinished) {
      if (onFinished) {
        this.onFinished.push(() => {
          onFinished();
          this.onFinished = this.onFinished.splice(this.onFinished.length - 1);
        });
      }
      this.going = true;
      this.step();
    }
    stop() {
      if (this.going) {
        this.clearInterval();
        this.going = false;
      }
    }
    clearInterval() {
      if (this.interval != null) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }
    // convert a point on the canvas to a point in the cartesian coordinate system
    cartesian(x, y) {
      x -= this.options.width / 2;
      x /= this.options.scale;
      y -= this.options.height / 2;
      y /= this.options.scale;
      return [x, -y];
    }
    reset() {
      this.context.reset();
      this.drawAxes();
    }
    clear() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      this.pending = [];
      this.current = [];
      this.startState = [];
      this.reset();
    }
    drawAll() {
      this.reset();
      for (const [assemblage, opts] of this.current) {
        this.drawAssemblage(assemblage, opts.color, opts.after);
      }
    }
    drawAxes() {
      if (this.options.axes) {
        const midX = this.options.width / 2;
        const midY = this.options.height / 2;
        const ctx = this.context;
        ctx.strokeStyle = this.options.axisColor;
        ctx.beginPath();
        ctx.moveTo(midX, 0);
        ctx.lineTo(midX, this.options.height);
        ctx.moveTo(0, midY);
        ctx.lineTo(this.options.width, midY);
        ctx.closePath();
        ctx.stroke();
      }
    }
    setDefaultOptions(options, canvas) {
      for (const [k, v] of Object.entries(defaultOptions)) {
        options[k] ??= v;
      }
      const definedOptions = options;
      definedOptions.width = canvas.width;
      definedOptions.height = canvas.height;
      return definedOptions;
    }
    // translate the point from a cartesian coordinate system with the center at the center of the
    // canvas to the canvas coordinate system
    translate(p) {
      let x = p.x();
      let y = p.y();
      x *= this.options.scale;
      y *= -this.options.scale;
      x += this.options.width / 2;
      y += this.options.height / 2;
      return [x, y];
    }
    step() {
      if (!this.going) return;
      this.drawAll();
      if (this.incomplete()) {
        const [frame, delay] = this.pending.shift();
        this.current = frame;
        this.interval = setTimeout(this.step.bind(this), typeof delay === "number" ? delay : delay());
      } else {
        this.clearInterval();
        this.going = false;
      }
    }
    maybeFinish() {
      if (!this.incomplete()) this.onFinished.forEach((f) => f());
    }
    drawAssemblage(assemblage, color, after) {
      for (const item of assemblage) {
        this.drawItem(item, color);
      }
      if (after) after();
      this.maybeFinish();
    }
    // for debugging
    highlight(item, color) {
      this.drawItem(item, color);
    }
    drawItem(item, color) {
      if (!item) return;
      switch (item.type()) {
        case 0 /* Point */:
          this.drawPoint(item, color);
          break;
        case 1 /* Segment */:
          this.drawSegment(item, color);
          break;
        case 4 /* Circle */:
          this.drawCircle(item, color);
          break;
        case 3 /* Triangle */:
          this.drawTriangle(item, color);
          break;
        default:
          throw "unhandled geometry type";
      }
    }
    drawPoint(p, color) {
      this.drawCircle(
        new Circle(p, this.options.dotRadius),
        color,
        this.options.color
      );
    }
    drawSegment(s, color) {
      const [[sx, sy], [ex, ey]] = [s.a, s.b].map((p) => this.translate(p));
      const ctx = this.context;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.closePath();
      ctx.stroke();
    }
    drawCircle(c, color, fill) {
      const [x, y] = this.translate(c.center);
      const radius = c.radius * this.options.scale;
      const ctx = this.context;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.moveTo(x, y);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.stroke();
    }
    drawTriangle(t, color) {
      const [[ax, ay], [bx, by], [cx, cy]] = [t.a, t.b, t.c].map(
        (p) => this.translate(p)
      );
      const ctx = this.context;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.stroke();
    }
  };

  // src/main.ts
  function notePoint(x, y) {
    const pts = document.getElementById("points");
    const container = document.createElement("div");
    const contents = document.createTextNode(`(${x}, ${y})`);
    container.appendChild(contents);
    pts.appendChild(container);
  }
  var points = [];
  function main() {
    const canvas = document.getElementById("rodeo");
    const delaySlider = document.getElementById("delay");
    let delay = Number.parseFloat(delaySlider.value) * 1e3;
    delaySlider.onchange = (e) => {
      delay = Number.parseFloat(e.target.value) * 1e3;
    };
    const tutor = new GraphicalTutor(canvas, {
      delay: () => delay,
      scale: 10,
      color: "crimson"
    });
    const clear = () => {
      points.length = 0;
      document.getElementById("points").innerHTML = "";
      document.getElementById("events").innerHTML = "";
      tutor.clear();
    };
    document.getElementById("clear").onclick = clear;
    const event = (message, header) => {
      const events = document.getElementById("events");
      if (header) {
        const container2 = document.createElement("h4");
        const contents = document.createTextNode(header);
        container2.appendChild(contents);
        events.appendChild(container2);
      }
      const container = document.createElement("div");
      container.appendChild(document.createTextNode(message));
      events.appendChild(container);
    };
    const addPoint = (point) => {
      let lastPoint = null;
      if (points.length) lastPoint = points[points.length - 1];
      const [x, y] = point;
      if (lastPoint && x === lastPoint[0] && y === lastPoint[1]) return;
      notePoint(x, y);
      points.push(point);
      const newPoint = new Point(x, y);
      const assemblage = [];
      if (lastPoint) {
        const [ox, oy] = lastPoint;
        const segment = new Segment(new Point(ox, oy), newPoint);
        assemblage.push(segment);
      }
      assemblage.push(newPoint);
      tutor.enqueue(assemblage, { color: "green" });
      tutor.drawAll();
    };
    canvas.onclick = (e) => {
      const point = tutor.cartesian(e.offsetX, e.offsetY);
      if (tutor.fresh()) {
        addPoint(point);
      } else {
        showWhereIClickedAndTheNearestPointOnThePerimeter(point);
      }
    };
    const showWhereIClickedAndTheNearestPointOnThePerimeter = (point) => {
      let nearest = points[0];
      let d = Number.MAX_VALUE;
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const d2 = (point[0] - p[0]) ** 2 + (point[1] - p[1]) ** 2;
        if (d2 < d) {
          nearest = p;
          d = d2;
        }
      }
      const r = ([x, y]) => `(${x}, ${y})`;
      console.log({ clicked: r(point), nearest: r(nearest) });
    };
    const load = document.getElementById("load-data");
    const loadButton = document.getElementById("load");
    const pointMatcher = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
    load.onkeyup = (_e) => {
      const pointsPresent = !!load.value.matchAll(pointMatcher).next().value;
      if (loadButton.disabled === pointsPresent) {
        loadButton.disabled = !pointsPresent;
      }
    };
    loadButton.onclick = (_e) => {
      clear();
      for (const m of load.value.matchAll(pointMatcher)) {
        addPoint([Number.parseFloat(m[1]), Number.parseFloat(m[2])]);
      }
    };
    const describeAlgorithmStep = (step) => {
      tutor.addFrame([], { after: () => event("", `\u2767 ${step}`), once: true });
    };
    document.getElementById("go").onclick = () => {
      const c = document.getElementById("go");
      document.getElementById("events").innerHTML = "";
      if (c.innerHTML === "go") {
        if (tutor.fresh() && points.length > 1) {
          tutor.recordStartState();
        } else {
          tutor.rollback();
        }
        const [x1, y1] = points[points.length - 1];
        const p1 = new Point(x1, y1);
        const [x2, y2] = points[0];
        const p2 = new Point(x2, y2);
        tutor.enqueue([new Segment(p1, p2)], { color: "green" });
        tutor.drawAll();
        describeAlgorithmStep("Removing Colinear Points");
        removeColinearities();
        describeAlgorithmStep("Looking For Crossed Segments");
        if (screenForCrossings()) {
          const segments = findAllSegments();
          describeAlgorithmStep("Dividing Enclosed Area into Convex Shapes");
          const convexities = findConvexities(segments);
          tutor.addFrame([], {
            once: true,
            after: () => event(`convexities: ${convexities.length}`)
          });
          describeAlgorithmStep("Finding The Centroids of Interior Triangles");
          const centroids = findCentroids(convexities);
          describeAlgorithmStep("Coalescing Centroids");
          coalesceCentroids(centroids);
          event(`frames: ${tutor.pending.length.toLocaleString()}`);
          c.innerHTML = "stop";
          tutor.go(() => {
            c.innerHTML = "go";
          });
        }
      } else {
        tutor.stop();
        c.innerHTML = "go";
      }
    };
    const removeColinearities = () => {
      const removedPoints = [];
      for (let i = 0, j = 1; i < tutor.current.length; i++, j++) {
        while (tutor.current[i][0][0].type() !== 1 /* Segment */ && i < tutor.current.length) {
          i += 1;
          j += 1;
        }
        if (i === tutor.current.length) break;
        const s1 = tutor.current[i][0][0];
        const v1 = s1.toVector();
        if (j === tutor.current.length) j = 0;
        while (tutor.current[j][0][0].type() !== 1 /* Segment */ && j < i)
          j++;
        if (j === i) break;
        const s2 = tutor.current[j][0][0];
        const v2 = s2.toVector();
        if (v1.curvature(v2) !== "colinear" /* Colinear */) continue;
        const opts = tutor.current[i][1];
        const s = new Segment(v1.start(), v2.end());
        const p = tutor.current[j][0].at(-1);
        const replacement = [[s, p], opts];
        for (let k = i; ; ) {
          const ass = tutor.current[k][0];
          for (const g of ass) {
            if (g.type() === 0 /* Point */) removedPoints.push(g);
          }
          k++;
          if (k === tutor.current.length) k = 0;
          if (k === j) break;
        }
        if (j < i) {
          tutor.current.splice(i, tutor.current.length - i, replacement);
          tutor.current.splice(0, j + 1);
        } else {
          tutor.current.splice(i, j - i + 1, replacement);
        }
        i--;
        j--;
      }
      if (removedPoints.length) {
        tutor.addFrame([], {
          once: true,
          after: () => {
            event("colinear points removed");
            for (const p of removedPoints) {
              event(p.describe());
            }
          }
        });
        document.getElementById("points").innerHTML = "";
        for (const [ass, _] of tutor.current) {
          for (const g of ass) {
            if (g.type() === 0 /* Point */) notePoint(g.xMin, g.yMin);
          }
        }
      }
    };
    const coalesceCentroids = (centroids) => {
      while (centroids.length > 1) {
        const [c1, c2, ...rest] = centroids;
        if (c1[1] === 0 || c2[1] === 0) {
          if (c1[1] === 0 && c2[1] === 0) continue;
          if (c1[1] === 0) {
            centroids = [c2, ...rest];
          } else {
            centroids = [c1, ...rest];
          }
          continue;
        }
        centroids = rest;
        const [s, c] = centroid(c1, c2);
        const [p2, _] = c;
        tutor.addFrame([s, p2], { color: "gray" });
        centroids.push(c);
      }
      const [p, w] = centroids[0];
      tutor.addFrame([new Circle(p, 1)], { color: "red" });
      tutor.addFrame([new Circle(p, 0.5)], { color: "white" });
      tutor.addFrame([p], {
        color: "blue",
        after: () => {
          event(p.describe(), "Centroid");
          event(`${w}`, "Area");
        }
      });
    };
    const findCentroids = (convexities) => {
      const centroids = [];
      for (const convexity of convexities) {
        const s = convexity[0];
        for (let i = 1; i < convexity.length - 1; i++) {
          const s2 = convexity[i];
          const t = new Triangle(s.a, s2.a, s2.b);
          const c = [t.centroid, t.area];
          tutor.addFrame([t], { color: "orange" });
          tutor.addFrame([t.centroid], { color: "red" });
          centroids.push(c);
        }
      }
      return centroids;
    };
    const noCrossings = (prospectiveSplittingSegment, segments) => segments.every(
      (s) => s.intersection(prospectiveSplittingSegment) === null || s.a.equals(prospectiveSplittingSegment.a) || s.a.equals(prospectiveSplittingSegment.b) || s.b.equals(prospectiveSplittingSegment.a) || s.b.equals(prospectiveSplittingSegment.b)
    );
    const prospect = (curvature, segments, s1, s2, hiving) => {
      const v1 = s1.toVector();
      const s3 = new Segment(v1.end(), s2.b);
      const v2 = s3.toVector();
      const c = v1.curvature(v2);
      const assemblage = [v1.start(), s1, v1.end(), s3, v2.end()];
      if (c === curvature && (!hiving || noCrossings(s3, segments))) {
        tutor.addFrame(assemblage, {
          color: hiving ? "green" : "orange",
          once: hiving ? false : true
        });
        return s3;
      } else {
        tutor.addFrame(assemblage, { color: "red", once: true });
        return null;
      }
    };
    const findConvexities = (segments, convexities, depth) => {
      if (!convexities) {
        convexities = [segments];
        depth = 0;
      }
      const curvature = determineConvexDirection(segments);
      if (depth > 1e3) throw "improbable level of recursion";
      if (segments.length < 3) throw "insufficient segments";
      if (segments.length === 3) return convexities;
      for (let i = 0, j = 1; i < segments.length; i++, j++) {
        if (j === segments.length) j = 0;
        const s1 = segments[i];
        let s2 = segments[j];
        let s3 = prospect(curvature, segments, s1, s2, false);
        if (s3) continue;
        const newConvexity = [s2];
        convexities.push(newConvexity);
        for (let k = j + 1, count = 0; ; k++) {
          if (k === segments.length) {
            if (count > 0)
              throw "we have hit an infinite loop while trying to hive off a concavity";
            k = 0;
            count++;
          }
          s2 = segments[k];
          newConvexity.push(s2);
          s3 = prospect(curvature, segments, s1, s2, true);
          if (s3) {
            if (k > i || j === 0) {
              segments.splice(j, newConvexity.length, s3);
            } else {
              segments.splice(j, newConvexity.length - k - 1, s3);
              segments.splice(0, k + 1);
            }
            newConvexity.push(s3.reverse());
            findConvexities(newConvexity, convexities, depth + 1);
            break;
          }
        }
      }
      return convexities;
    };
    const findAllSegments = () => tutor.current.map((pair) => pair[0].find((g) => g.type() === 1 /* Segment */)).filter((g) => g);
    const screenForCrossings = () => {
      const crossed = findCrossings(findAllSegments());
      for (const s of crossed) {
        tutor.enqueue([s], { color: "red" });
      }
      tutor.drawAll();
      if (crossed.size > 0) {
        document.getElementById("go").innerHTML = "go";
        event("There are some crossed segments", "Malformed Polygon");
        crossed.forEach((s) => event(s.describe()));
        return false;
      } else {
        return true;
      }
    };
  }
  window.onload = main;
})();
