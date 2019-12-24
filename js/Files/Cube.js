const t3 = THREE;

const light = new t3.DirectionalLight();
light.castShadow = true;
light.position.set(1, 1, 2);
light.shadow.mapSize.setScalar(2048);
scene.add(light);

function makeCube(x, y, z) {
  const cube = new t3.Mesh(
    new t3.BoxGeometry(1, 1, 1),
    new t3.MeshLambertMaterial({
      color: "red"
    })
  );
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.position.set(x, y, z);
  return cube;
}
const cube = makeCube(0, 0, 0);
scene.add(cube);

let t = 0;
sketch.loop = () => {
  cube.rotation.y = t;
  t += 0.02;
};
