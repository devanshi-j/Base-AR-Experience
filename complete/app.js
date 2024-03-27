import * as THREE from '../libs/three/three.module.js';
import { OrbitControls } from '../libs/three/jsm/OrbitControls.js';
import { GLTFLoader } from '../libs/three/jsm/GLTFLoader.js';
import { Stats } from '../libs/stats.module.js';
import { CanvasUI } from '../libs/CanvasUI.js';
import { ARButton } from '../libs/ARButton.js';
import { RGBELoader } from '../libs/three/jsm/RGBELoader.js';
import { LoadingBar } from '../libs/LoadingBar.js';
import { Player } from '../libs/Player.js';
import { ControllerGestures } from '../libs/ControllerGestures.js';

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 200);

        this.scene = new THREE.Scene();

        this.scene.add(this.camera);

        this.scene.add(new THREE.HemisphereLight(0x606060, 0x404040));


        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        

        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild( this.renderer.domElement );
        this.setEnvironment();

        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.workingVec3 = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();

        this.initScene();
        this.setupXR();

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

    resize(){ 
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }

    initScene() {
        this.loadingBar = new LoadingBar();

        this.assetsPath = '../assets/';
        const loader = new GLTFLoader().setPath(this.assetsPath);
        const self = this;

        // Load a GLTF resource
        loader.load(
            `knight2.glb`,
            function (gltf) {
                const object = gltf.scene.children[5];

                // Prepare the object for hit testing
                object.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                const options = {
                    object: object,
                    speed: 0.5,
                    animations: gltf.animations,
                    clip: gltf.animations[0],
                    app: self,
                    name: 'knight',
                    npc: false
                };

                self.knight = new Player(options);
                self.knight.object.visible = false;
                
                self.knight.action = 'Dance';
                const scale = 0.003;
                self.knight.object.scale.set(scale, scale, scale);

                self.loadingBar.visible = false;

                this.reticle = new THREE.Mesh(
                    new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
                    new THREE.MeshBasicMaterial()
                );

                this.reticle.matrixAutoUpdate = false;
                this.reticle.visible = false;
                this.scene.add(this.reticle);

                this.loadKnight();
            },
            // called while loading is progressing
            function (xhr) {
                self.loadingBar.progress = (xhr.loaded / xhr.total);
            },
            // called when loading has errors
            function (error) {
                console.log('An error happened');
            }
        );

        this.createUI();
    }

    createUI() {
        const config = {
            panelSize: { width: 0.15, height: 0.038 },
            height: 128,
            info: { type: "text" }
        };
        const content = {
            info: "Debug info"
        };

        const ui = new CanvasUI(content, config);

        this.ui = ui;
    }

    setupXR() {
        this.renderer.xr.enabled = true;

        const btn = new ARButton(this.renderer, { onSessionStart, onSessionEnd });

        const self = this;
        let controller1, controller2;

    
        this.hitTestSourceRequested = false;
        this.hitTestSource = null;

        function onSessionStart() {
          self.ui.mesh.position.set(0, -0.15, -0.3);
          self.camera.add(self.ui.mesh);
    
          if (!isHitTestRequested) {
            const session = self.renderer.xr.getSession();
            session.requestReferenceSpace('viewer').then(function (refSpace) {
              referenceSpace = refSpace;
              session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                hitTestSource = source;
                isHitTestRequested = true;
              });
            });
          }
        }
    
        function onSessionEnd() {
          self.camera.remove(self.ui.mesh);
          if (hitTestSource) {
            hitTestSource.cancel();
            hitTestSource = null;
          }
          referenceSpace = null;
          isHitTestRequested = false;
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

        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener('select', onSelect);

        this.scene.add(this.controller);

        this.gestures = new ControllerGestures(this.renderer);
        this.gestures.addEventListener('tap', (ev) => {
            self.ui.updateElement('info', 'tap');
            if (!self.knight.object.visible) {
                self.knight.object.visible = true;
                self.knight.object.position.set(0, -0.3, -0.5).add(ev.position);
                self.scene.add(self.knight.object);
            }
        });
        this.gestures.addEventListener('doubletap', (ev) => {
            self.ui.updateElement('info', 'doubletap');
        });
        this.gestures.addEventListener('press', (ev) => {
            if (ev.hand && !isDragging) {
                isDragging = true;
                dragStartPosition = self.knight.object.position.clone();
            }
            self.ui.updateElement('info', 'press');
        });
        this.gestures.addEventListener('pressup', (ev) => {
            isDragging = false;
        });

        this.gestures.addEventListener('move', (ev) => {
            if (isDragging) {
                const delta = ev.position.clone().sub(dragStartPosition);
                self.knight.object.position.copy(dragStartPosition.add(delta));
            }
        });

        this.gestures.addEventListener('pan', (ev) => {
            if (ev.initialise !== undefined) {
                self.startPosition = self.knight.object.position.clone();
            } else {
                const pos = self.startPosition.clone().add(ev.delta.multiplyScalar(3));
                self.knight.object.position.copy(pos);
                self.ui.updateElement('info', `pan x:${ev.delta.x.toFixed(3)}, y:${ev.delta.y.toFixed(3)}, x:${ev.delta.z.toFixed(3)}`);
            }
        });
        this.gestures.addEventListener('swipe', (ev) => {
            self.ui.updateElement('info', `swipe ${ev.direction}`);
            if (self.knight.object.visible) {
                self.knight.object.visible = false;
                self.scene.remove(self.knight.object);
            }
        });
        this.gestures.addEventListener('pinch', (ev) => {
            if (ev.initialise !== undefined) {
                self.startScale = self.knight.object.scale.clone();
            } else {
                const scale = self.startScale.clone().multiplyScalar(ev.scale);
                self.knight.object.scale.copy(scale);
                self.ui.updateElement('info', `pinch delta:${ev.delta.toFixed(3)} scale:${ev.scale.toFixed(2)}`);
            }
        });
        
        // ...inside the 'rotate' event listener
	this.gestures.addEventListner('rotate', (ev) => {
        if (ev.initialise !== undefined) {
        self.startQuaternion = self.knight.object.quaternion.clone();
        } else {
        // Construct the rotation quaternion directly
        const rotationQuaternion = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(ev.axis), ev.theta);
         self.knight.object.quaternion.multiply(rotationQuaternion);
         // Update reticle position
         self.reticle.matrixWorldNeedsUpdate = true;
        // Optionally, consider adjusting reticle orientation based on rotation
        self.knight.object.quaternion.copy( self.startQuaternion );
        self.knight.object.rotateY( ev.theta );
        self.ui.updateElement('info', `rotate ${ev.theta.toFixed(3)})
	});

      this.renderer.setAnimationLoop(this.render.bind(this));
     
      

    }

    requestHitTestSource(){
        const self = this;
        
        const session = this.renderer.xr.getSession();

        session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
            
            session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                self.hitTestSource = source;

            } );

        } );

        session.addEventListener( 'end', function () {

            self.hitTestSourceRequested = false;
            self.hitTestSource = null;
            self.referenceSpace = null;

        } );

        this.hitTestSourceRequested = true;

    }
    
    getHitTestResults( frame ){
        const hitTestResults = frame.getHitTestResults( this.hitTestSource );

        if ( hitTestResults.length ) {
            
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[ 0 ];
            const pose = hit.getPose( referenceSpace );

            this.reticle.visible = true;
            this.reticle.matrix.fromArray( pose.transform.matrix );

        } else {

            this.reticle.visible = false;

        }

    }


    handleRotation(axis, theta) {
        if (!this.knight) return;
    
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(axis), theta);
        this.knight.object.quaternion.multiply(rotationQuaternion);
    
        // Update reticle position to match rotation axis
        this.updateReticlePosition(axis, theta); // Call a separate function to handle reticle logic
    
        this.reticle.matrixWorldNeedsUpdate = true;
    }

    updateReticlePosition(axis, theta) {
        // Calculate new reticle position based on axis and theta
        const newPosition = this.knight.object.position.clone(); // Define your logic for calculating the position
        // Adjust position based on axis and angle
const axisLength = 0.5; // Adjust this value to control arrow length
newPosition.add(axis.clone().multiplyScalar(axisLength));

// Rotate the position along the axis by the angle theta
newPosition.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis.clone(), theta));
        this.reticle.position.set(newPosition.x, newPosition.y, newPosition.z);
    }
    

    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render(timestamp, frame) {
        const dt = this.clock.getDelta(); // Calculate delta time once
       
        if (this.renderer.xr.isPresenting) {
            this.getHitTestResults(frame);
          }
        
          this.stats.update();
      
        if (this.renderer.xr.isPresenting) {
          this.gestures.update();
          this.ui.update();
        }
        
        if (this.renderer.xr.isPresenting) {
            this.gestures.update();
            this.ui.update();
          }
      
          if (this.knight !== undefined) this.knight.update(dt);
      
          
       
      
          this.renderer.render(this.scene, this.camera);
      
        }
   }
}
    
      

export { App };


               
