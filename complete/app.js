import * as THREE from '../libs/three/three.module.js'; 
import { OrbitControls } from '../libs/three/jsm/OrbitControls.js'; 
import { GLTFLoader } from '../libs/three/jsm/GLTFLoader.js'; 
import { Stats } from '../libs/stats.module.js'; 
import { CanvasUI } from '../libs/CanvasUI.js'; 
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
        this.loadingBar = new LoadingBar();
        this.assetsPath = '../assets/';
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        this.camera.position.set(0, 1.6, 3);
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
        this.workingVec3 = new THREE.Vector3();
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

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    loadKnight() {
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
                self.knight.object.visible = false;
                self.knight.action = 'Dance';
                const scale = 0.005;
                self.knight.object.scale.set(scale, scale, scale);
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            function (xhr) {
                self.loadingBar.progress = (xhr.loaded / xhr.total);
            },
            function (error) {
                console.error('An error happened', error);
            }
        );
    }

    initScene() {
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial()
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);
        this.loadKnight();
        console.log("Scene initialized successfully.");
    }

    setupXR() {
        this.renderer.xr.enabled = true;


        const onSessionStart = () => {
            console.log('XR session started');
            this.ui.mesh.position.set(0, -0.15, -0.3);
            this.camera.add(this.ui.mesh);
            this.setupHitTesting(); // Call setupHitTesting after the XR session starts
        };
        
        // Define the onSessionEnd function
        const onSessionEnd = () => {
            console.log('XR session ended');
            this.camera.remove(this.ui.mesh);
        };
        
        // Attach the onSessionStart function to the 'sessionstart' event listener
        this.renderer.xr.addEventListener('sessionstart', onSessionStart);
        
        // Attach the onSessionEnd function to the 'sessionend' event listener
        this.renderer.xr.addEventListener('sessionend', onSessionEnd);
        const btn = new ARButton(this.renderer, { 
            onSessionStart: () => this.onSessionStart(), 
            onSessionEnd: () => this.onSessionEnd(), 
            sessionInit: { 
                requiredFeatures: ['hit-test'], 
                optionalFeatures: ['dom-overlay'], 
                domOverlay: { root: document.body } 
            } 
        }); 
        const self = this;
        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        function onSelect() {
            if (self.knight === undefined) return;
            if (self.reticle.visible) {
                if (self.knight.object.visible) {
                    self.workingVec3.setFromMatrixPosition(self.reticle.matrix);
                    self.knight.newPath(self.workingVec3);
                } else {
                    self.knight.object.position.setFromMatrixPosition(self.reticle.matrix);
                    self.knight.object.visible = true;
                }
            }
        }
        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener('select', onSelect);
        this.scene.add(this.controller);
    }

    /*setupHitTesting() {
        const self = this;
        function requestHitTestSource() {
            const session = this.renderer.xr.getSession();
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    this.hitTestSource = source;
                    session.addEventListener('end', () => {
                        this.hitTestSourceRequested = false;
                        this.hitTestSource = null;
                        this.referenceSpace = null;
                    });
                    this.hitTestSourceRequested = true;
                    getHitTestResults();
                });
            });
        }
        function getHitTestResults(frame) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            if (hitTestResults.length) {
                const referenceSpace = this.renderer.xr.getReferenceSpace();
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                this.reticle.visible = true;
                this.reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                this.reticle.visible = false;
            }
            requestHitTestSource();
        }
    }*/

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

    render(timestamp, frame) {
        const dt = this.clock.getDelta();
        if (this.knight) this.knight.update(dt);
        if (frame) {
            if (!this.hitTestSourceRequested) {
                console.log("Requesting hit test source...");
                this.requestHitTestSource();
            }
            if (this.hitTestSource) {
                console.log("Getting hit test results...");
                this.getHitTestResults(frame);
            }
        }
        try {
            this.renderer.render(this.scene, this.camera);
            console.log("Scene rendered successfully.");
        } catch (error) {
            console.error("Error rendering scene:", error);
        }
    }
}

export { App };
