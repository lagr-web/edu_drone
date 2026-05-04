import * as THREE from "three";

export default class Light {

  constructor(world, options = {}) {

    this.world = world;

    console.log(options);

    this.color = options.color || 0xffffff;
    this.strength = options.strength || 100;
    //this.position =  [0.1, 0.55, 3.5];

    this.createLight(options);

  }

  createLight(options){

    
     const spot = new THREE.SpotLight(this.color, this.strength);

      spot.position.set(options.pos[0],options.pos[1], options.pos[2]);

      // bedre lys kontrol
      spot.angle = Math.PI / 6;
      spot.penumbra = 0.3;
      spot.decay = 2;
      spot.distance = 50;
 spot.shadow.bias = -0.009; 
 spot.shadow.radius = 5;
      // shadows (valgfrit men realistisk)
      spot.castShadow = true;
    //spot.target = options.target;
      this.world.scene.add(spot);
      
 const slHelper = new THREE.SpotLightHelper(spot);

    options.showHelper && this.world.scene.add(slHelper);
  }

  
}