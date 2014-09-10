var DeviceManager = function () {
  var noop = function () {};

  this.sensorDevice = null;
  this.hmdDevice = null;

  var fovScale = 1.0;
  this.onResizeFOV = noop;
  this.resizeFOV = function (amount) {
    var fovLeft, fovRight;

    if (!this.hmdDevice) { return; }

    if (amount != 0 && 'setFieldOfView' in this.hmdDevice) {
      fovScale += amount;
      if (fovScale < 0.1) { fovScale = 0.1; }

      fovLeft = this.hmdDevice.getRecommendedEyeFieldOfView("left");
      fovRight = this.hmdDevice.getRecommendedEyeFieldOfView("right");

      fovLeft.upDegrees *= fovScale;
      fovLeft.downDegrees *= fovScale;
      fovLeft.leftDegrees *= fovScale;
      fovLeft.rightDegrees *= fovScale;

      fovRight.upDegrees *= fovScale;
      fovRight.downDegrees *= fovScale;
      fovRight.leftDegrees *= fovScale;
      fovRight.rightDegrees *= fovScale;

      this.hmdDevice.setFieldOfView(fovLeft, fovRight);
    }

    var renderTargetSize = null;
    if ('getRecommendedRenderTargetSize' in this.hmdDevice) {
      renderTargetSize = this.hmdDevice.getRecommendedRenderTargetSize();
    }

    if ('getCurrentEyeFieldOfView' in this.hmdDevice) {
      fovLeft = this.hmdDevice.getCurrentEyeFieldOfView("left");
      fovRight = this.hmdDevice.getCurrentEyeFieldOfView("right");
    } else {
      fovLeft = this.hmdDevice.getRecommendedEyeFieldOfView("left");
      fovRight = this.hmdDevice.getRecommendedEyeFieldOfView("right");
    }

    this.onResizeFOV(renderTargetSize, fovLeft, fovRight);
  }.bind(this);

  this.onHMDDeviceFound = noop;
  this.onSensorDeviceFound = noop;
  this.enumerateVRDevices = function (devices) {
    // First find an HMD device
    for (var i = 0; i < devices.length; ++i) {
      if (devices[i] instanceof HMDVRDevice) {
        this.hmdDevice = devices[i];

        this.onHMDDeviceFound(this.hmdDevice);

        this.resizeFOV(0.0);
      }
    }

    // Next find a sensor that matches the HMD hardwareUnitId
    for (var i = 0; i < devices.length; ++i) {
      if (
        devices[i] instanceof PositionSensorVRDevice &&
        (
          !this.hmdDevice ||
          devices[i].hardwareUnitId == this.hmdDevice.hardwareUnitId
        )
      ) {
        this.sensorDevice = devices[i];
        this.onSensorDeviceFound(this.sensorDevice);
      }
    }
  }.bind(this);

  this.onError = noop;
  this.init = function () {
    if (navigator.getVRDevices) {
      navigator.getVRDevices().then(this.enumerateVRDevices);
    } else if (navigator.mozGetVRDevices) {
      navigator.mozGetVRDevices(this.enumerateVRDevices);
    } else {
      this.onError();
    }
  }.bind(this);
};
