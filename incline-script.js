let scene, camera, renderer, controls;
let prespectiveCamera, orthographicCamera;
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

const toggle = document.getElementById('2or3-toggle');
toggle.checked = true;

const velocityInput = document.getElementById('inital-velocity');
const velocitySlider = document.getElementById('velocity-slider');
const rampAngleInput = document.getElementById('ramp-angle');
const rampAngleSlider = document.getElementById('ramp-slider');
const kineticFriction = document.getElementById('ramp-friction');
const kineticFrictionSlider = document.getElementById('friction-slider');
const massInput = document.getElementById('mass');
const massSlider = document.getElementById('mass-slider');
const airResistentInput = document.getElementById('airResistence');

const simulationButton = document.getElementById('sim-btn');
simulationButton.addEventListener('click', launchSim);

function launchSim(){

}

velocitySlider.addEvenetListener('input', (e) => {
    velocityInput.value = e.target.value;
});
velocityInput.addEventListener('input', (e) => {
    velocitySlider.value = e.target.value;
});

rampAngleSlider.addEvenetListener('input', (e) => {
    rampAngleInput.value = e.target.value;
});
rampAngleInput.addEventListener('input', (e) => {
    rampAngleSlider.value = e.target.value;
});

kineticFrictionSlider.addEvenetListener('input', (e) => {
    kineticFriction.value = e.target.value;
});
kineticFriction.addEventListener('input', (e) => {
    kineticFrictionSlider.value = e.target.value;
});

massSlider.addEvenetListener('input', (e) => {
    massInput.value = e.target.value;
});
massInput.addEventListener('input', (e) => {
    massSlider.value = e.target.value;
});

airResistentInput.addEventListener('input', (e) => {
    airResistent = e.target.checked;
    if(airResistent){
        enableAirResistence();
        console.log("Air resistence is turn on");
    }
    else{
        console.log("Air resistence is turn off");
    }
});

function setupPhysics(){
    world = new CANNON.World();
    world.gravity.set(0, -gravity, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({mass: 0}); // static
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
}
function addPhysicsRamp(x)