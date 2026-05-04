//src/World.js

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { InteractionManager } from "three.interactive";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { Timer } from "three";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";

class World {
  
  constructor(settings = {}) {
    this.mixers = []; //til vores animationLoop
    this.timer = new Timer(); //til vores animationLoop

    const defaults = {
      //defualt setting
      showCameraPos: false,
      setCameraPos: [0, 0, 0],
      showGrid: false,
      showAxes: false,
      ambientLight: false,
      orbitControl: false,
      showFloor: false,
      floorColor: 0xfff000,
    };

    this.settings = { ...defaults, ...settings }; // spread operator ->merge og overskriver default til settings, hvis de eksisterer i settings (undgår undefined)

    console.log(this.settings);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    const floorMaterial = new THREE.ShadowMaterial();
    floorMaterial.opacity = 0.5; // Juster hvor mørk skyggen skal være

    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      floorMaterial,
    );
    floorMesh.rotation.x = -Math.PI / 2; // Læg den ned
    floorMesh.receiveShadow = true; // Vigtigt!
    floorMesh.position.set(0, -4, 0);
    this.scene.add(floorMesh);

    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupHelpers();
    this.setupLights();
    this.setupFloor();

    this.interactionManager = new InteractionManager(
      this.renderer,
      this.camera,
      this.renderer.domElement,
    );

    // settings.useAnimationLoop && this.renderer.setAnimationLoop((time) => this.animation(time));

    window.addEventListener("resize", () =>
      this.onWindowResized(this.renderer, this.camera),
    );
  } //end constructor

  animation(time) {
    this.timer.update(time);

    //Hent delta (tiden der er gået siden sidste frame)
    const delta = this.timer.getDelta();

    //Opdater alle mixere
    this.mixers.forEach((ninjaInstance) => {
      if (ninjaInstance.mixer) {
        ninjaInstance.mixer.update(delta);
      }
    });

    //this.renderer.render(this.scene, this.camera);
    this.composer.render(); // Brug composer i stedet!
  }

  onWindowResized() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight); // Tilføj denne
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.5,
      150,
    );

    if (Array.isArray(this.settings.setCameraPos)) {
      this.camera.position.set(...this.settings.setCameraPos);
    }

    //this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const renderScene = new RenderPass(this.scene, this.camera);

    // Parametre: (opløsning, styrke, radius, threshold)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.05, // Styrke (Bloom strength) - juster denne for mere/mindre glød
      0.02, // Radius
      0.85, // Threshold (Hvor lyst skal noget være før det gløder? 0.85 er godt til metal)
    );

    const size = this.renderer.getSize(new THREE.Vector2());

    const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      samples: 5,
      type: THREE.HalfFloatType, // Giver mere præcision og lyser scenen op igen
      colorSpace: THREE.SRGBColorSpace, // Sikrer korrekt farvegengivelse
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);

    // OutputPass sikrer at farverne (toneMapping) stadig ser rigtige ud
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  setupControls() {
    if (!this.settings.orbitControl) return;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    if (this.settings.showCameraPos) {
      this.controls.addEventListener("change", () => {
        const pos = this.controls.object.position;
        console.log(
          `Camera Position → x:${pos.x.toFixed(1)} y:${pos.y.toFixed(1)} z:${pos.z.toFixed(1)}`,
        );
      });
    }
  }

  setupHelpers() {
    if (this.settings.showGrid) {
      const gridHelper = new THREE.GridHelper(20, 20);
      this.scene.add(gridHelper);
    }

    if (this.settings.showAxes) {
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
    }
  }

  setupLights() {
    if (this.settings.ambientLight) {
      const al = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(al);
    }
  }

  setupFloor() {
    if (!this.settings.showFloor) return;

    const geometryFloor = new THREE.PlaneGeometry(25, 20);
    // Skift til MeshStandardMaterial for at bruge roughness/metalness
    const materialFloor = new THREE.MeshStandardMaterial({
      color: this.settings.floorColor,
      side: THREE.DoubleSide,
      roughness: 0, // Gør det spejlblankt
      metalness: 0.5, // Giver materialet tyngde (juster mellem 0 og 1)
    });

    const floor = new THREE.Mesh(geometryFloor, materialFloor);
    floor.receiveShadow = true;
    floor.rotation.x = Math.PI / 2;
    floor.position.set(1, -1, 1);

    // Sørg for at din HDRI er sat som envMap på materialet,
    // medmindre du har sat scene.environment = dinHDRI;
    floor.material.envMapIntensity = 3.0;

    this.scene.add(floor);
  }

  loadHDRI(h, e, show) {
    const loader = new HDRLoader();

    loader.load(h, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = texture;
      this.scene.environment = texture;

      if (!show) this.scene.background = new THREE.Color("#000000");

      // Renderer indstillinger for bedre farver
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = e;
    });
  }

  loadFog(c, e) {
    this.scene.fog = new THREE.FogExp2(c, e);
  }

  sun() {
    // 1. Opret lyset (farve, intensitet)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2);

    // 2. Bestem retningen (hvor kommer solen fra?)
    // Forestil dig at den står højt på himlen
    sunLight.position.set(10, 20, 10);
    sunLight.shadow.bias = -0.009;
    sunLight.decay = 2;
    sunLight.distance = 0;
    sunLight.castShadow = true;
    // 3. Tilføj til scenen
    this.scene.add(sunLight);

    // Valgfrit: Aktiver skygger (hvis du vil have dem)
    sunLight.castShadow = true;
    const helper = new THREE.DirectionalLightHelper(sunLight, 5); // 5 er størrelsen på hjælperen
    this.scene.add(helper);
  }
}

export default World;
