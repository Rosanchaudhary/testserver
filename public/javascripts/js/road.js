const roadSegments = [];
const SEGMENT_LENGTH = 20;

export function initRoad(scene) {
  for (let i = 0; i < 5; i++) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.1, SEGMENT_LENGTH),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    road.position.z = -i * SEGMENT_LENGTH;
    scene.add(road);
    roadSegments.push(road);
  }
}

export function updateRoad(speed) {
  roadSegments.forEach(seg => {
    seg.position.z += speed;
    if (seg.position.z > 10) {
      seg.position.z -= SEGMENT_LENGTH * roadSegments.length;
    }
  });
}
