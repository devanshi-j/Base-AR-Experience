import * as THREE from '../libs/three/three.module.js';
import { OrbitControls } from '../libs/three/jsm/OrbitControls.js';
import { GLTFLoader } from '../libs/three/jsm/GLTFLoader.js';
import { Stats } from '../libs/stats.module.js';
import { CanvasUI } from '../libs/CanvasUI.js'
import { ARButton } from '../libs/ARButton.js';
import { LoadingBar } from '../libs/LoadingBar.js';
import { Player } from '../libs/Player.js';
import { ControllerGestures } from '../libs/ControllerGestures.js';
import { RGBELoader } from '../libs/three/jsm/RGBELoader.js';

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.clock = new THREE.Clock();

	
	
	this.assetsPath = '../assets/';
	
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 10);

        this.scene = new THREE.Scene();

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set(0.5, 1, 0.25);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight();
        light.position.set(0.2, 1, 1);
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);
        this.setEnvironment();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.origin = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();

       
        this.initScene();
        this.setupXR();
        this.loadKnight();
        window.addEventListener('resize', this.resize.bind(this));
    }

    setEnvironment() {
        const loader = new RGBELoader().setDataType(THREE.UnsignedByteType);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        const self = this;

        loader.load('../assets/hdr/venice_sunset_1k.hdr', (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();

            self.scene.environment = envMap;
        }, undefined, (err) => {
            console.error('An error occurred setting the environment');
        });
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

     loadKnight() {

	this.loadingBar = new LoadingBar();
        const loader = new GLTFLoader().setPath(this.assetsPath);
        const self = this;

        loader.load(
            `knight2.glb`,
            function (gltf) {
                const object = gltf.scene.children[5];

                const options = {
                    object: object,
                    speed: 0.5,
                    assetsPath: self.assetsPath,
                    loader: loader,
                    animations: gltf.animations,
                    clip: gltf.animations[0],
                    app: self,
                    name: 'knight',
                    npc: false
                };

                self.knight = new Player(options);

                self.knight.object.visible = true;

                self.knight.action = 'Dance';
                const scale = 0.005;
                self.knight.object.scale.set(scale, scale, scale);

                self.knight.object.position.set(0, 0, -5);

                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            function (xhr) {
                self.loadingBar.progress = xhr.loaded / xhr.total;
            },
            function (error) {
                console.error('An error happened', error);
            }
        );
    }
	
    
    initScene(){
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        

        this.isDragging = false;
        this.dragStartPosition = new THREE.Vector3();
       
       
        this.createUI();

    }

   
    createUI() {
        const config = {
            panelSize: { width: 0.15, height: 0.038 },
            height: 128,
            info: { type: "text" }
        }
        const content = {
            info: "Debug info"
        }

        const ui = new CanvasUI(content, config);

        this.ui = ui;
    }

setupXR(){
	
	this.renderer.xr.enabled = true;
        
        const btn = new ARButton(this.renderer, { onSessionStart, onSessionEnd, sessionInit: { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } } });

	 this.controller = this.renderer.xr.getController(0);
         this.controller.addEventListener('select', this.onSelect.bind(this));
         this.scene.add(this.controller);
        
        const self = this;
        let controller, controller1;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;

        function onSessionStart() {
            self.ui.mesh.position.set(0, -0.15, -0.3);
            self.camera.add(self.ui.mesh);
          }
      
          function onSessionEnd() {
            self.camera.remove(self.ui.mesh);
          }

       
        
        function onSelect() {
            if (self.knight===undefined) return;
            
            if (self.reticle.visible){
                if (self.knight.object.visible){
                    self.workingVec3.setFromMatrixPosition( self.reticle.matrix );
                    self.knight.newPath(self.workingVec3);
                }else{
                    self.knight.object.position.setFromMatrixPosition( self.reticle.matrix );
                    self.knight.object.visible = true;
                }
            }
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        
        this.scene.add( this.controller );    
    }
    
   
requestHitTestSource() {
    const self = this;
    const session = this.renderer.xr.getSession();

    session.requestReferenceSpace('viewer').then(function (referenceSpace) {
        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
            self.hitTestSource = source;
        });
    });

    session.addEventListener('end', function () {
        self.hitTestSourceRequested = false;
        self.hitTestSource = null;
        self.referenceSpace = null;
    });

    this.hitTestSourceRequested = true;
} 

    
    
    getHitTestResults( frame ){
        const hitTestResults = frame.getHitTestResults( this.hitTestSource );

        if ( hitTestResults.length ) {
            
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[ 0 ];
            const pose = hit.getPose( referenceSpace );

	   const hitTestResults = frame.getHitTestResults(this.hitTestSource);

            this.reticle.visible = true;
            this.reticle.matrix.fromArray( pose.transform.matrix );

        } else {

            this.reticle.visible = false;

        }

        this.gestures = new ControllerGestures(this.renderer);
        this.gestures.addEventListener( 'tap', (ev)=>{
            //console.log( 'tap' ); 
            self.ui.updateElement('info', 'tap' );
            if (!self.knight.object.visible){
                self.knight.object.visible = true;
                self.knight.object.position.set( 0, -0.3, -0.5 ).add( ev.position );
                self.scene.add( self.knight.object ); 
            }
        });
        this.gestures.addEventListener( 'doubletap', (ev)=>{
            //console.log( 'doubletap'); 
            self.ui.updateElement('info', 'doubletap' );
        });
        this.gestures.addEventListener( 'press', (ev)=>{
            //console.log( 'press' );    
            self.ui.updateElement('info', 'press' );
        });
        this.gestures.addEventListener('press', (ev) => {
            if (!self.knight.object.visible) return;
      
            self.isDragging = true;
            self.dragStartPosition.copy(self.knight.object.position);
            self.ui.updateElement('info', 'Drag started');
          });

        
          this.gestures.addEventListener('pan', (ev) => {
            if (!self.isDragging) return;
          
            // Handle pan start (initial drag position)
            if (ev.initialise !== undefined) {
              self.startPosition = self.knight.object.position.clone();
            } else {
              // Calculate new position based on drag delta and sensitivity
              const dragSensitivity = 3; // Adjust this value for desired movement speed
              const delta = ev.delta.multiplyScalar(dragSensitivity);
              const newPosition = self.startPosition.clone().add(delta);
          
              // Update model position and UI (optional)
              self.knight.object.position.copy(newPosition);
              self.ui.updateElement('info', `Dragging: x:${delta.x.toFixed(3)}, y:${delta.y.toFixed(3)}, z:${delta.z.toFixed(3)}`);
            }
          });
          
        this.gestures.addEventListener( 'swipe', (ev)=>{
            //console.log( ev );   
            self.ui.updateElement('info', `swipe ${ev.direction}` );
            if (self.knight.object.visible){
                self.knight.object.visible = false;
                self.scene.remove( self.knight.object ); 
            }
        });
        this.gestures.addEventListener( 'pinch', (ev)=>{
            //console.log( ev );  
            if (ev.initialise !== undefined){
                self.startScale = self.knight.object.scale.clone();
            }else{
                const scale = self.startScale.clone().multiplyScalar(ev.scale);
                self.knight.object.scale.copy( scale );
                self.ui.updateElement('info', `pinch delta:${ev.delta.toFixed(3)} scale:${ev.scale.toFixed(2)}` );
            }
        });
        this.gestures.addEventListener( 'rotate', (ev)=>{
            //      sconsole.log( ev ); 
            if (ev.initialise !== undefined){
                self.startQuaternion = self.knight.object.quaternion.clone();
            }else{
                self.knight.object.quaternion.copy( self.startQuaternion );
                self.knight.object.rotateY( ev.theta );
                self.ui.updateElement('info', `rotate ${ev.theta.toFixed(3)}`  );
            }
        });

        this.renderer.setAnimationLoop( this.render.bind(this) );

    }
    
   
    
    /*render(timestamp, frame) {
        const dt = this.clock.getDelta();
        if (this.knight) {
            this.knight.update(dt);
        }
    
        if (frame) {
            if (this.hitTestSourceRequested === false) {
                this.requestHitTestSource();
            }
    
            if (this.hitTestSource) {
                this.getHitTestResults(frame);
            }
        }
    
        this.renderer.render(this.scene, this.camera);
    
        /*if (this.knight.calculatedPath && this.knight.calculatedPath.length > 0) {
            console.log(`path:${this.knight.calculatedPath[0].x.toFixed(2)}, ${this.knight.calculatedPath[0].y.toFixed(2)}, ${this.knight.calculatedPath[0].z.toFixed(2)} position: ${this.knight.object.position.x.toFixed(2)}, ${this.knight.object.position.y.toFixed(2)}, ${this.knight.object.position.z.toFixed(2)}`);
        }*/
    

   render(timestamp, frame) {
    const dt = this.clock.getDelta();
    this.stats.update();

    // Ensure render loop continues even when XR is not presenting
    if (!this.renderer.xr.isPresenting) {
        this.renderer.render(this.scene, this.camera);
    }

    // Check if XR session is present
    if (frame) {
        if (this.hitTestSourceRequested === false) {
            this.requestHitTestSource();
        }

        if (this.hitTestSource) {
            this.getHitTestResults(frame);
        }
    }

    // Render UI
    if (this.renderer.xr.isPresenting) {
        this.gestures.update();
        this.ui.update();
    }

    // Render scene objects (including knight)
    if (this.knight !== undefined) {
        this.knight.update(dt);
    }
}
	
}
// Ensure there are no duplicate render calls outside the function.
// this.renderer.render(this.scene, this.camera);

   
        
export { App };
