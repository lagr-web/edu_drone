//src/Scene.js

import World from "./World";
import AnimatedLight from "./objects/AnimatedLight";
import Wall from "./objects/Wall";
import Drone from "./objects/Drone";
import Props from "./objects/Props";
import Light from "./objects/Light";

class Scene {
  constructor() {
  
    this.ninja = document.createElement("div");
    this.ninja.id = "ninja";
    document.body.appendChild(this.ninja);

    let ninjaImg = document.createElement("img");
    ninjaImg.src = "./assets/ninja.png";
    this.ninja.appendChild(ninjaImg); 


  } //end constructor
} //end class

export default Scene;
