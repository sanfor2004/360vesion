/**
 * Coordinate helpers for the sphere studio. The camera sits at the centre of an
 * inverted sphere of radius R; hotspots are stored as {yaw, pitch} in degrees.
 *
 * Conventions (match the original sphere-studio tool):
 *  - yaw   = horizontal angle, atan2(z, x) in degrees
 *  - pitch = vertical angle, 0 at the horizon, +up, clamp ±89
 */
import * as THREE from "three";

const { radToDeg, degToRad, clamp } = THREE.MathUtils;

/** Where the camera should look, given a look direction in degrees. */
export function lookTarget(R: number, lon: number, lat: number): THREE.Vector3 {
  const phi = degToRad(90 - lat);
  const theta = degToRad(lon);
  return new THREE.Vector3(
    R * Math.sin(phi) * Math.cos(theta),
    R * Math.cos(phi),
    R * Math.sin(phi) * Math.sin(theta)
  );
}

/** (yaw, pitch) in degrees -> a world position on the sphere (slightly inside). */
export function dirToWorld(yaw: number, pitch: number, r: number): THREE.Vector3 {
  const phi = degToRad(90 - pitch);
  const theta = degToRad(yaw);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/** A world point on the sphere -> {yaw, pitch} in degrees. */
export function worldToDir(p: THREE.Vector3): { yaw: number; pitch: number } {
  const pitch = 90 - radToDeg(Math.acos(clamp(p.y / p.length(), -1, 1)));
  const yaw = radToDeg(Math.atan2(p.z, p.x));
  return { yaw, pitch };
}

/** Pointer event -> normalized device coordinates for the given canvas. */
export function ndcFromEvent(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement
): THREE.Vector2 {
  const r = canvas.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1
  );
}
