# Allows arbitrary transforms to be easily applied to hands in the Leap Frame
# This requires THREE.js

# configuration:
# if transform is set, all other properties will be ignored
# transform: a THREE.Matrix4 directly.  This can be either an array of 16-length, or a THREE.matrix4
# quaternion:  a THREE.Quaternion
# position:  a THREE.Vector3
# scale:  a THREE.Vector3 or a number.


Leap.plugin 'transform', (scope = {})->
  noop = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
  _directionTransform = new THREE.Matrix4

  if scope.vr == true

    this.setOptimizeHMD(true)

    # This matrix flips the x, y, and z axis.
    scope.quaternion = (new THREE.Quaternion).setFromRotationMatrix(
      (new THREE.Matrix4).set(
        -1,  0,  0,  0,
         0,  0, -1,  0,
         0, -1,  0,  0,
         0,  0,  0,  1
      )
    )

    # Scales to meters.
    scope.scale = 0.001

    scope.position = new THREE.Vector3(0,0,-0.08)

  if scope.vr == 'desktop'
    scope.scale = 0.001

  # no scale
  scope.getTransform = (hand)->
    if scope.matrix
      matrix = if typeof scope.matrix == 'function' then scope.matrix(hand) else scope.matrix

      if window['THREE'] && matrix instanceof THREE.Matrix4
        return matrix.elements
      else
        return matrix

    else if scope.position || scope.quaternion || scope.scale
      _directionTransform.set.apply(_directionTransform, noop)

      if scope.quaternion
        _directionTransform.makeRotationFromQuaternion(
          if typeof scope.quaternion == 'function' then scope.quaternion(hand) else scope.quaternion
        )

      if scope.position
        _directionTransform.setPosition(
          if typeof scope.position == 'function'   then scope.position(hand)   else scope.position
        )

      return _directionTransform.elements

    else
      return noop


  scope.getScale  = (hand)->
    if !isNaN(scope.scale)
      scope.scale = new THREE.Vector3(scope.scale, scope.scale, scope.scale)

    return if typeof scope.scale == 'function'      then scope.scale(hand)      else scope.scale


  # implicitly appends 1 to the vec3s, applying both translation and rotation
  transformPositions = (matrix, vec3s)->
    for vec3 in vec3s
      if vec3 # some recordings may not have all fields
        Leap.vec3.transformMat4(vec3, vec3, matrix)

  transformMat4Implicit0 = (out, a, m) ->
    x = a[0]
    y = a[1]
    z = a[2]

    out[0] = m[0] * x + m[4] * y + m[8]  * z
    out[1] = m[1] * x + m[5] * y + m[9]  * z
    out[2] = m[2] * x + m[6] * y + m[10] * z
    return out

  # appends 0 to the vec3s, applying only rotation
  transformDirections = (matrix, vec3s)->
    for vec3 in vec3s
      if vec3 # some recordings may not have all fields
        transformMat4Implicit0(vec3, vec3, matrix)

  # expects a hand, an array mat4 and an array scale.
  transformWithMatrices = (hand, transform, scale) ->
    transformDirections(
      transform,
      [
        hand.direction,
        hand.palmNormal,
        hand.palmVelocity,
        hand.arm.basis[0],
        hand.arm.basis[1],
        hand.arm.basis[2],
      ]
    )

    for finger in hand.fingers
      transformDirections(
        transform,
        [
          finger.direction,
          finger.metacarpal.basis[0],
          finger.metacarpal.basis[1],
          finger.metacarpal.basis[2],
          finger.proximal.basis[0],
          finger.proximal.basis[1],
          finger.proximal.basis[2],
          finger.medial.basis[0],
          finger.medial.basis[1],
          finger.medial.basis[2],
          finger.distal.basis[0],
          finger.distal.basis[1],
          finger.distal.basis[2]
        ]
      )

    Leap.glMatrix.mat4.scale(transform, transform, scale)

    transformPositions(
      transform,
      [
        hand.palmPosition,
        hand.stabilizedPalmPosition,
        hand.sphereCenter,
        hand.arm.nextJoint,
        hand.arm.prevJoint
      ]
    )

    for finger in hand.fingers
      transformPositions(
        transform,
        [
          finger.carpPosition,
          finger.mcpPosition,
          finger.pipPosition,
          finger.dipPosition,
          finger.distal.nextJoint,
          finger.tipPosition
        ]
      )

    scalarScale = ( scale[0] + scale[1] + scale[2] ) / 3;
    hand.arm.width *= scalarScale

  # todo - expose function to transform a frame
  {
    frame: (frame)->

      return if !frame.valid || frame.data.transformed

      frame.data.transformed = true

      for hand in frame.hands

        transformWithMatrices(hand, scope.getTransform(hand), (scope.getScale(hand) || new THREE.Vector3(1,1,1)).toArray() )

        if scope.effectiveParent
          # as long as parent doesn't have scale, we're good.
          # could refactor to extract scale from mat4 and do the two separately
          # e.g., decompose in to pos/rot/scale, recompose from pos/rot/defaultScale
          transformWithMatrices( hand, scope.effectiveParent.matrixWorld.elements, scope.effectiveParent.scale.toArray() )

        len = null
        for finger in hand.fingers
          # recalculate lengths
          len = Leap.vec3.create()
          Leap.vec3.sub(len, finger.mcpPosition, finger.carpPosition)
          finger.metacarpal.length = Leap.vec3.length(len)

          Leap.vec3.sub(len, finger.pipPosition, finger.mcpPosition)
          finger.proximal.length = Leap.vec3.length(len)

          Leap.vec3.sub(len, finger.dipPosition, finger.pipPosition)
          finger.medial.length = Leap.vec3.length(len)

          Leap.vec3.sub(len, finger.tipPosition, finger.dipPosition)
          finger.distal.length = Leap.vec3.length(len)

        Leap.vec3.sub(len, hand.arm.prevJoint, hand.arm.nextJoint)
        hand.arm.length = Leap.vec3.length(len)

  }
