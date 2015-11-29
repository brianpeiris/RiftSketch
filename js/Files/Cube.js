var t3 = THREE;
var light = new t3.PointLight();
light.position.set(0, 10, 0);
scene.add(light);
scene.add(new t3.Mesh (
  new t3.BoxGeometry(1, 1, 1),
  new t3.MeshLambertMaterial({
    color: 'red'
  })
));
