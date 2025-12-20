let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false;
let gridHelper;
let cannonModel;

// Projectile launch paramters that change for every launch
let gravity = 9.82; // Doesnot change for each ball but for the whole scene
let mass = 2; // Per ball basis also initial mass of the object

// This thing is stupid
let airResistent = false; // Doesnot change per ball basis changes for all balls
// variables
const AIR_DENSITY = 1.225;
const DRAG_COEFFICIENT = 0.47;
const CROSS_SECTIONAL_AREA = Math.PI * Math.pow(0.5, 2);

// --Important-- Cant change the initial orintation of the cannon since its going to mess the offset of the nozzle 
// AND MAKES SURE CANNON RANDOMLY SHOOTS THE BALL IN RANDOM DIRECTIONS
// Please dont change while developing or imma eat you

// Next stupid ahh bug to fix is the bug of colors which kinda gets messed up with multiple repeatative shoots of the projectile

let activeProjectile = null;
let projectileStartTime = 0;
let maxHeight = 0;
let dataPoints = [];



let trajectoryLines = [];
const MAX_TRAJECTORY_LINES = 3;

// Physics has started :(
let world;
let physicsBodies = [];
let physicsMeshes = [];


// Gimbal lock and respectivity of the rotation
let cannonRotationX = 0;
let cannonRotationY = 0;
let cannonRotationZ = 0;

const toggle = document.getElementById('2or3-toggle');
toggle.checked = true;

const velocityInput = document.getElementById('initial-velocity');
const velocitySlider = document.getElementById('velocity-slider');
const angleX = document.getElementById('angle-x');
const angleXSlider = document.getElementById('angle-x-slider');
const angleY = document.getElementById('angle-y');
const angleYSlider = document.getElementById('angle-y-slider');
const angleZ = document.getElementById('angle-z');
const angleZSlider = document.getElementById('angle-z-slider');
const heightInput = document.getElementById('height');
const heightSlider = document.getElementById('height-slider');
const angleXGroup = document.getElementById('angle-x-group');
const launchButton = document.getElementById('shoot-btn');
const gravityInput = document.getElementById('gravity');
const gravitySlider = document.getElementById('gravity-slider');
const massInput = document.getElementById('mass');
const massSlider = document.getElementById('mass-slider');
const airResis = document.getElementById('airResistence');

launchButton.addEventListener('click', launchProjectile);


velocitySlider.addEventListener('input', (e) => {
    velocityInput.value = e.target.value;
});
velocityInput.addEventListener('input', (e) =>{
    velocitySlider.value = e.target.value;
});

angleXSlider.addEventListener('input', (e) =>{
    angleX.value = e.target.value;
    cannonRotationX = parseFloat(e.target.value) * Math.PI / 180 ;
    updateCannonRotationRightly();
});
angleX.addEventListener('input', (e) => {
    angleXSlider.value = e.target.value;
    cannonRotationX = parseFloat(e.target.value) * Math.PI / 180 ;
    updateCannonRotationRightly();
});

angleYSlider.addEventListener('input', (e) =>{
    angleY.value = e.target.value;
    cannonRotationY = parseFloat(e.target.value) * Math.PI / 180 ;
    updateCannonRotationRightly();
});
angleY.addEventListener('input', (e) => {
    angleYSlider.value = e.target.value;
    cannonRotationY = parseFloat(e.target.value) * Math.PI / 180 ;
    updateCannonRotationRightly();
});

angleZSlider.addEventListener('input', (e) =>{
    angleZ.value = e.target.value;
    cannonRotationZ = parseFloat(e.target.value) * Math.PI / 180 ;
    updateCannonRotationRightly();
});
angleZ.addEventListener('input', (e) => {
    angleZSlider.value = e.target.value;
    cannonRotationZ = parseFloat(e.target.value) * Math.PI / 180 ; 
    updateCannonRotationRightly();
});

heightSlider.addEventListener('input', (e) => {
    heightInput.value = e.target.value;
    if(cannonModel){
        cannonModel.position.y = parseFloat(e.target.value) + 1;
    }
});
heightInput.addEventListener('input', (e) => {
    heightSlider.value = e.target.value;
    if(cannonModel){
        cannonModel.position.y = parseFloat(e.target.value) + 1;
        
    }
});

