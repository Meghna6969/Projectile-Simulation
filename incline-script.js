// Changed imports up for more convenience
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false;
let ramp; // Visual 3D Three js object
let rampBody; // CANNON.js physics object

let isSimulationFinished = true; // initially there is no simulation so true
let frozenTime = 0;
let gravity = 9.82;
let mass = 2;
let finalVelocity = 0;

let airResistent = false;
const AIR_DENSITY = 1.225;
const DRAG_COEFFICIENT = 0.47;
let ballMaterial, rampMaterial;

let world;
let physicsBodies = [];
let physicsMeshes = [];

// Ramp settings
const inclineAngle = 0;
const L = 5  //5 meters to initialize
const toggle = document.getElementById('2or3-toggle');
toggle.checked = false;

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

airResistentInput.addEventListener('input', (e) => {
    airResistent = e.target.checked;
    if (airResistent) {
        console.log("Air resistence is turn on");
    }
    else {
        console.log("Air resistence is turn off");
    }
});

function launchSim() {
    console.log("isSimulationFinished =" + isSimulationFinished);
    if (isSimulationFinished) {
        world.time = 0;
        finalVelocity = 0;
        isSimulationFinished = false;
        frozenTime = 0;

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
        const startPos = new THREE.Vector3(0.1, rampHeight + radius + initRampHeight + 0.2, 2);
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: ballMaterial,
            linearDamping: 0.05, //small damping for stability
            angularDamping: 0,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z)
        });
        if (v0 > 0) {
            const vx = v0 * Math.cos(angleInRad);
            const vy = -v0 * Math.sin(angleInRad);
            body.velocity.set(vx, vy, 0);
        }
        body.addEventListener("collide", (e) => {
            if (!isSimulationFinished && e.body.mass === 0 && e.body !== rampBody) {
                isSimulationFinished = true;
                console.log("Collision with the ground disabling setting the issimulationfinished to true")
                finalVelocity = body.velocity.length();
                frozenTime = world.time;
            }
        })
        world.addBody(body);
        physicsBodies.push(body);
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(body.position);

        scene.add(mesh);
        physicsMeshes.push(mesh);
    }
    else {
        // do nothing
        // grey out the start simulation button
        console.log("AHAHAHAH IN THE ELSE HERE");
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
    const groundBody = new CANNON.Body({ mass: 0 }); // static
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

    if (rampBody) {
        world.removeBody(rampBody);
    }
    const vertices = geometry.attributes.position.array;
    const indices = [];
    for (let i = 0; i < vertices.length / 3; i++) {
        indices.push(i);
    }
    const cannonShape = new CANNON.Trimesh(vertices, indices);
    rampBody = new CANNON.Body({ mass: 0, material: rampMaterial });
    rampBody.addShape(cannonShape);

    rampBody.position.set(ramp.position.x, ramp.position.y, ramp.position.z);
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
    if (!airResistent) return;
    const velocity = body.velocity;
    const speed = velocity.length();

    if (speed > 0.01) {
        const radius = body.shapes[0].radius;
        const area = Math.PI * radius * radius;
        const dragMagnitude = 0.5 * AIR_DENSITY * speed * speed * DRAG_COEFFICIENT * area;
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