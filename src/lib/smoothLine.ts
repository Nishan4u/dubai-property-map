// Catmull-Rom spline interpolation -- turns a small set of real station/
// waypoint coordinates into a smooth curve that still passes exactly
// through every original point, instead of sharp straight-line segments
// between them. Used for metro lines specifically: unlike roads, rail
// alignments aren't something the Mapbox Directions API can trace, so this
// is the practical way to make them read as a flowing line on the map
// rather than a dot-to-dot connection.
export function smoothLine(points: [number, number][], segmentsPerSpan = 8): [number, number][] {
  if (points.length < 3) return points;

  const result: [number, number][] = [];
  const get = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);

    const steps = i === points.length - 2 ? segmentsPerSpan + 1 : segmentsPerSpan;
    for (let s = 0; s < steps; s++) {
      const t = s / segmentsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1[0] +
          (p2[0] - p0[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (p2[1] - p0[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      result.push([x, y]);
    }
  }

  return result;
}
