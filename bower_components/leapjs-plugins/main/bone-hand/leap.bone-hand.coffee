scope = null

if require then THREE = require('three')

initScene = (targetEl, scale)->

  # scene and renderer

  scope.scene = new THREE.Scene()
  scope.rendererOps ||= {}
  if scope.rendererOps.alpha == undefined then scope.rendererOps.alpha = true
  scope.renderer = renderer = new THREE.WebGLRenderer(scope.rendererOps)

  width  = scope.width  || window.innerWidth
  height = scope.height || window.innerHeight

  renderer.setClearColor(0x000000, 0)
  renderer.setSize(width, height)

  renderer.domElement.className = "leap-boneHand"

  renderer.shadowMapEnabled = true
  renderer.shadowMapType = THREE.PCFSoftShadowMap

  targetEl.appendChild(renderer.domElement)

  # camera

  near = 1 # 1 mm
  far = 10000 # 10 m

  if scale
    near *= scale
    far  *= scale

  scope.camera = camera = new THREE.PerspectiveCamera(45, width / height, near, far)

  camera.position.set(0, 300, 500);
  camera.lookAt(new THREE.Vector3(0, 160, 0));

  scope.scene.add(camera)

  if !scope.width && !scope.height
    window.addEventListener 'resize', ->
      width  = window.innerWidth
      height = window.innerHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize( width, height )

      renderer.render(scope.scene, camera)
    , false


  scope.render ||= (timestamp)->
    renderer.render(scope.scene, scope.camera);

  scope.render()

baseBoneRotation = null
jointColor = null
boneColor = null
boneScale  = null
jointScale = null
boneRadius = null
jointRadius = null
material = null
armTopAndBottomRotation = null



