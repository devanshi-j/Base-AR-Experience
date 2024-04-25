XRVisionLabs
Base-AR-Experience
GITHUB PAGES LINK FOR THE FINAL RESULT:
 https://devanshi-j.github.io/Base-AR-Experience/
Overview:
This is an AR experience of the knight model. Created using three.js, webXR API and WebGL. This model is fully interactive, it can perform hit-testing and also Controller Gestures like: scale, rotate, transform, drag and pan.
The three.js code written is based on the OOPS concept, an app is created using the constructor and app class. And different methods are created for performing different functions. 
Specifications:

Firstly, I’ve imported all the supporting files in the js document. To do this I directly downloaded the three.js github repo and then imported. But, it can also be done using the cdn link.
 
Then the four basics of creating an AR scene is * Setting up the scene, * Setting up the camera, * Setting up the scene lighting and * Setting up the renderer.
After that I’ve created different functions to perform different tasks:

setupEnvironment:  This code sets up a realistic lighting environment for the Three.js scene by loading an HDR image, processing it to create an environment map, and assigning it to the scene.

loadKnight: This function loads the knight model, sets up its animation, and prepares it to be displayed and animated within the Three.js scene.




initScene:  This function sets up the basic visual elements of the scene (reticle) and triggers the loading of the main 3D model (knight) with its animations. It also potentially creates the user interface for interacting with the scene.




  Create UI: This function creates a simple text-based UI element using a separate library (CanvasUI) and stores it for future use within your Three.js application.






setupXR: This function enables XR rendering, sets up event listeners for session start and end, creates a button for user interaction, and configures functionalities related to hit testing, user selection, and controller gestures within VR.
                       
requestHitTestSource and getHitTestResults:
 requestHitTestSource sets up the necessary components (reference space and hit test source) to get hit test results.
getHitTestResults retrieves hit test data for each frame and updates the reticle position based on where the user is pointing in VR. This provides visual feedback to the user about their interaction with the real world.










setupControllerGestures: his function sets up listeners for various VR controller gestures and updates the knight model's behavior (movement, scale, rotation) or visibility based on the user's interactions. It also provides visual feedback through the UI element.

                                          

     Renderer:  This function animates the knight (if loaded), manages hit testing in VR                         for user interaction, updates VR gestures and UI, and finally renders the entire scene with the camera view.
                                     

Now, we export { App };
This command exports the app.

GITHUB PAGES LINK FOR THE FINAL RESULT:
 https://devanshi-j.github.io/Base-AR-Experience/






