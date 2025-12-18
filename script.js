let scene, camera, renderer, controls, cube;
const toggle = document.getElementById('2or3-toggle');
function createBackground(){
    const boxSize = 20;
    const axisThickness = 0.2;
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

    
    const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMaterial = new THREE.LineBasicMaterial({color: 0x837bbb, });
    const box = new THREE.LineSegments(boxEdges, boxMaterial);
    box.position.set(boxSize / 2, boxSize / 2, boxSize / 2);
    scene.add(box);

    const planeGeo = new THREE.PlaneGeometry(boxSize, 20);
    const planeMat = new THREE.MeshBasicMaterial({color: 0x434081, side: THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(plane);
    
    
    const gridHelper = new THREE.GridHelper(boxSize, 20, 0xa39ce3, 0xa39ce3);
    gridHelper.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(gridHelper);
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

    
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0xff0000});
    cube = new THREE.Mesh(geometry, material);

    scene.add(cube);

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
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    animate();
}

function animate(){
    requestAnimationFrame(animate);
    
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    controls.update();

    renderer.render(scene, camera);
}

setupThreeScene();
createBackground();