gravitySlider.addEventListener('input', (e) =>{
    gravityInput.value = e.target.value;
    gravity = parseFloat(e.target.value);
    world.gravity.set(0,-gravity, 0);
    document.getElementById('gravity').textContent = gravity.toFixed(2) + ' m/s²';
});
gravityInput.addEventListener('input', (e) => {
    gravitySlider.value = e.target.value;
    gravity = parseFloat(e.target.value);
    world.gravity.set(0,-gravity, 0);
    document.getElementById('gravity').textContent = gravity.toFixed(2) + ' m/s²';
});

massSlider.addEventListener('input', (e) =>{
    massInput.value = e.target.value;
    mass = parseFloat(e.target.value);
});
massInput.addEventListener('input', (e) => {
    massSlider.value = e.target.value;
    mass = parseFloat(e.target.value);
});
airResis.addEventListener('input', (e) =>{
    airResistent = e.target.checked;
    if(airResistent){
        enableAirResistence();
        console.log("Air resistent is turn on");
    }
    else{
        console.log("Air Resistent is turned off");
    }
});


function setupPhysics(){
    world = new CANNON.World();
    world.gravity.set(0, -gravity, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({mass : 0});
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
}
function addPhysicsBox(x, y, z, width, height, depth, color = 0xff0000){
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
        mass: 10,
        shape: shape,
        position: new CANNON.Vec3(x, y, z)
    });
    world.addBody(body);

    physicsBodies.push(body);
    physicsMeshes.push(mesh);

    return {mesh, body};
}
function updatePhysics(){
    // Adding drag boutta suck hard
    // Drag equation straight from google: FD = 0.5 * rho * drag_coefficient * A * v^2;
    // We could also do this with linear damping (which almost physics accurate but still not physically accurate and thats also going to be
    // per ball basis so rather than that just do it for the whole scene
    // Apparently Drag gotta be updated every second for it to work so we going to run a simulation loop later in the code
    physicsBodies.forEach(body => {
        if(airResistent && body.velocity){
            const velocity = body.velocity; // error with this line something with velocity()
        const speed = velocity.length();
        if(speed > 0.01 && body.mass > 0){
            // Just so we dont apply drag for statinary objects
            //const AIR_DENSITY = 1.225;
            //const DRAG_COEFFICIENT = 0.47;
            //const CROSS_SECTIONAL_AREA = Math.PI * Math.pow(0.5, 2);
            const radius = body.shapes[0].radius;
            const area = Math.PI * radius * radius;
            const dragMagnitude = 0.5 * AIR_DENSITY * DRAG_COEFFICIENT * area * speed * speed;
            const dragForce = velocity.clone();
            dragForce.normalize();
            dragForce.scale(-dragMagnitude, dragForce);
            body.applyForce(dragForce, body.position);``
        }
        }  
    });

    world.step(1/60);
    for(let i = 0; i < physicsBodies.length; i++){
        physicsMeshes[i].position.copy(physicsBodies[i].position);
        physicsMeshes[i].quaternion.copy(physicsBodies[i].quaternion);
    }
}
function updateRotationLocks(){
    if(isCurr2D){
        //2d Mode locking X and Y
        cannonRotationY = Math.PI;
        cannonRotationX = 0;
        angleY.value = 180;
        angleYSlider.value = 180;
        angleX.value = 0;
        angleXSlider.value = 0;

        angleY.disabled = true;
        angleYSlider.disabled = true;
        angleX.disabled = true;
        angleXSlider.disabled = true;
    }
    else{
            angleY.disabled = false;
            angleYSlider.disabled = false;
            angleX.disabled = false;
            angleXSlider.disabled = false;

            if(angleXGroup){
                angleXGroup.style.display = 'block';
            }
        }
}

