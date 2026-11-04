import * as THREE from "three";

/** Latitude/longitude (degrees) → point on a sphere of radius r (three-globe convention). */
export function latLonToVec3(lat: number, lon: number, r = 1, target = new THREE.Vector3()) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return target.set(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/** Globe rotation (x, y) that brings lat/lon to face the camera (+z), centred on screen. */
export function rotationToFace(lat: number, lon: number) {
  const p = latLonToVec3(lat, lon);
  const ry = -Math.atan2(p.x, p.z);
  // after rotating about Y the point sits at (0, y, z'); tilt about X to centre it
  const zAfter = Math.hypot(p.x, p.z);
  const rx = Math.atan2(p.y, zAfter);
  return { rx, ry };
}
