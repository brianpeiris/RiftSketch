const t3 = THREE;

const light = new t3.PointLight();
light.position.set(1, 1, 1);
scene.add(light);

function makeCube(x, y, z) {
  const cube = new t3.Mesh(
    new t3.BoxGeometry(1, 1, 1),
    new t3.MeshLambertMaterial({
      color: "red"
    })
  );
  cube.position.set(x, y, z);
  return cube;
}
const cube = makeCube(0, 0, 0);
scene.add(cube);

let i = 0;
sketch.loop = () => {
  cube.rotation.y = i;
  i += 0.02;
};
