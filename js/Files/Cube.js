const t3 = THREE;

const sky = "pink";
renderer.setClearColor(sky);
scene.fog.color.setStyle(sky);

const light = new t3.DirectionalLight();
light.castShadow = true;
light.position.set(7, 5.0, 4.0);
light.shadow.mapSize.setScalar(2048);
scene.add(light);

scene.add(
  new THREE.AmbientLight("white", 0.5)
);

const origin = new t3.Group();
origin.position.set(-0.20, 1.10, 1.30)
scene.add(origin);

const boxes = [];
const n = 30;
for (let i = 0; i < n; i++) {
  const hue = t3.MathUtils.mapLinear(
    i, 0, n, 0, 360
  );
  const box = new t3.Mesh(
    new t3.BoxGeometry(0.30, 0.005, 0.01),
    new t3.MeshStandardMaterial({
      roughness: 0.1,
      metalness: 0.5,
      color: `hsl(${hue}, 100%, 50%)`
    })
  );
  box.castShadow = true;
  box.receiveShadow = true;
  box.position.y = i * 0.01;
  origin.add(box);
  boxes.push(box);
}

sketch.initialState({t: 0});
sketch.loop = () => {
  const { state } = sketch;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    box.rotation.y = state.t * i;
    box.rotation.z = state.t * 0.5;
  }
  state.t += 0.003;
};
