import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false;
let lastTime = performance.now();

let isSimulating = false;
let gravity = 9.82;
let groundSize;
let simulationTime = 0;

let shipModel;
let water;

// Useful
let boatVector, riverVector, resVector;

let shipVelocityVector = new THREE.Vector3();
let riverVelocityVector = new THREE.Vector3();
let world;

const toggle = document.getElementById('2or3-toggle');
toggle.checked = false;

const aimAngleInput = document.getElementById("aim-angle");
const aimAngleSlider = document.getElementById("aim-angle-slider");
const velocityRiverInput = document.getElementById("velocity-river");
const velocityRiverSlider = document.getElementById("velocity-river-slider");
const shipVelocityInput = document.getElementById("velocity-ship");
const shipVelocitySlider = document.getElementById("velocity-ship-slider");
const launchSim = document.getElementById("sim-btn");
const resetSim = document.getElementById("reset-btn");

aimAngleInput.addEventListener('input', (e) => {
    aimAngleSlider.value = e.target.value;
    updateShip();
});
aimAngleSlider.addEventListener('input', (e) => {
    aimAngleInput.value = e.target.value;
    updateShip();
});
velocityRiverInput.addEventListener('input', (e) => {
    velocityRiverSlider.value = e.target.value;
});
velocityRiverSlider.addEventListener('input', (e) => {
    velocityRiverInput.value = e.target.value;
});
shipVelocityInput.addEventListener('input', (e) => {
    shipVelocitySlider.value = e.target.value;
});
shipVelocitySlider.addEventListener('input', (e) => {
    shipVelocityInput.value = e.target.value;
});
launchSim.addEventListener('click', startSimulation);
resetSim.addEventListener('click', resetSimulation);

function setupPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -gravity, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
}
function createBackground() {
    groundSize = 40;
    const axisThickness = 0.1;
    const axisLength = groundSize * 1.2;

    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(groundSize / 2, 0, groundSize / 2);
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

    const yAxis = createAxis(0x9Ad32, { x: 0, y: 0, z: 0 }, { x: 0, y: axisLength / 2, z: 0 });
    scene.add(yAxis);

    const zAxis = createAxis(0x007ff, { x: Math.PI / 2, y: 0, z: 0 }, { x: 0, y: 0, z: axisLength / 2 });
    scene.add(zAxis);

    const gridHelper = new THREE.GridHelper(groundSize, 20, 0xffffff, 0xffffff);
    gridHelper.position.set(groundSize / 2, 0.2, groundSize / 2);
    scene.add(gridHelper);
    const waterGeometry = new THREE.BoxGeometry(40, 120, 10, 60, 60, 1);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x0E87CC,
        emissive: 0x001a33,
        emissiveIntensity: 0.2,
        roughness: 0.9,
        metalness: 0.2,
        flatShading: false,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });

    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(groundSize / 2, -5, groundSize / 2);
    scene.add(water);
    const positions = water.geometry.attributes.position.array;
    water.userData.originalPositions = new Float32Array(positions);

    const foamGeometry = new THREE.PlaneGeometry(30, 120, 60, 60);
    const foamMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        roughness: 1,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    const foam = new THREE.Mesh(foamGeometry, foamMaterial);
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(groundSize / 2, 0.001, groundSize / 2);
    scene.add(foam);
    const foamPositions = foam.geometry.attributes.position.array;
    foam.userData.originalPositions = new Float32Array(foamPositions);
    window.foam = foam;
}
function setupThreeScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8fdbf7);
    const aspect = window.innerWidth / innerHeight;
    const d = 25;
    perspectiveCamera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    orthographicCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
    camera = orthographicCamera;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);

    controls.enablePan = false;
    controls.enableRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.panSpeed = 0.8;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.minZoon = 1;
    controls.maxZoom = 4;
    controls.screenSpacePanning = false;
    controls.enableKeys = false;
    camera.position.set(25, 60, 20);
    camera.up.set(1, 0, 0);
    controls.target.set(25, 0, 20);

    controls.update();

    const toggle = document.getElementById('2or3-toggle');
    toggle.addEventListener('change', (e) => {
        const is3D = e.target.checked;
        isCurr2D = !is3D;

        if (isCurr2D) {
            camera = orthographicCamera;
            controls.object = orthographicCamera;
            controls.enablePan = false;
            controls.enableRotate = false;
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.panSpeed = 0.8;
            controls.minDistance = 5;
            controls.maxDistance = 40;
            controls.screenSpacePanning = false;
            controls.enableKeys = false;
            camera.position.set(25, 60, 20);
            camera.up.set(1, 0, 0);
            controls.target.set(25, 0, 20);
        } else {
            camera = perspectiveCamera;
            controls.object = perspectiveCamera;
            controls.enableRotate = true;
            controls.enablePan = true;
            controls.screenSpacePanning = true;
            camera.up.set(0, 1, 0);
            camera.position.set(10, 30, 60);
            controls.target.set(10, 0, 20);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.rotateSpeed = 0.8;
            controls.panSpeed = 0.8;
            controls.minDistance = 5;
            controls.maxDistance = 20;
            controls.maxPolarAngle = Math.PI / 2 - 0.1;
            controls.enableKeys = false;
        }
        controls.update();
    });

    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        perspectiveCamera.aspect = aspect;
        perspectiveCamera.updateProjectionMatrix();
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
    const hemiLight = new THREE.HemisphereLight(0x8fdbf7, 0xffa974, 1.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5d1, 5);
    sunLight.position.set(20, 40, 20);

    sunLight.castShadow = true;
    sunLight.shadow.mapSize.add.width = 2048;
    sunLight.shadow.mapSize.add.height = 2048;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);
}
function createGrainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = "#e8d4b8";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const sandColors = ["#f5e6d3", "#d4c4a8", "#e0d0b8", "#c9b89a", "#f0e0ca"];

    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        const color = sandColors[Math.floor(Math.random() * sandColors.length)];
        context.fillStyle = color;
        context.globalAlpha = Math.random() * 0.6 + 0.2;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }

    // fine grain on that
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const color = sandColors[Math.floor(Math.random() * sandColors.length)];
        context.fillStyle = color;
        context.globalAlpha = Math.random() * 0.4;
        context.fillRect(x, y, 1, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}
