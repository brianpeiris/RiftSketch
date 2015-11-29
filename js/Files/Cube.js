var t3 = THREE;

var light = new t3.PointLight();
light.position.set(1, 1, 1);
scene.add(light);

function makeCube (x, y, z) {
  var cube = new t3.Mesh(
    new t3.BoxGeometry(1, 1, 1),
    new t3.MeshLambertMaterial({
      color: 'red'
    })
  );
  cube.position.set(x, y, z);
  return cube;
}
var cube = makeCube(0, 0, 0);
scene.add(cube);

var i = 0;
return function () {
  cube.rotation.y = i;
  i += 0.02;
};