class HandMesh
  # when a hand enters the scene, it takes a mesh out of here, or creates a new one
  @unusedHandMeshes: []

  # gets or creates a handmesh
  # makes it visible
  @get: ->
    if HandMesh.unusedHandMeshes.length == 0
      handMesh = HandMesh.create()

    handMesh = HandMesh.unusedHandMeshes.pop()

    handMesh.show()

    return handMesh

  # replaces a handMesh in the cache
  # makes it invisible.
  replace: ->
    @hide()
    HandMesh.unusedHandMeshes.push(this)


  # adds hand meshes to the scene
  # stores them in unusedhandMesh
  @create: ->
    mesh = new HandMesh
    mesh.setVisibility(false)
    HandMesh.unusedHandMeshes.push(mesh)


    if HandMesh.onMeshCreated
      HandMesh.onMeshCreated(mesh)

    return mesh

  constructor: ->

    material = if !isNaN(scope.opacity)
      new THREE.MeshPhongMaterial(fog: false, transparent: true, opacity: scope.opacity)
    else
      new THREE.MeshPhongMaterial(fog: false)

    boneRadius  = 40 * boneScale # 40 is typical mm middle finger proximal bone length. This can be anything, as it gets rescaled later.
    jointRadius = 40 * jointScale

    @fingerMeshes = []
    for i in [0...5]
      finger = []
      boneCount = if i == 0 then 3 else 4 # thumb has one fewer

      for j in [0...boneCount]
        # we keep one array with bone and joint meshes, and iterate through it later for position.. easy

        #joint
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(jointRadius, 32, 32),
          material.clone()
        )
        mesh.name = "hand-bone-#{j}"
        mesh.material.color.copy(jointColor)
        mesh.renderDepth = ((i * 9) + (2 * j) ) / 36
        mesh.castShadow = true
        scope.scene.add mesh
        finger.push mesh

        # bone
        # CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded)
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(boneRadius, boneRadius, 40, 32),
          material.clone()
        )
        mesh.name = "hand-joint-#{j}"
        mesh.material.color.copy(boneColor)
        mesh.renderDepth = ((i * 9) + (2 * j) + 1 ) / 36 # might fuckup opaque objects?
        mesh.castShadow = true
        scope.scene.add mesh
        finger.push mesh


      #joint - end cap
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(jointRadius, 32, 32),
        material.clone()
      )
      mesh.material.color.copy(jointColor)

      mesh.castShadow = true

      scope.scene.add mesh
      finger.push mesh


      @fingerMeshes.push(finger)


    if scope.arm
      @armMesh = new THREE.Object3D;
      @armBones = []
      @armSpheres = []

      for i in [0..3]
        @armBones.push(new THREE.Mesh(
          # CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded)
          new THREE.CylinderGeometry(boneRadius, boneRadius,
            ( if  i < 2 then 1000 else 100 )
          , 32),
          material.clone()
        ))
        @armBones[i].material.color.copy(boneColor)
        @armBones[i].castShadow = true
        @armBones[i].name= "ArmBone#{i}"

        if i > 1
          @armBones[i].quaternion.multiply(armTopAndBottomRotation)

        @armMesh.add(@armBones[i])

      @armSpheres = []
      for i in [0..3]
        @armSpheres.push(new THREE.Mesh(
          new THREE.SphereGeometry(jointRadius, 32, 32),
          material.clone()
        ))
        @armSpheres[i].material.color.copy(jointColor)
        @armSpheres[i].castShadow = true
        @armSpheres[i].name= "ArmSphere#{i}"
        @armMesh.add(@armSpheres[i])

      scope.scene.add(@armMesh);

  traverse: (callback)->
    for i in [0...5]
      for mesh in @fingerMeshes[i]
        callback(mesh)

    @armMesh && @armMesh.traverse(callback)



  # scales the meshes appropriately
  scaleTo: (hand)->

    # bone radius changes with overall hand size, but not joint length
    baseScale = hand.middleFinger.proximal.length / @fingerMeshes[2][1].geometry.parameters.height

    for i in [0...5]
      finger = hand.fingers[i]
      j = 0
      # iterate backwards as first bone in the thumb is bunk.
      while true
        if j == @fingerMeshes[i].length - 1
          mesh = @fingerMeshes[i][j]
          mesh.scale.set(baseScale, baseScale, baseScale)
          break

        bone = finger.bones[ 3 - (j / 2) ]

        # joints
        mesh = @fingerMeshes[i][j]
        mesh.scale.set(baseScale, baseScale, baseScale)

        j++

        # bones
        mesh = @fingerMeshes[i][j]
        fingerBoneLengthScale = bone.length / mesh.geometry.parameters.height
        mesh.scale.set(baseScale, fingerBoneLengthScale, baseScale)
        j++

    if scope.arm
      armLenScale   = hand.arm.length / ( @armBones[0].geometry.parameters.height + @armBones[0].geometry.parameters.radiusTop )
      armWidthScale = hand.arm.width  / ( @armBones[2].geometry.parameters.height + @armBones[2].geometry.parameters.radiusTop )

      for i in [0..3]
        @armBones[i].scale.set(baseScale,
          ( if  i < 2 then armLenScale else armWidthScale )
        , baseScale)

        @armSpheres[i].scale.set(baseScale, baseScale, baseScale)

      boneXOffset  = (hand.arm.width / 2) * 0.85
      halfArmLength = hand.arm.length / 2


      # CW from Top center
      @armBones[0].position.setX(boneXOffset) # radius
      @armBones[1].position.setX(-boneXOffset) # ulna
      @armBones[2].position.setY(halfArmLength)
      @armBones[3].position.setY(-halfArmLength)

      # CW from TL
      @armSpheres[0].position.set( - boneXOffset,   halfArmLength, 0)
      @armSpheres[1].position.set(   boneXOffset,   halfArmLength, 0)
      @armSpheres[2].position.set(   boneXOffset, - halfArmLength, 0)
      @armSpheres[3].position.set( - boneXOffset, - halfArmLength, 0)



    return this

  # positions and rotates the meshes appropriately
  formTo: (hand)->
    for i in [0...5]
      finger = hand.fingers[i]
      j = 0
      while true

        if j == @fingerMeshes[i].length - 1
          mesh = @fingerMeshes[i][j] # alternating, joint-bone-joint-bone...
          mesh.position.fromArray bone.prevJoint
          break

        bone = finger.bones[  3 - (j / 2) ]

        mesh = @fingerMeshes[i][j]
        mesh.position.fromArray bone.nextJoint
        ++j

        mesh = @fingerMeshes[i][j]

        mesh.position.fromArray bone.center()
        mesh.setRotationFromMatrix (new THREE.Matrix4).fromArray(bone.matrix())
        mesh.quaternion.multiply baseBoneRotation
        ++j

    if @armMesh
      @armMesh.position.fromArray(hand.arm.center())
      @armMesh.setRotationFromMatrix(
        (new THREE.Matrix4).fromArray( hand.arm.matrix() )
      );
      @armMesh.quaternion.multiply(baseBoneRotation)

    return this

  setVisibility: (visible)->
    for i in [0...5]
      j = 0
      while true
        @fingerMeshes[i][j].visible = visible
        ++j

        break if j == @fingerMeshes[i].length

    if scope.arm
      for i in [0..3]
        @armBones[i].visible   = visible
        @armSpheres[i].visible = visible


  show: ->
    @setVisibility(true)

  hide: ->
    @setVisibility(false)