function createSandNormal() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = Math.random() * 40 + 108;
        imageData.data[i] = noise;
        imageData.data[i + 1] = noise;
        imageData.data[i + 2] = 128 + Math.random() * 80;
        imageData.data[i + 3] = 255;
    }
    context.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}
function loadObjects() {
    const loader = new GLTFLoader();
    loader.load('assets/boat.glb', function (gltf) {
        shipModel = gltf.scene;
        shipModel.position.set(groundSize / 3.5, 1.3, groundSize / 2);
        shipModel.scale.set(1.3, 1.3, 1.3);
        shipModel.rotation.y = -Math.PI / 2
        scene.add(shipModel);
        shipModel
    });
}
function animate() {
    requestAnimationFrame(animate);
    const currTime = performance.now();
    
    const deltaTime = (currTime - lastTime) / 1000;
    if(isSimulating){
        simulationTime += deltaTime;
    }
    
    lastTime = currTime;

    controls.update();

    if (isSimulating && shipModel) {
        const resultantVelocity = new THREE.Vector3();
        resultantVelocity.copy(shipVelocityVector).add(riverVelocityVector);

        shipModel.position.x += resultantVelocity.x * deltaTime * 60 * 0.1;
        shipModel.position.z += resultantVelocity.z * deltaTime * 60 * 0.1;

        const shipPos = shipModel.position.clone();
        shipPos.y += 2;

        boatVector.position.copy(shipPos);
        riverVector.position.copy(shipPos);
        resVector.position.copy(shipPos);

        const resDir = resultantVelocity.clone().normalize();
        const resLen = resultantVelocity.length() * 10;

        boatVector.setDirection(shipVelocityVector.clone().normalize());
        boatVector.setLength(shipVelocityVector.length() * 10);
        riverVector.setDirection(riverVelocityVector.clone().normalize());
        riverVector.setLength(riverVelocityVector.length() * 10);
        resVector.setDirection(resDir);
        resVector.setLength(resLen);

        if (shipModel.position.x > groundSize || Math.abs(shipModel.position.z) > groundSize) {
            isSimulating = false;
            aimAngleInput.disabled = false;
            aimAngleSlider.disabled = false;
            velocityRiverInput.disabled = false;
            velocityRiverSlider.disabled = false;
            shipVelocityInput.disabled = false;
            shipVelocitySlider.disabled = false;
            launchSim.disabled = false;
        }
    }
    if (water && water.userData.originalPositions) {
        const time = Date.now() * 0.001 * parseFloat(velocityRiverInput.value);
        const positions = water.geometry.attributes.position.array;
        const originalPositions = water.userData.originalPositions;

        for (let i = 0; i < positions.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            const z = originalPositions[i + 2];

            if (originalPositions[i + 2] > 0.4) {
                const wave1 = Math.sin(x * 0.4 + time * 0.5) * 0.02;
                const wave2 = Math.cos(x * 0.3 + time * 0.7) * 0.018;
                const wave3 = Math.sin((x * 0.2 + y * 0.2) + time * 0.4) * 0.015;
                const wave4 = Math.cos((x * 0.15 - y * 0.15) + time * 0.9) * 0.012;
                const ripple = Math.sin(x * 0.8 + y * 0.8 + time * 2) * 0.005;
                positions[i + 2] = originalPositions[i + 2] + wave1 + wave2 + wave3 + wave4 + ripple;
            }
        }
        water.geometry.attributes.position.needsUpdate = true;
        water.geometry.computeVertexNormals();
    }
    //foam same as well
    if (window.foam && window.foam.userData.originalPositions) {
        const time = Date.now() * 0.001 * parseFloat(velocityRiverInput.value);
        const positions = window.foam.geometry.attributes.position.array;
        const originalPositions = window.foam.userData.originalPositions;

        for (let i = 0; i < positions.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];

            const foam1 = Math.sin(x * 0.45 + time * 0.6) * 0.025;
            const foam2 = Math.cos(y * 0.35 + time * 0.8) * 0.022;
            const foam3 = Math.sin((x * 0.25 + y * 0.2) + time * 0.5) * 0.018;
            const foam4 = Math.cos((x * 0.18 - y * 0.18) + time * 1.1) * 0.015;
            const foam5 = Math.sin(x * 0.9 + y * 0.9 + time * 2.2) * 0.006;

            positions[i + 2] = foam1 + foam2 + foam3 + foam4 + foam5;
        }
        window.foam.geometry.attributes.position.needsUpdate = true;
        window.foam.geometry.computeVertexNormals();
    }
    document.getElementById("current-time").innerText = simulationTime.toFixed(2) + "s";
    renderer.render(scene, camera);
}
function createEnvironment() {
    const sandgeo = new THREE.BoxGeometry(12, 2, 120, 60, 60, 1);
    const sandMat = new THREE.MeshStandardMaterial({
        color: 0xe8d4b8,
        map: createGrainTexture(),
        normalMap: createSandNormal(),
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 0.95,
        metalness: 0.0,
        roughnessMap: createGrainTexture(),
    });
    const sandMesh = new THREE.Mesh(sandgeo, sandMat);
    sandMesh.position.set(groundSize / 6.8, -0.2, groundSize / 2);
    scene.add(sandMesh);

    const secondSand = sandMesh.clone();
    sandMesh.position.set(groundSize / 0.88, -0.2, groundSize / 2);
    scene.add(secondSand);

    const loader = new GLTFLoader();
    loader.load('assets/at_a_beach.glb', function (gltf) {
        const beach = gltf.scene;
        beach.position.set(groundSize / 5, 0.85, groundSize / 4);
        beach.scale.set(0.4, 0.4, 0.4);
        beach.rotation.y = -Math.PI / 2
        scene.add(beach);
    });
    loader.load('assets/coconut_tree.glb', function (gltf) {
        const coco_tree = gltf.scene;
        coco_tree.position.set(groundSize / 5, 0, groundSize / 1.3);
        coco_tree.scale.set(0.05, 0.05, 0.05);
        coco_tree.rotation.y = -Math.PI / 2
        scene.add(coco_tree);

        for (let i = 0; i < 5; i += 1) {
            // Bottom sand
            const dupTree = coco_tree.clone();
            dupTree.position.set(groundSize / (5 + Math.random() * 2), 0, groundSize * Math.random() * 2);
            scene.add(dupTree);
        }
        for (let i = 0; i < 5; i += 1) {
            // Top sand
            const dupTree = coco_tree.clone();
            dupTree.position.set(groundSize + 3, 0, groundSize * Math.random() * 2);
            scene.add(dupTree);
        }
    });
}
function updateShip() {
    const rotationInRad = parseFloat(aimAngleInput.value) * Math.PI / 180;
    shipModel.rotation.y = -rotationInRad + (-Math.PI / 2);
}
function setupVectors(){
    const dir = new THREE.Vector3(1, 0, 0);
    const origin = new THREE.Vector3(0, 2, 0);
    boatVector = new THREE.ArrowHelper(dir, origin, 5, 0x0000ff);
    riverVector = new THREE.ArrowHelper(dir, origin, 5, 0xffff00);
    resVector = new THREE.ArrowHelper(dir, origin, 5, 0xff0000);
    scene.add(boatVector, riverVector, resVector);
}
function startSimulation() {
    if (!shipModel) return;
    if (isSimulating) return;

    //Disableing the inputs
    aimAngleInput.disabled = true;
    aimAngleSlider.disabled = true;
    velocityRiverInput.disabled = true;
    velocityRiverSlider.disabled = true;
    shipVelocityInput.disabled = true;
    shipVelocitySlider.disabled = true;
    launchSim.disabled = true;

    shipModel.position.set(groundSize / 3.5, 1.3, groundSize / 2);

    const shipSpeed = parseFloat(shipVelocityInput.value) * 0.4;
    const riverSpeed = parseFloat(velocityRiverInput.value) * 0.4;

    const angleDeg = parseFloat(aimAngleInput.value);
    const angleRad = angleDeg * (Math.PI / 180);

    shipVelocityVector.set(Math.cos(angleRad) * shipSpeed, 0, Math.sin(angleRad) * shipSpeed);
    riverVelocityVector.set(0, 0, riverSpeed);
    isSimulating = true;
}
function resetSimulation() {
    simulationTime = 0;
    aimAngleInput.disabled = false;
    aimAngleSlider.disabled = false;
    velocityRiverInput.disabled = false;
    velocityRiverSlider.disabled = false;
    shipVelocityInput.disabled = false;
    shipVelocitySlider.disabled = false;
    launchSim.disabled = false;
    isSimulating = false;
    document.getElementById("current-time").innerText = "0.00 s";
    shipModel.position.set(groundSize / 3.5, 1.3, groundSize / 2);
}
setupPhysics();
setupThreeScene();
setupLights();
createBackground();
loadObjects();
createEnvironment();
setupVectors();