/*
Copyright (c) 2014, Brandon Jones. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

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
