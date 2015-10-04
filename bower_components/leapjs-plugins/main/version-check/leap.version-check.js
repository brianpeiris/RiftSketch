//CoffeeScript generated from main/version-check/leap.version-check.coffee
(function() {
  var versionCheck;

  versionCheck = function(scope) {
    scope.alert || (scope.alert = false);
    scope.requiredProtocolVersion || (scope.requiredProtocolVersion = 6);
    scope.disconnect || (scope.disconnect = true);
    if ((typeof Leap !== 'undefined') && Leap.Controller) {
      if (Leap.version.minor < 5 && Leap.version.dot < 4) {
        console.warn("LeapJS Version Check plugin incompatible with LeapJS pre 0.4.4");
      }
    }
    this.on('ready', function() {
      var current, message, required;
      required = scope.requiredProtocolVersion;
      current = this.connection.opts.requestProtocolVersion;
      if (current < required) {
        message = "Protocol Version too old. v" + required + " required, v" + current + " available.";
        if (scope.disconnect) {
          this.disconnect();
          message += " Disconnecting.";
        }
        console.warn(message);
        if (scope.alert) {
          alert("Your Leap Software version is out of date.  Visit http://www.leapmotion.com/setup to update");
        }
        return this.emit('versionCheck.outdated', {
          required: required,
          current: current,
          disconnect: scope.disconnect
        });
      }
    });
    return {};
  };

  if ((typeof Leap !== 'undefined') && Leap.Controller) {
    Leap.Controller.plugin('versionCheck', versionCheck);
  } else if (typeof module !== 'undefined') {
    module.exports.versionCheck = versionCheck;
  } else {
    throw 'leap.js not included';
  }

}).call(this);
