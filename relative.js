import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from 'three/addons/objects/Water.js';

let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false;
let gridHelper;

let isSimulationFinished = true;
let frozenTime = 0;
let gravity = 9.82;
let finalVelocity = 0;
let groundSize;

let shipModel;
let water;

//Ship values
let shipRotation = 0;


let world;
let physicsBodies = [];
let physicsMeshes = [];

const toggle = document.getElementById('2or3-toggle');
toggle.checked = false;

const aimAngleInput = document.getElementById("aim-angle");
const aimAngleSlider = document.getElementById("aim-angle-slider");
const velocityRiverInput = document.getElementById("velocity-river");
const velocityRiverSlider = document.getElementById("velocity-river-slider");
const shipVelocityInput = document.getElementById("velocity-ship");
const shipVelocitySlider = document.getElementById("velocity-ship-slider");

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

function setupPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -gravity, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    //const groundShape = CANNON.Plane();
    //const groundBody = new CANNON.Body({mass: 0});
    //groundBody.addShape(groundShape);
    //groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    //world.addBody(groundBody);
}

function updatePhysics() {
    world.step(1 / 60);
    for (let i = 0; i < physicsBodies.length; i++) {
        physicsMeshes[i].position.copy(physicsBodies[i].position);
        physicsMeshes[i].quaternion.copy(physicsBodies[i].quaternion);
    }
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
    gridHelper.position.set(groundSize / 2, 0, groundSize / 2);
    scene.add(gridHelper);

    const toggle = document.getElementById('2or3-toggle');
    toggle.addEventListener('change', (e) => {
        isCurr2D = e.target.checked === false;
        if (isCurr2D) {
            gridHelper.rotation.x = Math.PI / 2;
            gridHelper.position.set(groundSize / 2, groundSize / 2, 0);
        }
        else {
            gridHelper.rotation.x = 0;
            gridHelper.position.set(groundSize / 2, 0, groundSize / 2);
        }
    });


    // Water and the sand stuff
    const sandGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const sandMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8e5a1,
        roughness: 1.0,
        bumpMap: createGrainTexture(),
        bumpScale: 0.02
    });
    const sandMesh = new THREE.Mesh(sandGeometry, sandMaterial);
    scene.add(sandMesh);
    sandMesh.rotation.x = -Math.PI / 2;
    sandMesh.position.set(groundSize / 2, 0, groundSize / 2);
    const waterGeometry = new THREE.BoxGeometry(20, 40, 0.5, 60, 60, 1);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e88e5,
        emissive: 0x001a33,
        emissiveIntensity: 0.2,
        roughness: 0.9,
        metalness: 0.2,
        flatShading:false,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });
    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(groundSize / 2, 0.1, groundSize / 2);
    scene.add(water);
    const positions = water.geometry.attributes.position.array;
    water.userData.originalPositions = new Float32Array(positions);

    const foamGeometry = new THREE.PlaneGeometry(20, 40, 60, 60);
    const foamMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
        roughness: 1,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    const foam = new THREE.Mesh(foamGeometry, foamMaterial);
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(groundSize / 2, 0.3, groundSize / 2);
    scene.add(foam);
    const foamPositions = foam.geometry.attributes.position.array;
    foam.userData.originalPositions = new Float32Array(foamPositions);
    window.foam = foam;
    
    /**const waterGeometry = new THREE.PlaneGeometry(20, 50);
    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(0, 20, 0).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x0066cc,
            distortionScale: 2.0,
        }
    );
    scene.add(water);
    water.rotation.x = -Math.PI / 2;
    water.position.set(groundSize / 2, 0.1, groundSize / 2);
    water.material.transparent = false;
    water.material.uniforms['size'].value = 0.6;
    water.material.uniforms['distortionScale'].value = 2.0;
    water.material.uniforms['alpha'].value = 1;
    **/
}
function setupThreeScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8fdbf7);
    const aspect = window.innerWidth / innerHeight;
    const d = 25;
    //scene.environment = scene.background;

    perspectiveCamera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    orthographicCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
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
    camera.position.set(-0.5, 40, 0);
    controls.target.set(0, 0, 0);

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
            camera.position.set(-0.5, 40, 0);
            controls.target.set(0, 0, 0);
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
function createGrainTexture(){
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    for(let i = 0; i < 10000; i++){
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
         
    }
}
function loadObjects() {
    const loader = new GLTFLoader();
    loader.load('viking_ship.glb', function (gltf) {
        shipModel = gltf.scene;
        shipModel.position.set(groundSize / 3.8, 0, groundSize / 2);
        shipModel.scale.set(0.3, 0.3, 0.3);
        shipModel.rotation.y = -Math.PI / 2
        scene.add(shipModel);
        shipModel
    });
}
function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    controls.update();
    if (water && water.userData.originalPositions) {
        const time = Date.now() * 0.001 * parseFloat(velocityRiverInput.value);
        const positions = water.geometry.attributes.position.array;
        const originalPositions = water.userData.originalPositions;

        for(let i = 0; i < positions.length; i+= 3){
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            const z = originalPositions[i + 2];

            if (originalPositions[i + 2] > 0.4) {
                const wave1 = Math.sin(x*0.4 + time * 0.5) * 0.06;
                const wave2 = Math.cos(x*0.3 + time * 0.7) * 0.05;
                const wave3 = Math.sin((x * 0.2 + y * 0.2) + time * 0.4) * 0.04;
                const wave4 = Math.cos((x * 0.15 - y * 0.15) + time * 0.9) * 0.03;
                const ripple = Math.sin(x * 0.8 + y * 0.8 + time * 2) * 0.01;
                positions[i + 2] = originalPositions[i + 2] + wave1 + wave2 + wave3 + wave4 + ripple;
            }
        }
        water.geometry.attributes.position.needsUpdate = true;
        water.geometry.computeVertexNormals();
    }
    //foam same as well
    if(window.foam && window.foam.userData.originalPositions){
        const time = Date.now() * 0.001 * parseFloat(velocityRiverInput.value);
        const positions = window.foam.geometry.attributes.position.array;
        const originalPositions = window.foam.userData.originalPositions;

        for(let i = 0; i < positions.length; i+= 3){
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            
            const foam1 = Math.sin(x * 0.45 + time * 0.6) * 0.07;
            const foam2 = Math.cos(y * 0.35 + time * 0.8) * 0.06;
            const foam3 = Math.sin((x * 0.25 + y * 0.2) + time * 0.5) * 0.05;
            const foam4 = Math.cos((x * 0.18 - y * 0.18) + time * 1.1) * 0.035;
            const foam5 = Math.sin(x*0.9 + y * 0.9 + time * 2.2) * 0.012;

            positions[i + 2] = foam1 + foam2 + foam3 + foam4 + foam5;
        }
        window.foam.geometry.attributes.position.needsUpdate = true;
        window.foam.geometry.computeVertexNormals();
    }
    renderer.render(scene, camera);
}
function updateShip(){
    const rotationInRad = parseFloat(aimAngleInput.value) * Math.PI / 180;
    shipModel.rotation.y = -rotationInRad + (-Math.PI / 2);
}


setupPhysics();
setupThreeScene();
setupLights();
createBackground();
loadObjects();
isSimulationFinished = true;