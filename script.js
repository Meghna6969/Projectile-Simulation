let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false;
let gridHelper;

const toggle = document.getElementById('2or3-toggle');
toggle.checked = true;

function createBackground(){
    const boxSize = 20;
    const axisThickness = 0.1;
    const axisLength = boxSize * 1.2;


    const groundGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
    const groundMaterial = new THREE.MeshBasicMaterial({visible: false});
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(ground);
    
    // Axes but much better looking than whatever three js has
    const createAxis = (color, rotation, position) => {
        const geometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength, 8);
        const material = new THREE.MeshBasicMaterial({color:color});
        const cylinder = new THREE.Mesh(geometry, material);

        cylinder.rotation.set(rotation.x, rotation.y, rotation.z);
        cylinder.position.set(position.x, position.y, position.z);
        return cylinder;
    };
    const xAxis = createAxis(0xFA003F, {x:0, y:0, z: Math.PI / 2}, {x:axisLength / 2, y:0, z:0});
    scene.add(xAxis);

    const yAxis = createAxis(0x9Acd32, {x:0, y:0, z: 0}, {x:0, y:axisLength / 2, z:0});
    scene.add(yAxis);

    const zAxis = createAxis(0x007ff, {x:Math.PI / 2, y:0, z: 0}, {x:0, y:0, z:axisLength / 2});
    scene.add(zAxis);

    /** I dont know why I dont want to remove this, so yea just leave it here if I need it 
     * some other time 
     * 
     * const planeGeo = new THREE.PlaneGeometry(boxSize, 20);
    const planeMat = new THREE.MeshBasicMaterial({color: 0x434081, side: THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(plane);
     */
    

    // Initializing the gridHelper for the 3d view
    const gridHelper = new THREE.GridHelper(boxSize, 20, 0xa39ce3, 0xa39ce3);
    gridHelper.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(gridHelper);

    // Toggle switch between 3d and 2D
    const toggle = document.getElementById('2or3-toggle');
    toggle.addEventListener('change', (e) => {
        isCurr2D = e.target.checked === false;
        if(isCurr2D){
            gridHelper.rotation.x = Math.PI / 2;
            gridHelper.position.set(boxSize / 2, boxSize / 2, 0);
        }
        else{
            gridHelper.rotation.x = 0;
            gridHelper.position.set(boxSize / 2, 0, boxSize / 2);
        }
    
    })
}

function setupThreeScene(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140f2e);

    const aspect = window.innerWidth / innerHeight;
    const d = 15;
   
    // 3D camera
    perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    perspectiveCamera.position.set(15, 15, 15);

    // 2D Camera (Orthographic Camera)
    orthographicCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
    orthographicCamera.position.set(10, 10, 30);

    //Start with 3D view
    camera = perspectiveCamera;

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Initialize controls for 3d views
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.panSpeed = 0.8;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.target.set(10, 5, 10);
    controls.screenSpacePanning = true;
    controls.enableKeys = false;

    const toggle = document.getElementById('2or3-toggle');
    toggle.addEventListener('change', (e) => {
        isCurr2D = e.target.checked === false;

        if(isCurr2D){
            camera = orthographicCamera;
            controls.object = orthographicCamera;
            controls.enableRotate = false;
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.panSpeed = 0.8;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.screenSpacePanning = true;
    controls.enableKeys = false;
            camera.position.set(10, 10, 30);
            controls.target.set(10, 10, 0);
        }else{
            camera = perspectiveCamera;
            controls.object = perspectiveCamera;
            controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.panSpeed = 0.8;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.target.set(10, 5, 10);
    controls.screenSpacePanning = true;
    controls.enableKeys = false;
        }
    });

    toggle.addEventListener('change', (e) => {
        if(e.target.checked){
            controls.enableRotate = true;

            camera.position.set(15, 15, 15);
            controls.target.set(10, 5, 10);
        }else{
            controls.enableRotate = false;
            camera.position.set(10, 10, 30);
            controls.target.set(10, 10, 0);
        }
        controls.update();
    });

    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        perspectiveCamera.aspect = aspect;
        perspectiveCamera.updateProjectionMatrix();

        // Orthographic camera
        const d = 15;
        orthographicCamera.left = -d * aspect;
        orthographicCamera.right = d * aspect;
        orthographicCamera.top = d;
        orthographicCamera.bottom = -d;
        orthographicCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    animate();
}
function setupLights(){
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, 10, -10);
    scene.add(directionalLight2);
}
function interactiveObjects(){
    const loader = new THREE.GLTFLoader();
    loader.load('cannon.glb', function(gltf){
        cannonModel = gltf.scene;
        cannonModel.position.set(0, 1, 0);
        cannonModel.scale.set(1, 1, 1);
        cannonModel.rotation.y = Math.PI / 4;
        cannonModel.traverse((child) => {
            if(child.isMesh){
                child.material.color.set(0xffffff);
            }
        });

        scene.add(cannonModel);
    });
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

setupThreeScene();
createBackground();
interactiveObjects();
setupLights();