onHand = (hand) ->
  return if !scope.scene

  handMesh = hand.data('handMesh')

  # the handFound listener doesn't actually fire if in live mode with hand-in-screen
  # we manually check for finger meshes and initialize if necessary
  if !handMesh
    handMesh = HandMesh.get().scaleTo(hand)
    hand.data('handMesh', handMesh)
    if HandMesh.onMeshUsed
      HandMesh.onMeshUsed(handMesh)

  handMesh.formTo(hand)


boneHandLost = (hand) ->
  handMesh = hand.data('handMesh')
  if handMesh
    handMesh.replace()

  handMesh = hand.data('handMesh', null)

Leap.plugin 'boneHand', (options = {}) ->
  # make sure scope is globally available
  scope = options
  controller = this;

  jointColor = (new THREE.Color).setHex(0x5daa00)
  boneColor = (new THREE.Color).setHex(0xffffff)

  scope.boneScale  && boneScale  = scope.boneScale
  scope.jointScale && jointScale = scope.jointScale

  scope.boneColor  && boneColor  = scope.boneColor
  scope.jointColor && jointColor = scope.jointColor

  scope.HandMesh = HandMesh

  # this method enhances scope.scene with camera and lighting
  # it is split from initScene so as to allow it being called with non-default scenes.
  # expects camera to be added to the scene
  scope.addShadowCamera = ->

    scope.light = new THREE.SpotLight( 0xffffff, 1 )
    scope.light.castShadow = true
#    scope.light.shadowCameraVisible = true # This makes for excellent debugging
    scope.light.shadowDarkness = 0.8
    scope.light.shadowMapWidth = 1024
    scope.light.shadowMapHeight = 1024
    scope.light.shadowCameraNear = 0.5 / 0.001
    scope.light.shadowCameraFar = 3  / 0.001

    # fixed hand position..
    scope.light.position.set(0,1000,1000); # up and behind
    scope.light.target.position.set(0,0,-1000); # one meter forward

    # see https:#github.com/mrdoob/three.js/issues/2251
    scope.camera.add(scope.light.target);
    scope.camera.add(scope.light);

    if controller.plugins.transform

      if controller.plugins.transform.getScale()
        # this somewhat confusingly-named method also ensures that scale is a Vector3
        # for VR, this would be 0.001 m/mm

        scope.light.shadowCameraNear *= controller.plugins.transform.scale.x
        scope.light.shadowCameraFar  *= controller.plugins.transform.scale.x
        scope.light.target.position.multiply(controller.plugins.transform.scale)
        scope.light.position.multiply(controller.plugins.transform.scale)

      if controller.plugins.transform.vr == true
        scope.camera.position.set(0,0,0)

      if controller.plugins.transform.vr == 'desktop'
        scope.camera.position.set(0,0.15,0.3)




  baseBoneRotation = (new THREE.Quaternion).setFromEuler(
    new THREE.Euler(Math.PI / 2, 0, 0)
  );



  boneScale  = 1 / 6
  jointScale = 1 / 5

  boneRadius = null
  jointRadius = null

  material = null

  armTopAndBottomRotation = (new THREE.Quaternion).setFromEuler(
    new THREE.Euler(0, 0, Math.PI / 2)
  );


  HandMesh.onMeshCreated = (mesh)->
    controller.emit('handMeshCreated', mesh)

  HandMesh.onMeshUsed = (mesh)->
    controller.emit('handMeshUsed', mesh)




  @use('handEntry')
  @use('handHold')

  # this allows a null scene to be passed in for delayed-initialization.
  if scope.scene == undefined
    console.assert(scope.targetEl)

    if @plugins.transform && @plugins.transform.getScale()
      scale = @plugins.transform.scale.x # we just grab one value, as they're usually all the same.

    initScene(scope.targetEl, scale)
    scope.addShadowCamera()



  # Preload two hands
  if scope.scene
    HandMesh.create()
    HandMesh.create()

    # have rendered called by leap, rather than animation frame, to make sure there's no one-frame-delay.
    # we wrap this to allow the render method to be replaced
    if Leap.version.major == 0 && Leap.version.minor < 7 && Leap.version.dot < 4
      console.warn("BoneHand default scene render requires LeapJS > 0.6.3. You're running have #{Leap.version.full}")

    @on 'frameEnd', (timestamp)->
      if scope.render
        scope.render(timestamp)

  @on 'handLost', boneHandLost


  {

    hand: onHand

  }
