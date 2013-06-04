var RiftClient = (function () {
'use strict';

var webSocketPrefix = 'ws://';

var constr = function (rotationCallback) {
  this.rotationCallback = rotationCallback;
  this.webSocketAddress = webSocketPrefix + '127.0.0.1:1981';
  this.connection = null;
  this.enabled = true;
  if (this.enabled) {
    this.init();
  }
};

constr.prototype.retryConnection = function () {
  if (this.enabled) {
    setTimeout(this.init.bind(this), 1000);
  }
};

constr.prototype.init = function () {
  var that = this;
  this.connection = new WebSocket(this.webSocketAddress);

  this.connection.onerror = this.connection.onclose =
    this.retryConnection.bind(this);

  this.connection.onmessage = function (message) {
    var data = JSON.parse('[' + message.data + ']');
    that.rotationCallback(data);
  };
};

constr.prototype.closeConnection = function () {
  if (this.connection) {
    this.connection.close();
  }
};

constr.prototype.setWebSocketAddress = function (address) {
  if (address.indexOf(webSocketPrefix) === -1) {
    address = webSocketPrefix + address;
  }
  this.webSocketAddress = address;
};

return constr;
}());