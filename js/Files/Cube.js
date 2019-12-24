const t3 = THREE;

const light = new t3.DirectionalLight();
light.castShadow = true;
light.position.set(7, 5.0, 4.0);
light.shadow.mapSize.setScalar(2048);
scene.add(light);

scene.add(
  new THREE.AmbientLight("white", 0.5)
);

function makeCube(x, y, z) {
  const cube = new t3.Mesh(
    new t3.BoxGeometry(1.0, 0.2, 1.0),
    new t3.MeshStandardMaterial({
      color: "green",
      roughness: 0.5,
      metalness: 0.6
    })
  );
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.position.set(x, y, z);
  return cube;
}

const star = new t3.Mesh(
  new t3.OctahedronGeometry(1, 0),
  new t3.MeshStandardMaterial({
    color: "gold",
    roughness: 0.5,
    metalness: 0.6
  })
);
star.castShadow = true;
star.scale.setScalar(0.2);
star.position.set(-1.0, 3.4, -1.0);
scene.add(star);

const numCubes = 16;
const cubes = [];
for (let i = 0; i < numCubes; i++) {
  const cube = makeCube(-1, i / 5, -1);
  cube.scale.setScalar(
    (1 / (i + 4)) * 6
  );
  cube.scale.y = 1;
  cube.material.color.setStyle(
    i % 2 === 0 ? "red" : "darkgreen"
  );
  scene.add(cube);
  cubes.push(cube);
}

sketch.initialState({ t: 0 });
sketch.loop = () => {
  const { state } = sketch;
  for (let i = 0; i < numCubes; i++) {
    const cube = cubes[i];
    cube.rotation.y =
      (state.t * i) / numCubes;
  }
  star.rotation.y = state.t;
  state.t += 0.02;
};
