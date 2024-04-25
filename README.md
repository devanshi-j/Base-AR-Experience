XRVisionLabs
Base-AR-Experience
GITHUB PAGES LINK FOR THE FINAL RESULT:
 https://devanshi-j.github.io/Base-AR-Experience/
Overview:
This is an AR experience of the knight model. Created using three.js, webXR API and WebGL. This model is fully interactive, it can perform hit-testing and also Controller Gestures like: scale, rotate, transform, drag and pan.
The three.js code written is based on the OOPS concept, an app is created using the constructor and app class. And different methods are created for performing different functions. 
Specifications:

Firstly, I’ve imported all the supporting files in the js document. To do this I directly downloaded the three.js github repo and then imported. But, it can also be done using the cdn link.

 ![Screenshot 2024-04-24 033118](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/52ce23dc-97b3-4762-83f9-2ed5cffeb23e)

Then the four basics of creating an AR scene is * Setting up the scene, * Setting up the camera, * Setting up the scene lighting and * Setting up the renderer.
After that I’ve created different functions to perform different tasks:
![Screenshot 2024-04-25 114227](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/bf00bcb6-d985-4c6a-a910-54cb3650c1b5)


setupEnvironment:  This code sets up a realistic lighting environment for the Three.js scene by loading an HDR image, processing it to create an environment map, and assigning it to the scene.

![Screenshot 2024-04-25 114640](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/aba8a0ca-dc20-47e5-aaac-7b3aa94ff4b8)


loadKnight: This function loads the knight model, sets up its animation, and prepares it to be displayed and animated within the Three.js scene.

![Screenshot 2024-04-25 115110](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/9134bd16-f423-4f7f-9be2-e1dd7096019d)


initScene:  This function sets up the basic visual elements of the scene (reticle) and triggers the loading of the main 3D model (knight) with its animations. It also potentially creates the user interface for interacting with the scene.

![Screenshot 2024-04-25 120041](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/0111f880-e0a8-4d92-b2d2-a81788d9f1b0)

 Create UI: This function creates a simple text-based UI element using a separate library (CanvasUI) and stores it for future use within your Three.js application.

![Screenshot 2024-04-25 120302](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/3403e0b3-e99b-45c4-bc88-52e9090130b1)


setupXR: This function enables XR rendering, sets up event listeners for session start and end, creates a button for user interaction, and configures functionalities related to hit testing, user selection, and controller gestures within VR.

![Screenshot 2024-04-25 120613](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/756b45a4-d79d-4702-92b2-51bd0abeee23)

                       
requestHitTestSource and getHitTestResults:
 requestHitTestSource sets up the necessary components (reference space and hit test source) to get hit test results.
getHitTestResults retrieves hit test data for each frame and updates the reticle position based on where the user is pointing in VR. This provides visual feedback to the user about their interaction with the real world.

![Screenshot 2024-04-25 121235](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/ce68263b-1ef2-4151-b704-c71bc0b56c84)


![Screenshot 2024-04-25 121309](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/c2473b71-d1fa-4fb9-9444-a03927df949d)


setupControllerGestures: his function sets up listeners for various VR controller gestures and updates the knight model's behavior (movement, scale, rotation) or visibility based on the user's interactions. It also provides visual feedback through the UI element.
![Screenshot 2024-04-25 121601](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/69cf188e-48a8-4896-839f-0a51f9d91133)

                                          
 Renderer:  This function animates the knight (if loaded), manages hit testing in AR  for user interaction, updates AR gestures and UI, and finally renders the entire scene with the camera view.
![Screenshot 2024-04-25 122057](https://github.com/devanshi-j/Base-AR-Experience/assets/89416589/99d9e9b6-5f29-4176-b31d-0b0b2bad3118)
               

Now, we export { App };
This command exports the app.

GITHUB PAGES LINK FOR THE FINAL RESULT:
 https://devanshi-j.github.io/Base-AR-Experience/






