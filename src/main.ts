import { Assemblage, DrawingOptions, GraphicalTutor } from "./GraphicalTutor";
import {
  Centroid,
  Circle,
  Triangle,
  centroid,
  determineConvexDirection,
  findCrossings,
} from "./geometry";
import { Curvature, GeometryType, Point, Segment } from "./geometry";

// display some coordinates to the user
function notePoint(x: number, y: number) {
  const pts = document.getElementById("points")!;
  const container = document.createElement("div");
  const contents = document.createTextNode(`(${x}, ${y})`);
  container.appendChild(contents);
  pts.appendChild(container);
}

const points: [number, number][] = [];

function main() {
  const canvas = document.getElementById("rodeo") as HTMLCanvasElement;
  const tutor = new GraphicalTutor(canvas, {
    delay: 50,
    scale: 10,
    color: "crimson",
  });
  document.getElementById("clear")!.onclick = () => {
    points.length = 0;
    document.getElementById("points")!.innerHTML = "";
    document.getElementById("events")!.innerHTML = "";
    tutor.clear();
  };
  // record an event
  const event = (message: string, header?: string) => {
    const events = document.getElementById("events")!;
    if (header) {
      const container = document.createElement("h4");
      const contents = document.createTextNode(header);
      container.appendChild(contents);
      events.appendChild(container);
    }
    const container = document.createElement("div");
    container.appendChild(document.createTextNode(message));
    events.appendChild(container);
  };
  canvas.onclick = (e) => {
    if (!tutor.fresh()) return;

    let lastPoint: [number, number] | null = null;
    if (points.length) lastPoint = points[points.length - 1];
    const point = tutor.cartesian(e.offsetX, e.offsetY);
    const [x, y] = point;
    notePoint(x, y);
    points.push(point);
    const newPoint: Point = new Point(x, y);
    const assemblage: Assemblage = [];
    if (lastPoint) {
      const [ox, oy] = lastPoint;
      const segment: Segment = new Segment(new Point(ox, oy), newPoint);
      assemblage.push(segment);
    }
    assemblage.push(newPoint);
    tutor.enqueue(assemblage, { color: "green" });
    tutor.drawAll();
  };
  document.getElementById("go")!.onclick = () => {
    const c = document.getElementById("go")!;
    document.getElementById("events")!.innerHTML = "";
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
      removeColinearities();
      if (screenForCrossings()) {
        coalesceCentroids(findCentroids(findConvexities(findAllSegments())));
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
    const removedPoints: Point[] = [];
    for (let i = 0, j = 1; i < tutor.current.length; i++, j++) {
      while (
        tutor.current[i][0][0].type() !== GeometryType.Segment &&
        i < tutor.current.length
      ) {
        i += 1;
        j += 1;
      }
      if (i === tutor.current.length) break;
      const s1 = tutor.current[i][0][0] as Segment;
      const v1 = s1.toVector();
      if (j === tutor.current.length) j = 0;
      while (tutor.current[j][0][0].type() !== GeometryType.Segment && j < i)
        j++;
      if (j === i) break;
      const s2 = tutor.current[j][0][0] as Segment;
      const v2 = s2.toVector();
      if (v1.curvature(v2) !== Curvature.Colinear) continue;
      // we've found colinearity
      // replace the first segment with a new segment encompassing both
      // remove points and segments following this to index j
      // reset i and j lest there be more than 2 colinearities in a row
      const opts = tutor.current[i][1]; // preserve original drawing options
      const s = new Segment(v1.start(), v2.end());
      const p = tutor.current[j][0].at(-1)!; // preserve final point
      const replacement: [Assemblage, DrawingOptions] = [[s, p], opts];
      // record points that will be removed
      for (let k = i; ; ) {
        const ass = tutor.current[k][0];
        for (const g of ass) {
          if (g.type() === GeometryType.Point) removedPoints.push(g as Point);
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
      event("colinear points removed", "Removed Points");
      for (const p of removedPoints) {
        event(p.describe());
      }
      document.getElementById("points")!.innerHTML = "";
      for (const [ass, _] of tutor.current) {
        for (const g of ass) {
          if (g.type() === GeometryType.Point) notePoint(g.xMin, g.yMin);
        }
      }
    }
  };
  const coalesceCentroids = (centroids: Centroid[]) => {
    while (centroids.length > 1) {
      const [c1, c2, ...rest] = centroids;
      centroids = rest;
      const [s, c] = centroid(c1, c2);
      const [p, _] = c;
      tutor.addFrame([s, p], { color: "gray" });
      centroids.push(c);
    }
    const [p, w] = centroids[0];
    // make a sort of bullseye
    tutor.addFrame([new Circle(p, 1)], {color: 'red'})
    tutor.addFrame([new Circle(p, 0.5)], {color: 'white'})
    tutor.addFrame([p], {
      color: "blue",
      after: () => {
        event(p.describe(), "Centroid");
        event(`${w}`, "Area");
      },
    });
  };
  const findCentroids = (convexities: Segment[][]): Centroid[] => {
    const centroids: Centroid[] = [];
    for (const convexity of convexities) {
      const s = convexity[0]!;
      for (let i = 1; i < convexity.length - 1; i++) {
        const s2 = convexity[i]!;
        const t = new Triangle(s.a, s2.a, s2.b);
        const c: Centroid = [t.centroid, t.area];
        tutor.addFrame([t], { color: "orange" });
        tutor.addFrame([t.centroid], { color: "red" });
        centroids.push(c);
      }
    }
    return centroids;
  };
  const findConvexities = (
    segments: Segment[],
    convexities?: Segment[][],
    depth?: number
  ): Segment[][] => {
    if (!convexities) {
      // initialize the recursion
      convexities = [segments];
      depth = 0;
    }
    const curvature = determineConvexDirection(segments);
    if (depth! > 50) debugger;
    if (segments.length < 3) debugger;
    // do one cycle, possible recursing
    const prospect = (
      s1: Segment,
      s2: Segment,
      hiving: boolean
    ): Segment | null => {
      const v1 = s1.toVector();
      const s3 = new Segment(v1.end(), s2.b);
      const v2 = s3.toVector();
      const c = v1.curvature(v2);
      const assemblage = [v1.start(), s1, v1.end(), s3, v2.end()];
      const noCrossings = () =>
        segments.every(
          (s) =>
            s.intersection(s3) === null ||
            s.a.equals(s3.a) ||
            s.a.equals(s3.b) ||
            s.b.equals(s3.a) ||
            s.b.equals(s3.b)
        );
      if (c === curvature && noCrossings()) {
        tutor.addFrame(assemblage, {
          color: hiving ? "green" : "orange",
          once: hiving ? false : true,
        });
        return s3;
      } else {
        tutor.addFrame(assemblage, { color: "red", once: true });
        return null;
      }
    };
    for (let i = 0, j = 1; i < segments.length - 1; i++, j++) {
      if (j === segments.length) j = 0;
      const s1 = segments[i];
      let s2 = segments[j];
      let s3 = prospect(s1, s2, false);
      if (s3) continue;
      // we've found a concavity; hive it off
      const newConvexity: Segment[] = [s2];
      convexities.push(newConvexity);
      for (let k = j + 1, count = 0; ; k++) {
        if (k === segments.length) {
          if (count > 0) {
            debugger;
          }
          k = 0;
          count++;
        }
        s2 = segments[k];
        newConvexity.push(s2);
        s3 = prospect(s1, s2, true);
        if (s3) {
          // we've found the splitting segment which will hive off the concavity
          // splice the old segments and add this splitting segment to both
          if (k > i) {
            // we haven't looped. Phew!
            segments.splice(j, newConvexity.length, s3);
          } else {
            // dammit, we've looped
            segments.splice(j, segments.length - j, s3);
            segments.splice(0, k + 1);
          }
          // recurse
          newConvexity.push(s3.reverse());
          findConvexities(newConvexity, convexities, depth! + 1);
          break; // go back to the main loop;
        }
      }
    }
    return convexities;
  };
  const findAllSegments = () =>
    tutor.current
      .map((pair) => pair[0]!.find((g) => g.type() === GeometryType.Segment))
      .filter((g) => g) as Segment[];
  const screenForCrossings = () => {
    const crossed = findCrossings(findAllSegments());
    for (const s of crossed) {
      tutor.enqueue([s], { color: "red" });
    }
    tutor.drawAll();
    if (crossed.size > 0) {
      document.getElementById("go")!.innerHTML = "go";
      event("There are some crossed segments", "Malformed Polygon");
      crossed.forEach((s) => event(s.describe()));
      return false;
    } else {
      return true;
    }
  };
}

window.onload = main;
