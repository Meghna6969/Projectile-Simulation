let scene, camera, renderer, controls, cube;
function createBackground(){
    const boxSize = 20;
    const groundGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
    const groundMaterial = new THREE.MeshBasicMaterial({visible: false});
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(ground);
    
    const axisHelper = new THREE.AxesHelper(boxSize * 1.2);
    scene.add(axisHelper);
    
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
    
    
    const gridHelper = new THREE.GridHelper(boxSize, 20, 0xFFFFFF, 0xFFFFFF);
    gridHelper.position.set(boxSize / 2, 0, boxSize / 2);
    scene.add(gridHelper);
}
function setupThreeScene(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140f2e);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(1, 1, 1);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
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
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0xff0000});
    cube = new THREE.Mesh(geometry, material);

    scene.add(cube);

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