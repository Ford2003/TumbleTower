type Polygon = Array<[number, number]>;
type Line = readonly [[number, number], [number, number]];
type Point = [number, number];

/**
 * Compute the intersection between two lines.
 * @static
 * @method lineInt
 * @param {Array} l1 Line vector 1
 * @param {Array} l2 Line vector 2
 * @param {Number} precision Precision to use when checking if the lines are parallel
 * @return {Array} The intersection point.
 */
function lineInt(l1: Line, l2: Line, precision: number = 0): Point {
  precision = precision || 0;
  const a1 = l1[1][1] - l1[0][1];
  const b1 = l1[0][0] - l1[1][0];
  const c1 = a1 * l1[0][0] + b1 * l1[0][1];
  const a2 = l2[1][1] - l2[0][1];
  const b2 = l2[0][0] - l2[1][0];
  const c2 = a2 * l2[0][0] + b2 * l2[0][1];
  const det = a1 * b2 - a2 * b1;
  if (!scalar_eq(det, 0, precision)) {
    // lines are not parallel
    return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det];
  }
  return [0, 0];
}

/**
 * Checks if two line segments intersects.
 * @method lineSegmentsIntersect
 * @param {Array} p1 The start vertex of the first line segment.
 * @param {Array} p2 The end vertex of the first line segment.
 * @param {Array} q1 The start vertex of the second line segment.
 * @param {Array} q2 The end vertex of the second line segment.
 * @return {Boolean} True if the two line segments intersect
 */
function lineSegmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const da = q2[0] - q1[0];
  const db = q2[1] - q1[1];

  // segments are parallel
  if (da * dy - db * dx === 0) {
    return false;
  }

  const s = (dx * (q1[1] - p1[1]) + dy * (p1[0] - q1[0])) / (da * dy - db * dx);
  const t = (da * (p1[1] - q1[1]) + db * (q1[0] - p1[0])) / (db * dx - da * dy);

  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

/**
 * Get the area of a triangle spanned by the three given points. Note that the area will be negative if the points are not given in counter-clockwise order.
 * @static
 * @method area
 * @param {Array} a
 * @param {Array} b
 * @param {Array} c
 * @return {Number}
 */
function triangleArea(a: Point, b: Point, c: Point): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
}

function isLeft(a: Point, b: Point, c: Point) {
  return triangleArea(a, b, c) > 0;
}

function isLeftOn(a: Point, b: Point, c: Point) {
  return triangleArea(a, b, c) >= 0;
}

function isRight(a: Point, b: Point, c: Point) {
  return triangleArea(a, b, c) < 0;
}

function isRightOn(a: Point, b: Point, c: Point) {
  return triangleArea(a, b, c) <= 0;
}

/**
 * Check if three points are collinear
 * @method collinear
 * @param {Array} a
 * @param {Array} b
 * @param {Array} c
 * @param {Number} [thresholdAngle=0] Threshold angle to use when comparing the vectors. The function will return true if the angle between the resulting vectors is less than this value. Use zero for max precision.
 * @return {Boolean}
 */
function collinear(a: Point, b: Point, c: Point, thresholdAngle: number): boolean {
  if (!thresholdAngle) {
    return triangleArea(a, b, c) === 0;
  } else {
    const ab = [b[0] - a[0], b[1] - a[1]];
    const bc = [c[0] - b[0], c[1] - b[1]];

    const dot = ab[0] * bc[0] + ab[1] * bc[1];
    const magA = Math.sqrt(ab[0] * ab[0] + ab[1] * ab[1]);
    const magB = Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1]);
    const angle = Math.acos(dot / (magA * magB));
    return angle < thresholdAngle;
  }
}

function sqdist(a: Point, b: Point) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return dx * dx + dy * dy;
}

/**
 * Get a vertex at position i. It does not matter if i is out of bounds, this function will just cycle.
 * @method polygonAt
 * @param polygon
 * @param {Number} i
 * @return {[number, number]}
 */
function polygonAt(polygon: Polygon, i: number): [number, number] {
  const s = polygon.length;
  return polygon[i < 0 ? (i % s) + s : i % s];
}

/**
 * Clear the polygon data
 * @method polygonClear
 * @return {Polygon}
 */
function polygonClear(polygon: Polygon): Polygon {
  polygon.length = 0;
  return polygon;
}

