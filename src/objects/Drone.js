//src/objects/ninja.js

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import gsap from "gsap";
import { Howl } from "howler";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

class Drone {

  constructor(world, obj = {}) {
    const defaults = {
      model: "/assets/little.glb", // brug absolut sti
      scale: [0.4, 0.4, 0.4],
      position: [0.1, 0.55, 3.5],
      rotationY: 0.3,
      sound: "",
      animate: false,
    };
    const settings = { ...defaults, ...obj };

    //console.log(settings.sound);

    const [xScale, yScale, zScale] = settings.scale;
    const [xPos, yPos, zPos] = settings.position;
    const rotationy = settings.rotationY;

    this.jumpFinished = true;
    this.ready = false;

    this.droneSound = new Howl({
      src: ["/assets/" + settings.sound],
    });

    this.droneOut = new Howl({
      src: ["/assets/whoosh.mp3"]
    });

    // ✅ Lav loader UI
    const ninjaLoader = document.createElement("div");
    ninjaLoader.id = "loader-container";
    document.body.appendChild(ninjaLoader);

    const loadingText = document.createElement("div");
    loadingText.id = "loader-text";
    loadingText.textContent = "Loading: 0%";
    ninjaLoader.appendChild(loadingText);

    // ✅ LoadingManager
    const manager = new THREE.LoadingManager(
      // onLoad
      () => {
        gsap.to("#loader-container", {
          opacity: 0,
          duration: 0.5,
          onComplete: () =>
            document.getElementById("loader-container").remove(),
        });
        this.ready = true;
      },
      // onProgress
      (url, itemsLoaded, itemsTotal) => {
        console.log(url);

        const percent = (itemsLoaded / itemsTotal) * 100;
        const loaderText = document.getElementById("loader-text");
        if (loaderText)
          loaderText.innerText = `Loading: ${percent.toFixed(0)}%`;
      },
      // onError
      (url) => {
        console.error(`Fejl under loading af: ${url}`);
      },
    );

    const loader = new GLTFLoader(manager);
    loader.setMeshoptDecoder(MeshoptDecoder);
    // Load modellen
    loader.load(settings.model, (gltf) => {
      this.modelAnim = gltf.scene;
      this.modelAnim.position.set(xPos, yPos, zPos);
      this.modelAnim.rotation.y = rotationy;
      this.modelAnim.scale.set(xScale, yScale, zScale);

      this.modelAnim.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
          if (n.material.name === "Old Metal") {
            n.material.metalness = 1;
            n.material.roughness = 0.5; // Din nuværende metal-indstilling
            n.material.envMapIntensity = 2.5;
          }

          // Hvis objektet bruger materialet til øjet (tjek navnet i Blender)
          if (n.material.name === "Material.001") {
            n.material.metalness = 0; // Gør det blankt
            n.material.roughness = 0; // MEGET lav roughness = spejlblankt
            n.material.envMapIntensity = 3.0; // Giv det lidt ekstra knald på refleksionen
          }
        }
      });

      world.scene.add(this.modelAnim);

      world.mixers.push(this);

      // Animation mixer
      this.mixer = new THREE.AnimationMixer(this.modelAnim);
      this.clips = gltf.animations;

      const clip = THREE.AnimationClip.findByName(this.clips, "idle");
      if (clip && settings.animate) {
        const breath = this.mixer.clipAction(clip);
        breath.timeScale = 0.5;
        breath.play();
      }
    });

    world.interactionManager.add(world.scene);
  }

  start() {
    if (this.jumpFinished && this.ready) {
      this.droneSound.play();

      if (this.actionJump) this.actionJump.reset();

      this.droneSound.play();

      setTimeout(() => {
        this.go();
      }, 5000);

      const clipJump = THREE.AnimationClip.findByName(this.clips, "breath");

      this.actionJump = this.mixer.clipAction(clipJump);
      this.actionJump.timeScale = 2;
      //this.actionJump.setLoop(THREE.LoopOnce);
      this.actionJump.play();
    }

    this.jumpFinished = false;
  }

  go() {
    this.droneOut.play();

    gsap.to(this.modelAnim.position, {
      duration: 3,
      z: 20,
      // repeat: 1,
      //yoyo: true,
      ease: "Circ.easeInOut",
      onComplete: () => {
        this.jumpFinished = true;
      },
    });
  }
}

export default Drone;
