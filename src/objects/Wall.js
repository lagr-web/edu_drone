import * as THREE from "three";

class Wall {

  constructor(world, obj = {}) {

    // Sæt defaults og overskriv med det der evt. kommer ind via obj
    const defaults = {
      color: 0xffffff,
      size: [10, 10],
      pos: [0, 0, 0],
      rotation: 0,
    };

// Sammenlægger default indstillinger med brugerindstillinger - obj overskriver defaults
    const settings = { ...defaults, ...obj };

     // Array destructuring - udpakker bredde og højde fra size array'et til separate variabler
    // Pak værdierne ud fra settings
    const [width, height] = settings.size;


         // Array destructuring - udpakker x, y og z fra pos array'et til separate variabler
    // Pak værdierne ud fra settings
    const [x, y, z] = settings.pos;

    // Opret geometri og materiale
    const geometryWall = new THREE.PlaneGeometry(width, height);
    const materialWall = new THREE.MeshPhongMaterial({
      color: settings.color,
      side: THREE.DoubleSide,
    });

    // Opret mesh
    const wall = new THREE.Mesh(geometryWall, materialWall);
    wall.receiveShadow = true;
    wall.position.set(x, y, z);
    wall.rotation.x = settings.rotation;

    // Tilføj til scenen
    world.scene.add(wall);
  }
}

export default Wall;