/**
 * Append points "from" to "to"-1 from another polygon "poly" onto this one.
 * @method polygonAppend
 * @param polygon
 * @param {Polygon} poly The polygon to get points from.
 * @param {Number} from The vertex index in "poly".
 * @param {Number} to The end vertex index in "poly". Note that this vertex is NOT included when appending.
 * @return {Polygon}
 */
function polygonAppend(polygon: Polygon, poly: Polygon, from: number, to: number): Polygon {
  for (let i = from; i < to; i++) {
    polygon.push(poly[i]);
  }
  return polygon;
}

/**
 * Make sure that the polygon vertices are ordered counter-clockwise.
 * @method makeCCW
 */
export function makeCCW(polygon: Polygon) {
  let br = 0;
  // find bottom right point
  for (let i = 1; i < polygon.length; ++i) {
    if (polygon[i][1] < polygon[br][1] || (polygon[i][1] === polygon[br][1] && polygon[i][0] > polygon[br][0])) {
      br = i;
    }
  }

  // reverse poly if clockwise
  if (!isLeft(polygonAt(polygon, br - 1), polygonAt(polygon, br), polygonAt(polygon, br + 1))) {
    polygonReverse(polygon);
    return true;
  }
  return false;
}

/**
 * Reverse the vertices in the polygon
 * @method reverse
 */
function polygonReverse(polygon: Polygon) {
  const tmp = [];
  const N = polygon.length;
  for (let i = 0; i !== N; i++) {
    tmp.push(polygon.pop());
  }
  for (let i = 0; i !== N; i++) {
    polygon[i] = tmp[i]!;
  }
}

/**
 * Check if a point in the polygon is a reflex point
 * @method polygonIsReflex
 * @param polygon
 * @param {Number} i
 * @return {Boolean}
 */
function polygonIsReflex(polygon: Polygon, i: number): boolean {
  return isRight(polygonAt(polygon, i - 1), polygonAt(polygon, i), polygonAt(polygon, i + 1));
}

/**
 * Check if two vertices in the polygon can see each other
 * @method polygonCanSee
 * @param polygon
 * @param {Number} a Vertex index 1
 * @param {Number} b Vertex index 2
 * @return {Boolean}
 */
