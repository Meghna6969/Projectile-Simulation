/**
 * INCLINE BODY KINEMATICS
 * Libraries: THREE.js + CANNON.js (Rigid body Physics)
 */

// Changed imports up for more convenience
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false; // Keeps track of the view
let ramp; // Visual 3D Three js object
let rampBody; // CANNON.js physics object

const SHAPE_PROPERTIES = {
    sphere: {cd: 0.47, areaFactor: (r) => Math.PI * r * r},
    cube: {cd:1.05, areaFactor: (r) => 4 * r * r},
    cylinder: {cd: 0.82, areaFactor: (r) => 2 * r * r}
};

let isSimulationFinished = true; // initially there is no simulation so true
let frozenTime = 0; // Keeps track of time when the object leaves the ramp
let gravity = 9.82; // Inital and final gravity; Cant be changed with the sliders 
let finalVelocity = 0; // Keeps track of final velocity of the object

// Physics variables with air resistance
let airResistent = false;
const AIR_DENSITY = 1.225;
const DRAG_COEFFICIENT = 0.47;
let ballMaterial, rampMaterial;

// CANNON.js objects
let world;
let physicsBodies = [];
let physicsMeshes = [];
// Ramp settings
const toggle = document.getElementById('2or3-toggle');
toggle.checked = false; // Initally 2d

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
const rampHeightInput = document.getElementById('initial-height');
const rampHeightSlider = document.getElementById('height-slider');
const simulationButton = document.getElementById('sim-btn');

// Binding all the methods and sliders to the inputs so they have the same values
simulationButton.addEventListener('click', launchSim);
rampHeightInput.addEventListener('input', (e) => {
    rampHeightSlider.value = e.target.value;
    updateRamp();
});
rampHeightSlider.addEventListener('input', (e) => {
    rampHeightInput.value = e.target.value;
    updateRamp();
});
velocitySlider.addEventListener('input', (e) => {
    velocityInput.value = e.target.value;
});
velocityInput.addEventListener('input', (e) => {
    velocitySlider.value = e.target.value;
});
rampAngleSlider.addEventListener('input', (e) => {
    rampAngleInput.value = e.target.value;
    updateRamp();
});
rampAngleInput.addEventListener('input', (e) => {
    rampAngleSlider.value = e.target.value;
    updateRamp();
});
rampDistanceSlider.addEventListener('input', (e) => {
    rampDistanceInput.value = e.target.value;
    updateRamp();
});
rampDistanceInput.addEventListener('input', (e) => {
    rampDistanceSlider.value = e.target.value;
    updateRamp();
});
kineticFrictionSlider.addEventListener('input', (e) => {
    kineticFriction.value = e.target.value;
    updateRamp();
});
kineticFriction.addEventListener('input', (e) => {
    kineticFrictionSlider.value = e.target.value;
    updateRamp();
});
massSlider.addEventListener('input', (e) => {
    massInput.value = e.target.value;
});
massInput.addEventListener('input', (e) => {
    massSlider.value = e.target.value;
});

// Console logs so that users can make sure if air resistence is on if nothing changes visually
airResistentInput.addEventListener('input', (e) => {
    airResistent = e.target.checked;
    if (airResistent) {
        console.log("Air resistence is turn on");
    }
    else {
        console.log("Air resistence is turn off");
    }
});

// Launch Physics
function launchSim() {
    
    if (isSimulationFinished) {
        // Current shape
        const shapeDropdown = document.getElementById('shape');
        const selectedShape = shapeDropdown.value;
        world.time = 0;
        finalVelocity = 0;
        isSimulationFinished = false;
        frozenTime = 0;

        // All object variables
        const v0 = parseFloat(velocityInput.value);
        const angle = parseFloat(rampAngleInput.value);
        const initRampHeight = parseFloat(rampHeightInput.value);
        const angleInRad = angle * (Math.PI / 180);
        const distance = parseFloat(rampDistanceInput.value);
        const rampHeight = Math.sin(angleInRad) * distance;
        const mass = parseFloat(massInput.value);
        const mu = parseFloat(kineticFriction.value);

        if (world.contactmaterials[0]) {
            world.contactmaterials[0].friction = mu;
        }
        // Make the projectile
        const radius = 0.5 * mass * 0.1;
        const startPos = new THREE.Vector3(0.5, rampHeight + radius + initRampHeight + 0.2, 2);
        let cannonShape;
        switch(selectedShape){
            case 'cube':
                console.log(selectedShape);
                cannonShape = new CANNON.Box(new CANNON.Vec3(radius, radius, radius));
                break;
            case 'cylinder':
                console.log(selectedShape);
                cannonShape = new CANNON.Cylinder(radius, radius, radius * 2, 16);
                break;
            default:
                console.log(selectedShape);
                cannonShape = new CANNON.Sphere(radius);
        }
        const body = new CANNON.Body({
            mass: mass,
            shape: cannonShape,
            material: ballMaterial,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z),
        });
        if(selectedShape == 'cylinder'){
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        }

        body.userData = {shapeType: selectedShape};
        if (v0 > 0) {
            const vx = v0 * Math.cos(angleInRad);
            const vy = -v0 * Math.sin(angleInRad);
            body.velocity.set(vx, vy, 0);
        }
        body.addEventListener("collide", (e) => {
            if (!isSimulationFinished && e.body.mass === 0 && e.body !== rampBody && body.position.y < 1) {
                isSimulationFinished = true;
                console.log("Collision with the ground disabling setting the issimulationfinished to true")
                finalVelocity = body.velocity.length();
                frozenTime = world.time;
            }
        })
        world.addBody(body);
        physicsBodies.push(body);

        let geometry;
        switch(selectedShape){
            case 'cube':
                geometry = new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(radius, radius, radius * 2, 32);
                break;
            default:
                geometry = new THREE.SphereGeometry(radius, 32, 32);
        }
        const material = new THREE.MeshStandardMaterial({color: 0xffff00 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        physicsMeshes.push(mesh);
    }
    else {
        // do nothing
        // grey out the start simulation button
        console.log("AHAHAHAH THE PROGRAM IS IN THE ELSE STATEMENT");
        simulationButton.disabled = true;
    }

}
function setupPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -gravity, 0);
    ballMaterial = new CANNON.Material("ballMaterial");
    rampMaterial = new CANNON.Material("rampMaterial");

    const contactMaterial = new CANNON.ContactMaterial(ballMaterial, rampMaterial, {
        friction: 0.1, // Initially set to 0.1 will change it dynamically
        restitution: 0.1, // Basically no bounciness
        frictionEquationStiffness: 1e6,
        frictionEquationRelaxation: 3
    });
    world.addContactMaterial(contactMaterial);

    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
}

function setupThreeScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140f2e);

    const aspect = window.innerWidth / innerHeight;
    const d = 25;

    // 3D camera
    perspectiveCamera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);

    // 2D Camera (Orthographic Camera)
    orthographicCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);

    //Start with 2D view
    camera = orthographicCamera;

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    controls.enableRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.panSpeed = 0.8;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.screenSpacePanning = true;
    controls.enableKeys = false;
    camera.position.set(10, 20, 30);
    controls.target.set(10, 20, 0);

    controls.update();

    const toggle = document.getElementById('2or3-toggle');
    toggle.addEventListener('change', (e) => {
        const is3D = e.target.checked;
        isCurr2D = !is3D;

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
            camera.position.set(10, 20, 30);
            controls.target.set(10, 20, 0);
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
            controls.enableRotate = true;
            camera.position.set(15, 15, 25);
            controls.target.set(5, 5, 10);
            controls.screenSpacePanning = true;
            controls.enableKeys = false;
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
function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight2.position.set(-10, 10, -10);
    scene.add(directionalLight2);
}

function createBackground() {
    const boxSize = 40;
    const axisThickness = 0.1;
    const axisLength = boxSize * 1.2;

    const groundGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
    const groundMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(ground);

    const createAxis = (color, rotation, position) => {
        const geometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const cylinder = new THREE.Mesh(geometry, material);

        cylinder.rotation.set(rotation.x, rotation.y, rotation.z);
        cylinder.position.set(position.x, position.y, position.z);
        return cylinder;
    };
    const xAxis = createAxis(0xFA003F, { x: 0, y: 0, z: Math.PI / 2 }, { x: axisLength / 2, y: 0, z: 0 });
    scene.add(xAxis);
    const yAxis = createAxis(0x9Acd32, { x: 0, y: 0, z: 0 }, { x: 0, y: axisLength / 2, z: 0 });
    scene.add(yAxis);

    const zAxis = createAxis(0x007ff, { x: Math.PI / 2, y: 0, z: 0 }, { x: 0, y: 0, z: axisLength / 2 });
    scene.add(zAxis);

    // Initializing the gridHelper for the 2d view
    const gridHelper = new THREE.GridHelper(boxSize, 20, 0xa39ce3, 0xa39ce3);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(boxSize / 2, boxSize / 2, 0);
    scene.add(gridHelper);

    // Toggle switch between 3d and 2D
    const toggle = document.getElementById('2or3-toggle');
    toggle.addEventListener('change', (e) => {
        isCurr2D = e.target.checked === false;
        if (isCurr2D) {
            gridHelper.rotation.x = Math.PI / 2;
            gridHelper.position.set(boxSize / 2, boxSize / 2, 0);
        }
        else {
            gridHelper.rotation.x = 0;
            gridHelper.position.set(boxSize / 2, 0, boxSize / 2);
        }

    });
}
function updateRamp() {
    const L = parseFloat(rampDistanceInput.value) || 5;
    const initHeight = parseFloat(rampHeightInput.value);
    const angleDeg = parseFloat(rampAngleInput.value) || 30;
    const angleRad = (angleDeg) * (Math.PI / 180);

    const rampBase = Math.cos(angleRad) * L;
    const rampHeight = Math.sin(angleRad) * L;
    const rampWidth = 4;

    // THREE.js visuals
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(rampBase, 0);
    shape.lineTo(0, rampHeight);
    shape.closePath();

    const extrudeSettings = { depth: rampWidth, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    if (ramp) {
        scene.remove(ramp);
        ramp.geometry.dispose();
    }
    const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
    ramp = new THREE.Mesh(geometry, material);
    ramp.position.set(0, initHeight, 0);
    scene.add(ramp);

    // Now for the physics part with CANNON.js
    if (rampBody) {
        world.removeBody(rampBody);
    }

    // Sad part apparently trimeshes have problems with collions of anything except sphere
    // doing convex polyhedren
    /*const vertices = [
        new CANNON.Vec3(0, 0, 0),              // v0
        new CANNON.Vec3(rampBase, 0, 0),       // v1
        new CANNON.Vec3(0, rampHeight, 0),     // v2
        new CANNON.Vec3(0, 0, rampWidth),      // v3
        new CANNON.Vec3(rampBase, 0, rampWidth),   // v4
        new CANNON.Vec3(0, rampHeight, rampWidth)  // v5
    ];*/
    //const vertices = geometry.attributes.position.array;
    //const indices = [];
    /*for (let i = 0; i < vertices.length / 3; i++) {
        indices.push(i);
    }
   const faces = [
    [0, 2, 1],
    [3, 4, 5],
    [0, 1, 4, 3],
    [0, 3, 5, 2],
    [1, 2, 5, 4]
   ];*/
    //const cannonShape = new CANNON.Trimesh(vertices, indices);
    const boxLength = L;
    const boxThickness = 0.2;
    const boxWidth = rampWidth;

    const cannonShape = new CANNON.Box(new CANNON.Vec3(boxLength / 2, boxThickness / 2, boxWidth / 2));
    rampBody = new CANNON.Body({ mass: 0, material: rampMaterial });
    rampBody.addShape(cannonShape);

    const centerX = rampBase / 2;
    const centerY = rampHeight / 2 + initHeight;
    const centerZ = rampWidth / 2;
    rampBody.position.set(centerX, centerY - 0.1, centerZ);

    rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -angleRad);
    //rampBody.position.set(0, initHeight, 0);
    world.addBody(rampBody);

}
function updatePhysics() {
    physicsBodies.forEach(body => {
        if (body.mass > 0) {
            applyDragForce(body);
        }
    });

    world.step(1 / 60);

    for (let i = 0; i < physicsBodies.length; i++) {
        physicsMeshes[i].position.copy(physicsBodies[i].position);
        physicsMeshes[i].quaternion.copy(physicsBodies[i].quaternion);

        if (!isSimulationFinished) {
            simulationButton.disabled = true;
            rampDistanceInput.disabled = true;
            rampDistanceSlider.disabled = true;
            kineticFriction.disabled = true;
            kineticFrictionSlider.disabled = true;
            rampHeightInput.disabled = true;
            rampHeightSlider.disabled = true;
            rampAngleInput.disabled = true;
            rampAngleSlider.disabled = true;
        }
        else {
            simulationButton.disabled = false;
            rampDistanceInput.disabled = false;
            rampDistanceSlider.disabled = false;
            kineticFriction.disabled = false;
            kineticFrictionSlider.disabled = false;
            rampHeightInput.disabled = false;
            rampHeightSlider.disabled = false;
            rampAngleInput.disabled = false;
            rampAngleSlider.disabled = false;
        }



        if (i === physicsBodies.length - 1) {
            const body = physicsBodies[i];
            const currentTime = isSimulationFinished ? frozenTime.toFixed(2) : world.time.toFixed(2);
            const displayVel = isSimulationFinished ? finalVelocity : body.velocity.length();

            // Theoritical Friction
            const angleRad = parseFloat(rampAngleInput.value) * (Math.PI / 180);
            const mu = parseFloat(kineticFriction.value);
            const frictionForce = (mu * body.mass * gravity * Math.cos(angleRad)).toFixed(2);

            document.getElementById('current-time').innerText = `${currentTime} s`;
            document.getElementById('final-velocity').innerText = `${displayVel.toFixed(2)} m/s`;
            document.getElementById('friction-detail').innerHTML = `F<sub>k</sub>= ${frictionForce} N`;
        }
    }
}
function applyDragForce(body) {
    if (!airResistent || !body.userData) return;
    const velocity = body.velocity;
    const speed = velocity.length();

    if (speed > 0.01) {
        const shapeType = body.userData.shapeType;
        const props = SHAPE_PROPERTIES[shapeType];
        const r = 0.5 * body.mass * 0.1;
        const area = props.areaFactor(r);
        const cd = props.cd;

        const dragMagnitude = 0.5 * AIR_DENSITY * speed * speed * cd * area;
        const dragForce = velocity.unit().scale(-dragMagnitude);
        body.applyForce(dragForce, body.position);

    }
}
function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    controls.update();
    renderer.render(scene, camera);
}


setupPhysics();
setupThreeScene();
setupLights();
createBackground();
updateRamp();
isSimulationFinished = true;