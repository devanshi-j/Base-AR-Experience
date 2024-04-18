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
        // Initialize XR button
        const btn = new ARButton(this.renderer, { 
            onSessionStart: () => this.onSessionStart(), 
            onSessionEnd: () => this.onSessionEnd(), 
            sessionInit: { 
                requiredFeatures: ['hit-test'], 
                optionalFeatures: ['dom-overlay'], 
                domOverlay: { root: document.body } 
            } 
        }); 
        
        // Check if hit testing feature is supported by the device
        if (!navigator.xr || !navigator.xr.isSessionSupported || !navigator.xr.isSessionSupported('immersive-ar')) {
            console.error('AR hit testing is not supported on this device/browser.');
            return;
        }
    
        console.log('AR hit testing is supported.');
    
        //this.setupHitTesting();
        this.setupControllerGestures();
    }
    

    setupHitTesting() {
        const self = this;

        let hitTestSourceRequested = false;
        let hitTestSource = null;
        let referenceSpace = null;

        const requestHitTestSource = () => {
            const session = self.renderer.xr.getSession();

            if (session) {
                session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                    self.referenceSpace = referenceSpace;
                    session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                        self.hitTestSource = source;
                        hitTestSourceRequested = true;
                    });
                });

                session.addEventListener('end', function () {
                    hitTestSourceRequested = false;
                    hitTestSource = null;
                    referenceSpace = null;
                });
            } else {
                console.warn('XR session not found. Hit testing unavailable.');
            }
        }

        const getHitTestResults = (frame) => {
            if (!hitTestSourceRequested || !hitTestSource) return;

            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                self.reticle.visible = true;
                self.reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                self.reticle.visible = false;
            }
        }

        // Call requestHitTestSource when the XR session starts
        self.renderer.xr.addEventListener('sessionstart', requestHitTestSource);

        // Update hit test results on each rendered frame
        self.renderer.xr.addEventListener('render', getHitTestResults);
    }

    setupControllerGestures() {
        this.gestures = new ControllerGestures(this.renderer);
            
        const self = this;

        const onSelect = () => { 
            console.log('Controller select event triggered'); 
            if (this.knight === undefined) return; 

            if (this.reticle.visible) { 
                if (this.knight.object.visible) { 
                    this.workingVec3.setFromMatrixPosition(this.reticle.matrix); 
                    this.knight.newPath(this.workingVec3); 
                } else { 
                    this.knight.object.position.setFromMatrixPosition(this.reticle.matrix); 
                    this.knight.object.visible = true; 
                } 
            } 
        }; 

        this.controller = this.renderer.xr.getController( 0 ); 
        this.controller.addEventListener( 'select', onSelect ); 
        this.scene.add( this.controller ); 

        this.gestures.addEventListener('tap', (ev) => {
            this.ui.updateElement('info', 'tap');
            if (!this.knight.object.visible) {
                this.knight.object.visible = true;
                this.knight.object.position.set(0, -0.3, -0.5).add(ev.position);
                this.scene.add(this.knight.object);
            }
        });

        this.gestures.addEventListener('doubletap', (ev) => {
            self.ui.updateElement('info', 'doubletap');
        });

        this.gestures.addEventListener('press', (ev) => {
            self.ui.updateElement('info', 'press');
        });

        this.gestures.addEventListener('press', (ev) => {
            if (!self.knight.object.visible) return;

            self.isDragging = true;
            self.dragStartPosition.copy(self.knight.object.position);
            self.ui.updateElement('info', 'Drag started');
        });

        this.gestures.addEventListener('pan', (ev) => {
            if (!self.isDragging) return;

            if (ev.initialise !== undefined) {
                self.startPosition = self.knight.object.position.clone();
            } else {
                const dragSensitivity = 3;
                const delta = ev.delta.multiplyScalar(dragSensitivity);
                const newPosition = self.startPosition.clone().add(delta);

                self.knight.object.position.copy(newPosition);
                self.ui.updateElement('info', `Dragging: x:${delta.x.toFixed(3)}, y:${delta.y.toFixed(3)}, z:${delta.z.toFixed(3)}`);
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

        this.gestures.addEventListener('rotate', (ev) => {
            if (ev.initialise !== undefined) {
                self.startQuaternion = self.knight.object.quaternion.clone();
            } else {
                self.knight.object.quaternion.copy(self.startQuaternion);
                self.knight.object.rotateY(ev.theta);
                self.ui.updateElement('info', `rotate ${ev.theta.toFixed(3)}`);
            }
        });
    }

    render(timestamp, frame) {
        const dt = this.clock.getDelta();
        this.stats.update();

        if (this.renderer.xr.isPresenting) {
            this.gestures.update();
            this.ui.update();
        }

        if (this.knight !== undefined) {
            this.knight.update(dt);
        }

        try {
            this.renderer.render(this.scene, this.camera);
    
            if (frame) {
                if (this.hitTestSourceRequested === false) {
                    this.requestHitTestSource();
                }
    
                if (this.hitTestSource) {
                    this.getHitTestResults(frame);
                }
            }
        } catch (error) {
            console.error("Error during rendering:", error);
        }
    } 
}

export { App };
