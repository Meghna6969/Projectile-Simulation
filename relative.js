import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
let scene, camera, renderer, controls;
let perspectiveCamera, orthographicCamera;
let isCurr2D = false;
let gridHelper;

let isSimulationFinished = true;
let frozenTime = 0;
let gravity = 9.82;
let finalVelocity = 0;

let world;
let physicsBodies = [];
let physicsMeshes = [];

const toggle = document.getElementById('2or3-toggle');
toggle.checked = false;

const aimAngleInput = document.getElementById("aim-angle");
const aimAngleSlider = document.getElementById("aim-angle-slider");
const velocityRiverInput = document.getElementById("velocity-river");
const velocityRiverSlider = document.getElementById("velocity-river-slider");
const shipVelocityInput = document.getElementById("velocity-ship-slider");
const shipVelocitySlider = document.getElementById("velocity-ship-slider");