function polygonCanSee(polygon: Polygon, a: number, b: number): boolean {
  if (
    isLeftOn(polygonAt(polygon, a + 1), polygonAt(polygon, a), polygonAt(polygon, b)) &&
    isRightOn(polygonAt(polygon, a - 1), polygonAt(polygon, a), polygonAt(polygon, b))
  ) {
    return false;
  }
  const dist = sqdist(polygonAt(polygon, a), polygonAt(polygon, b));
  for (let i = 0; i !== polygon.length; ++i) {
    // for each edge
    if ((i + 1) % polygon.length === a || i === a) {
      // ignore incident edges
      continue;
    }
    if (
      isLeftOn(polygonAt(polygon, a), polygonAt(polygon, b), polygonAt(polygon, i + 1)) &&
      isRightOn(polygonAt(polygon, a), polygonAt(polygon, b), polygonAt(polygon, i))
    ) {
      // if diag intersects an edge
      const l1 = [polygonAt(polygon, a), polygonAt(polygon, b)] as const;
      const l2 = [polygonAt(polygon, i), polygonAt(polygon, i + 1)] as const;
      const p = lineInt(l1, l2);
      if (sqdist(polygonAt(polygon, a), p) < dist) {
        // if edge is blocking visibility to b
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if two vertices in the polygon can see each other
 * @method polygonCanSee2
 * @param {Polygon} polygon
 * @param {Number} a Vertex index 1
 * @param {Number} b Vertex index 2
 * @return {Boolean}
 */
function polygonCanSee2(polygon: Polygon, a: number, b: number): boolean {
  // for each edge
  for (let i = 0; i !== polygon.length; ++i) {
    // ignore incident edges
    if (i === a || i === b || (i + 1) % polygon.length === a || (i + 1) % polygon.length === b) {
      continue;
    }
    if (
      lineSegmentsIntersect(
        polygonAt(polygon, a),
        polygonAt(polygon, b),
        polygonAt(polygon, i),
        polygonAt(polygon, i + 1)
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Copy the polygon from vertex i to vertex j.
 * @method copy
 * @param polygon
 * @param {Number} i
 * @param {Number} j
 * @param {Polygon} [targetPoly] Optional target polygon to save in.
 * @return {Polygon} The resulting copy.
 */
function polygonCopy(polygon: Polygon, i: number, j: number, targetPoly: Polygon = []): Polygon {
  const p = targetPoly || [];
  polygonClear(p);
  if (i < j) {
    // Insert all vertices from i to j
    for (let k = i; k <= j; k++) {
      p.push(polygon[k]);
    }
  } else {
    // Insert vertices 0 to j
    for (let k = 0; k <= j; k++) {
      p.push(polygon[k]);
    }

    // Insert vertices i to end
    for (let k = i; k < polygon.length; k++) {
      p.push(polygon[k]);
    }
  }
  return p;
}

/**
 * Decomposes the polygon into convex pieces. Returns a list of edges [[p1,p2],[p2,p3],...] that cuts the polygon.
 * Note that this algorithm has complexity O(N^4) and will be very slow for polygons with many vertices.
 * @method polygonGetCutEdges
 * @return {Array}
 */
function polygonGetCutEdges(polygon: Polygon): Array<[Point, Point]> {
  let min: Array<[Point, Point]> = [];
  const tmpPoly: Polygon = [];
  let nDiags = Number.MAX_VALUE;

  for (let i = 0; i < polygon.length; ++i) {
    if (polygonIsReflex(polygon, i)) {
      for (let j = 0; j < polygon.length; ++j) {
        if (polygonCanSee(polygon, i, j)) {
          const tmp1 = polygonGetCutEdges(polygonCopy(polygon, i, j, tmpPoly));
          const tmp2 = polygonGetCutEdges(polygonCopy(polygon, j, i, tmpPoly));
          for (let k = 0; k < tmp2.length; k++) {
            tmp1.push(tmp2[k]);
          }
          if (tmp1.length < nDiags) {
            min = tmp1;
            nDiags = tmp1.length;
            min.push([polygonAt(polygon, i), polygonAt(polygon, j)]);
          }
        }
      }
    }
  }
  return min;
}

/**
 * Decomposes the polygon into one or more convex sub-Polygons.
 * @method decomp
 * @return {Array} An array or Polygon objects.
 */
export function decomp(polygon: Polygon): Polygon[] {
  const edges = polygonGetCutEdges(polygon);
  if (edges.length > 0) return polygonSlice(polygon, edges);
  return [polygon];
}

/**
 * Slices the polygon given one or more cut edges. If given one, this function will return two polygons (false on failure). If many, an array of polygons.
 * @method slice
 * @param polygon
 * @param {Array} cutEdges A list of edges, as returned by .getCutEdges()
 * @return {Array}
 */
function polygonSlice(polygon: Polygon, cutEdges: Array<[Point, Point]>): Polygon[] {
  const polys = [polygon];
  for (let i = 0; i < cutEdges.length; i++) {
    const cutEdge = cutEdges[i];
    // Cut all polys
    for (let j = 0; j < polys.length; j++) {
      const poly = polys[j];
      const result = polygonSlice(poly, [cutEdge]);
      if (result) {
        // Found poly! Cut and quit
        polys.splice(j, 1);
        polys.push(result[0], result[1]);
        break;
      }
    }
  }
  return polys;
}

/**
 * Checks that the line segments of this polygon do not intersect each other.
 * @method isSimple
 * @param {Array} path An array of vertices e.g. [[0,0],[0,1],...]
 * @return {Boolean}
 * @todo Should it check all segments with all others?
 */
export function isSimple(path: Polygon): boolean {
  // Check
  for (let i = 0; i < path.length - 1; i++) {
    for (let j = 0; j < i - 1; j++) {
      if (lineSegmentsIntersect(path[i], path[i + 1], path[j], path[j + 1])) {
        return false;
      }
    }
  }
  // Check the segment between the last and the first point to all others
  for (let i = 1; i < path.length - 2; i++) {
    if (lineSegmentsIntersect(path[0], path[path.length - 1], path[i], path[i + 1])) {
      return false;
    }
  }
  return true;
}

function getIntersectionPoint(p1: Point, p2: Point, q1: Point, q2: Point, delta: number): Point {
  delta = delta || 0;
  const a1 = p2[1] - p1[1];
  const b1 = p1[0] - p2[0];
  const c1 = a1 * p1[0] + b1 * p1[1];
  const a2 = q2[1] - q1[1];
  const b2 = q1[0] - q2[0];
  const c2 = a2 * q1[0] + b2 * q1[1];
  const det = a1 * b2 - a2 * b1;

  if (!scalar_eq(det, 0, delta)) return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det];
  return [0, 0];
}

/**
 * Quickly decompose the Polygon into convex sub-polygons.
 * @method quickDecomp
 * @param polygon
 * @param {Array} result
 * @param {Array} [reflexVertices]
 * @param {Array} [steinerPoints]
 * @param {Number} [delta]
 * @param {Number} [maxlevel]
 * @param {Number} [level]
 * @return {Array}
 */
function polygonQuickDecomp(
  polygon: Polygon,
  result: Polygon[],
  reflexVertices: Point[],
  steinerPoints: Point[],
  delta: number,
  maxlevel: number,
  level: number
): Polygon[] {
  maxlevel = maxlevel || 100;
  level = level || 0;
  delta = delta || 25;
  result = typeof result !== 'undefined' ? result : [];
  reflexVertices = reflexVertices || [];
  steinerPoints = steinerPoints || [];
  // Points
  let upperInt: Point = [0, 0];
  let lowerInt: Point = [0, 0];
  let p: Point = [0, 0];

  // scalars
  let upperDist = 0;
  let lowerDist = 0;
  let d = 0;
  let closestDist = 0;

  // Integers
  let upperIndex = 0;
  let lowerIndex = 0;
  let closestIndex = 0;

  // polygons
  const lowerPoly: Polygon = [];
  const upperPoly: Polygon = [];
  const poly = polygon;
  const v = polygon;

  if (v.length < 3) return result;

  level++;
  if (level > maxlevel) throw new Error(`quickDecomp: max level (${maxlevel}) reached.`);

  for (let i = 0; i < polygon.length; ++i) {
    if (polygonIsReflex(poly, i)) {
      reflexVertices.push(poly[i]);
      upperDist = lowerDist = Number.MAX_VALUE;

      for (let j = 0; j < polygon.length; ++j) {
        if (
          isLeft(polygonAt(poly, i - 1), polygonAt(poly, i), polygonAt(poly, j)) &&
          isRightOn(polygonAt(poly, i - 1), polygonAt(poly, i), polygonAt(poly, j - 1))
        ) {
          // if line intersects with an edge
          p = getIntersectionPoint(
            polygonAt(poly, i - 1),
            polygonAt(poly, i),
            polygonAt(poly, j),
            polygonAt(poly, j - 1),
            delta
          ); // find the point of intersection
          if (isRight(polygonAt(poly, i + 1), polygonAt(poly, i), p)) {
            // make sure it's inside the poly
            d = sqdist(poly[i], p);
            if (d < lowerDist) {
              // keep only the closest intersection
              lowerDist = d;
              lowerInt = p;
              lowerIndex = j;
            }
          }
        }
        if (
          isLeft(polygonAt(poly, i + 1), polygonAt(poly, i), polygonAt(poly, j + 1)) &&
          isRightOn(polygonAt(poly, i + 1), polygonAt(poly, i), polygonAt(poly, j))
        ) {
          p = getIntersectionPoint(
            polygonAt(poly, i + 1),
            polygonAt(poly, i),
            polygonAt(poly, j),
            polygonAt(poly, j + 1),
            delta
          );
          if (isLeft(polygonAt(poly, i - 1), polygonAt(poly, i), p)) {
            d = sqdist(poly[i], p);
            if (d < upperDist) {
              upperDist = d;
              upperInt = p;
              upperIndex = j;
            }
          }
        }
      }

      // if there are no vertices to connect to, choose a point in the middle
      if (lowerIndex === (upperIndex + 1) % polygon.length) {
        //console.log("Case 1: Vertex("+i+"), lowerIndex("+lowerIndex+"), upperIndex("+upperIndex+"), poly.size("+polygon.length+")");
        p[0] = (lowerInt[0] + upperInt[0]) / 2;
        p[1] = (lowerInt[1] + upperInt[1]) / 2;
        steinerPoints.push(p);

        if (i < upperIndex) {
          //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.begin() + upperIndex + 1);
          polygonAppend(lowerPoly, poly, i, upperIndex + 1);
          lowerPoly.push(p);
          upperPoly.push(p);
          if (lowerIndex !== 0) {
            //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.end());
            polygonAppend(upperPoly, poly, lowerIndex, poly.length);
          }
          //upperPoly.insert(upperPoly.end(), poly.begin(), poly.begin() + i + 1);
          polygonAppend(upperPoly, poly, 0, i + 1);
        } else {
          if (i !== 0) {
            //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.end());
            polygonAppend(lowerPoly, poly, i, poly.length);
          }
          //lowerPoly.insert(lowerPoly.end(), poly.begin(), poly.begin() + upperIndex + 1);
          polygonAppend(lowerPoly, poly, 0, upperIndex + 1);
          lowerPoly.push(p);
          upperPoly.push(p);
          //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.begin() + i + 1);
          polygonAppend(upperPoly, poly, lowerIndex, i + 1);
        }
      } else {
        // connect to the closest point within the triangle
        //console.log("Case 2: Vertex("+i+"), closestIndex("+closestIndex+"), poly.size("+polygon.length+")\n");

        if (lowerIndex > upperIndex) upperIndex += polygon.length;
        closestDist = Number.MAX_VALUE;

        if (upperIndex < lowerIndex) return result;

        for (let j = lowerIndex; j <= upperIndex; ++j) {
          if (
            isLeftOn(polygonAt(poly, i - 1), polygonAt(poly, i), polygonAt(poly, j)) &&
            isRightOn(polygonAt(poly, i + 1), polygonAt(poly, i), polygonAt(poly, j))
          ) {
            d = sqdist(polygonAt(poly, i), polygonAt(poly, j));
            if (d < closestDist && polygonCanSee2(poly, i, j)) {
              closestDist = d;
              closestIndex = j % polygon.length;
            }
          }
        }

        if (i < closestIndex) {
          polygonAppend(lowerPoly, poly, i, closestIndex + 1);
          if (closestIndex !== 0) polygonAppend(upperPoly, poly, closestIndex, v.length);
          polygonAppend(upperPoly, poly, 0, i + 1);
        } else {
          if (i !== 0) polygonAppend(lowerPoly, poly, i, v.length);
          polygonAppend(lowerPoly, poly, 0, closestIndex + 1);
          polygonAppend(upperPoly, poly, closestIndex, i + 1);
        }
      }

      // solve smallest poly first
      if (lowerPoly.length < upperPoly.length) {
        polygonQuickDecomp(lowerPoly, result, reflexVertices, steinerPoints, delta, maxlevel, level);
        polygonQuickDecomp(upperPoly, result, reflexVertices, steinerPoints, delta, maxlevel, level);
      } else {
        polygonQuickDecomp(upperPoly, result, reflexVertices, steinerPoints, delta, maxlevel, level);
        polygonQuickDecomp(lowerPoly, result, reflexVertices, steinerPoints, delta, maxlevel, level);
      }
      return result;
    }
  }
  result.push(polygon);
  return result;
}

export function quickDecomp(polygon: Polygon, delta: number = 0, maxlevel: number = 100) {
  return polygonQuickDecomp(polygon, [], [], [], delta, maxlevel, 0);
}

/**
 * Remove collinear points in the polygon.
 * @method removeCollinearPoints
 * @param polygon
 * @param {Number} [precision] The threshold angle to use when determining whether two edges are collinear. Use zero for finest precision.
 * @return {Number} The number of points removed
 */
export function removeCollinearPoints(polygon: Polygon, precision: number): number {
  let num = 0;
  for (let i = polygon.length - 1; polygon.length > 3 && i >= 0; --i) {
    if (collinear(polygonAt(polygon, i - 1), polygonAt(polygon, i), polygonAt(polygon, i + 1), precision)) {
      // Remove the middle point
      polygon.splice(i % polygon.length, 1);
      num++;
    }
  }
  return num;
}

/**
 * Remove duplicate points in the polygon.
 * @method removeDuplicatePoints
 * @param polygon
 * @param {Number} [precision] The threshold to use when determining whether two points are the same. Use zero for best precision.
 */
export function removeDuplicatePoints(polygon: Polygon, precision: number) {
  for (let i = polygon.length - 1; i >= 1; --i) {
    const pi = polygon[i];
    for (let j = i - 1; j >= 0; --j) {
      if (points_eq(pi, polygon[j], precision)) {
        polygon.splice(i, 1);
      }
    }
  }
}

/**
 * Check if two scalars are equal
 * @static
 * @method scalar_eq
 * @param {Number} a
 * @param {Number} b
 * @param {Number} [precision]
 * @return {Boolean}
 */
function scalar_eq(a: number, b: number, precision: number): boolean {
  return Math.abs(a - b) <= (precision || 0);
}

/**
 * Check if two points are equal
 * @static
 * @method points_eq
 * @param {Array} a
 * @param {Array} b
 * @param {Number} [precision]
 * @return {Boolean}
 */
function points_eq(a: Point, b: Point, precision: number): boolean {
  return scalar_eq(a[0], b[0], precision) && scalar_eq(a[1], b[1], precision);
}
