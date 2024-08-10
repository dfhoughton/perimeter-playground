import {
  Circle,
  Geometry,
  GeometryType,
  Point,
  Segment,
  Triangle,
  Vector,
} from "./geometry";

export type GraphicalTutorOptions = {
  delay?: number | (() => number);
  color?: string;
  fill?: string;
  erasure?: string;
  scale?: number;
  dotRadius?: number;
  axes?: boolean;
  axisColor?: string;
};

type DefinedOptions = Required<GraphicalTutorOptions> & {
  width: number;
  height: number;
};

const defaultOptions: Required<GraphicalTutorOptions> = {
  delay: 0,
  color: "black",
  fill: "transparent",
  erasure: "#ddd",
  axisColor: "#eee",
  scale: 10,
  dotRadius: 0.2,
  axes: true,
};

export type DrawingOptions = {
  color: string;
  once?: boolean; // things added to the queue with this present are filtered out before the next drawing
  after?: () => void;
};

export class GraphicalTutor {
  context: CanvasRenderingContext2D;
  options: DefinedOptions;
  interval: ReturnType<typeof setTimeout> | null;
  current: [Assemblage, DrawingOptions][];
  startState: [Assemblage, DrawingOptions][];
  pending: [[Assemblage, DrawingOptions][], delay: number | (() => number)][];
  going: boolean;
  onFinished: Array<() => void>;

  constructor(canvas: HTMLCanvasElement, options: GraphicalTutorOptions = {}) {
    this.context = canvas.getContext("2d")!;
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
  enqueue(assemblage: Assemblage, options: Partial<DrawingOptions> = {}) {
    let { color, after } = options;
    color = options.color ?? (this.options.color as string);
    this.current.push([assemblage, { color, after }]);
  }

  // add an assemblage to be drawn after a delay
  addFrame(
    assemblage: Assemblage,
    options: Partial<DrawingOptions> & { delay?: number | (() => number) } = {}
  ) {
    let { delay, color, after, once } = options;
    delay ??= this.options.delay;
    color ??= this.options.color as string;
    let frame = this.incomplete()
      ? this.pending[this.pending.length - 1][0]
      : this.current;
    frame = frame.filter((item) => !item[1].once);
    frame.push([assemblage, { color, after, once }]);
    this.pending.push([frame, delay]);
  }

  recordStartState() {
    if (this.startState.length === 0) this.startState = [...this.current];
  }

  go(onFinished?: () => void) {
    if (onFinished) {
      this.onFinished.push(() => {
        // run this callback just once
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

  private clearInterval() {
    if (this.interval != null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // convert a point on the canvas to a point in the cartesian coordinate system
  cartesian(x, y): [number, number] {
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

  private drawAxes() {
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

  private setDefaultOptions(
    options: GraphicalTutorOptions,
    canvas: HTMLCanvasElement
  ): DefinedOptions {
    for (const [k, v] of Object.entries(defaultOptions)) {
      options[k] ??= v;
    }
    const definedOptions: DefinedOptions = options as DefinedOptions;
    definedOptions.width = canvas.width;
    definedOptions.height = canvas.height;
    return definedOptions;
  }

  // translate the point from a cartesian coordinate system with the center at the center of the
  // canvas to the canvas coordinate system
  private translate(p: Point) {
    let x = p.x();
    let y = p.y();
    x *= this.options.scale!;
    y *= -this.options.scale!;
    x += this.options.width! / 2;
    y += this.options.height! / 2;
    return [x, y];
  }

  private step() {
    if (!this.going) return;

    this.drawAll();
    if (this.incomplete()) {
      const [frame, delay] = this.pending.shift()!;
      this.current = frame;
      this.interval = setTimeout(this.step.bind(this), typeof delay === "number" ? delay : delay());
    } else {
      this.clearInterval();
      this.going = false;
    }
  }

  private maybeFinish() {
    if (!this.incomplete()) this.onFinished.forEach((f) => f());
  }

  private drawAssemblage(
    assemblage: Assemblage,
    color: string,
    after?: () => void
  ) {
    // this.eraseLastAssemblage();
    for (const item of assemblage) {
      this.drawItem(item, color);
    }
    if (after) after();
    this.maybeFinish();
  }

  // for debugging
  highlight(item: Geometry, color: "black") {
    this.drawItem(item, color);
  }

  private drawItem(item: Geometry, color: string) {
    switch (item.type()) {
      case GeometryType.Point:
        this.drawPoint(item as Point, color);
        break;
      case GeometryType.Segment:
        this.drawSegment(item as Segment, color);
        break;
      case GeometryType.Circle:
        this.drawCircle(item as Circle, color);
        break;
      case GeometryType.Triangle:
        this.drawTriangle(item as Triangle, color);
        break;
      default:
        throw "unhandled geometry type";
    }
  }

  private drawPoint(p: Point, color: string) {
    this.drawCircle(
      new Circle(p, this.options.dotRadius),
      color,
      this.options.color
    );
  }

  private drawSegment(s: Segment, color: string) {
    const [[sx, sy], [ex, ey]] = [s.a, s.b].map((p) => this.translate(p));
    const ctx = this.context;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.closePath();
    ctx.stroke();
  }

  private drawCircle(c: Circle, color: string, fill?: string | null) {
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

  private drawTriangle(t: Triangle, color: string) {
    const [[ax, ay], [bx, by], [cx, cy]] = [t.a, t.b, t.c].map((p) =>
      this.translate(p)
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
}

export type Assemblage = Geometry[];