function updateCannonRotationRightly(){
    if(cannonModel){
        const euler = new THREE.Euler(cannonRotationX, cannonRotationY, cannonRotationZ, 'YXZ');
        cannonModel.rotation.copy(euler);
    }
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
        updateRotationLocks();
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
            camera.position.set(40, 5, 20);
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
            camera.position.set(15, 15, 25);
            controls.target.set(5, 5, 10);
        }else{
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
function interactiveObjects(){
    const loader = new THREE.GLTFLoader();
    loader.load('cannon.glb', function(gltf){
        cannonModel = gltf.scene;
        cannonModel.position.set(0, 1, 0);
        cannonModel.scale.set(1, 1, 1);
        cannonModel.traverse((child) => {
            if(child.isMesh){
                child.material.color.set(0xffffff);
            }
        });

        scene.add(cannonModel);

        const heightInput = document.getElementById('height');
        heightInput.addEventListener('input', (e) => {
            const height = parseFloat(e.target.value);
            cannonModel.position.y = height + 1;
        })
    });
}
function launchProjectile(){
    const v0 = parseFloat(velocityInput.value);
    const h0 = parseFloat(heightInput.value) + 1;

    const radius = 0.5 * mass * 0.1;
    const direction = new THREE.Vector3(0, 1, 0);
    const euler = new THREE.Euler(cannonRotationX, cannonRotationY, cannonRotationZ, 'YXZ');
    direction.applyEuler(euler);
    direction.normalize();

    const barrelLength = 1;
    const startPos = new THREE.Vector3(0, h0, 0);
    startPos.add(direction.clone().multiplyScalar(barrelLength));

    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
        mass: mass,
        shape: shape,
        linearDamping: 0.1,
        angularDamping: 0.1,
        position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z)
    });

    //body.position.set(0, h0, 0);
    const velocityVector = direction.multiplyScalar(v0);
    body.velocity.set(velocityVector.x, velocityVector.y, velocityVector.z);

    // Instantiating object
    world.addBody(body);
    physicsBodies.push(body);

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({color: 0xffff00});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(body.position); // Might change it later so its closer to the nozzle

    activeProjectile = physicsBodies.length - 1;
    projectileStartTime = Date.now();
    maxHeight = h0;
    dataPoints = [];
    scene.add(mesh);
    physicsMeshes.push(mesh);

    removeOldestTrajectory();
    const trajectory = createTrajectoryLine(body);
    trajectoryLines.push(trajectory);

    activeProjectile = physicsBodies.length - 1;
    projectileStartTime = Date.now();
    maxHeight = h0;
    dataPoints = [];
}
function animate(){
    requestAnimationFrame(animate);
    updatePhysics();
    updateTrajectoryLines();
    updateDetailsPanel();
    controls.update();
    renderer.render(scene, camera);
}
function updateDetailsPanel(){
    if(activeProjectile === null) return;
    const body = physicsBodies[activeProjectile];
    if(!body) return;

    const currentHeight = body.position.y;
    const elapsedTime = (Date.now() - projectileStartTime) / 1000;
    document.getElementById('current-time').textContent = elapsedTime.toFixed(2) + ' s';
    document.getElementById('current-height').textContent = currentHeight.toFixed(2) + ' m';

    if(currentHeight > maxHeight){
        maxHeight = currentHeight;
        document.getElementById('max-height').textContent = maxHeight.toFixed(2) + ' m';
    }
    if(dataPoints.length === 0 || elapsedTime - dataPoints[dataPoints.length - 1].time >= 0.1){
        dataPoints.push({
            time:elapsedTime,
            height: currentHeight,
            x: body.position.x,
            z: body.position.z
        });
        updateDataTable();
    }
    if(currentHeight <= 0.5){
        activeProjectile = null;
    }
}
function updateDataTable(){
    const tbody = document.getElementById('data-table-body');
    tbody.innerHTML = '';
    dataPoints.forEach(points => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = points.time.toFixed(2);
        row.insertCell(1).textContent = points.height.toFixed(2);
        row.insertCell(2).textContent = points.x.toFixed(2);
        row.insertCell(3).textContent = points.z.toFixed(2);
    });
}
function createTrajectoryLine(body){
    const colors = [0x00ff00, 0x00ffff, 0xff00ff];
    const activeCount = trajectoryLines.filter(t => scene.children.includes(t.line)).length;
    const colorIndex = activeCount % colors.length;

    const points = [body.position.clone()];
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: colors[colorIndex],
        linewidth: 2
    });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    return {
        line: line,
        points: points,
        body: body,
        active: true
    };
}
function updateTrajectoryLines(){
    trajectoryLines.forEach(trajData => {
        if(!trajData.active) return;
        const body = trajData.body;

        if(body.position.y <= 0.5){
            trajData.active = false;
            return;
        }
        trajData.points.push(body.position.clone());
        trajData.line.geometry.setFromPoints(trajData.points);
        trajData.line.geometry.attributes.position.needsUpdate = true;
    });
}
function removeOldestTrajectory(){
    if(trajectoryLines.length >= MAX_TRAJECTORY_LINES){
        const oldest = trajectoryLines.shift();
        scene.remove(oldest.line);
        oldest.line.geometry.dispose();
        oldest.line.material.dispose();
    }
}
setupPhysics();
updateRotationLocks();
setupThreeScene();
createBackground();
interactiveObjects();
setupLights();
addPhysicsBox(30, 20, 30, 5, 5, 5, 0xff0000);
addPhysicsBox(10, 15, 30, 3, 3, 3, 0xfcd12a);