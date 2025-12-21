import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const { ExtrudeGeometry, Shape, Vector2 } = THREE;

let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false;
let gridHelper;

let gravity = 9.82;
let mass = 2;

let airResistent = false;
const AIR_DENSITY = 1.225;
const DRAG_COEFFICIENT = 0.47;

let world;
let physicsBodies = [];
let physicsMeshes = [];

// Ramp settings
const inclineAngle = 0;
const L = 5  //5 meters to initialize
const H = Math.tan(inclineAngle) * L;
const W = 8;
const toggle = document.getElementById('2or3-toggle');
toggle.checked = true;

const velocityInput = document.getElementById('initial-velocity');
const velocitySlider = document.getElementById('velocity-slider');
const rampAngleInput = document.getElementById('ramp-angle');
const rampAngleSlider = document.getElementById('ramp-slider');
const kineticFriction = document.getElementById('ramp-friction');
const kineticFrictionSlider = document.getElementById('friction-slider');
const massInput = document.getElementById('mass');
const massSlider = document.getElementById('mass-slider');
const airResistentInput = document.getElementById('airResistence');
const rampDistanceInput = document.getElementById('ramp-distance');
const rampDistanceSlider = document.getElementById('distance-slider');

const simulationButton = document.getElementById('sim-btn');
simulationButton.addEventListener('click', launchSim);



velocitySlider.addEventListener('input', (e) => {
    velocityInput.value = e.target.value;
});
velocityInput.addEventListener('input', (e) => {
    velocitySlider.value = e.target.value;
});

rampAngleSlider.addEventListener('input', (e) => {
    rampAngleInput.value = e.target.value;
});
rampAngleInput.addEventListener('input', (e) => {
    rampAngleSlider.value = e.target.value;
});

rampDistanceSlider.addEventListener('input', (e) => {
    rampDistanceInput.value = e.target.value;
});
rampDistanceInput.addEventListener('input', (e) => {
    rampDistanceSlider.value = e.target.value;
});


kineticFrictionSlider.addEventListener('input', (e) => {
    kineticFriction.value = e.target.value;
});
kineticFriction.addEventListener('input', (e) => {
    kineticFrictionSlider.value = e.target.value;
});

massSlider.addEventListener('input', (e) => {
    massInput.value = e.target.value;
});
massInput.addEventListener('input', (e) => {
    massSlider.value = e.target.value;
});

airResistentInput.addEventListener('input', (e) => {
    airResistent = e.target.checked;
    if (airResistent) {
        enableAirResistence();
        console.log("Air resistence is turn on");
    }
    else {
        console.log("Air resistence is turn off");
    }
});

function launchSim() {

}
function setupPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -gravity, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 }); // static
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
}

function setupThreeScene(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140f2e);

    const aspect = window.innerWidth / innerHeight;
    const d = 25;
   
    // 3D camera
    perspectiveCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    perspectiveCamera.position.set(20, 10, 20);

    // 2D Camera (Orthographic Camera)
    orthographicCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
    orthographicCamera.position.set(10, 10, 30);

    //Start with 3D view
    camera = perspectiveCamera;

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
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

        if (isCurr2D) {
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
            camera.position.set(40, 5, 20);
            controls.target.set(10, 10, 0);
        } else {
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
        if (e.target.checked) {
            controls.enableRotate = true;
            camera.position.set(15, 15, 25);
            controls.target.set(5, 5, 10);
        } else {
            controls.enableRotate = false;
            camera.position.set(10, 20, 30);
            controls.target.set(10, 20, 0);
        }
        controls.update();
    });

    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        perspectiveCamera.aspect = aspect;
        perspectiveCamera.updateProjectionMatrix();

        // Orthographic camera
        const d = 25;
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

function createBackground(){
    const boxSize = 40;
    const axisThickness = 0.1;
    const axisLength = boxSize * 1.2;

    const groundGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
    const groundMaterial = new THREE.MeshBasicMaterial({visible: false});
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(ground);

    const createAxis = (color, rotation, position) => {
        const geometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength, 8);
        const material = new THREE.MeshBasicMaterial({color:color});
        const cylinder = new THREE.Mesh(geometry, material);

        cylinder.rotation.set(rotation.x, rotation.y, rotation.z);
        cylinder.position.set(position.x, position.y, position.z);
        return cylinder;
    };
    const xAxis = createAxis(0xFA003F, {x: 0, y: 0, z: Math.PI / 2}, {x:axisLength / 2, y:0, z:0});
    scene.add(xAxis);
     const yAxis = createAxis(0x9Acd32, {x:0, y:0, z: 0}, {x:0, y:axisLength / 2, z:0});
    scene.add(yAxis);

    const zAxis = createAxis(0x007ff, {x:Math.PI / 2, y:0, z: 0}, {x:0, y:0, z:axisLength / 2});
    scene.add(zAxis);

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
    
    });
}
function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}


setupPhysics();
setupThreeScene(); 
setupLights();
createBackground();

var A = new THREE.Vector2(0, 0);
var B = new THREE.Vector2(30, 10);
var C = new THREE.Vector2(20, 50);

const triangleShape = new Shape([A, B, C]);
const height = 4;
const extrudeSettings = {
    depth: height,
    bevelEnabled: false
};
const geometry = new ExtrudeGeometry(triangleShape, extrudeSettings);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
const prism = new THREE.Mesh(geometry, material);
scene.add(prism);