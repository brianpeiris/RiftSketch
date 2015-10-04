###
Emits controller events when a hand enters of leaves the frame
"handLost" and "handFound"
Each event also includes the hand object, which will be invalid for the handLost event.
###

handEntry = ->
  activeHandIds = []

  if Leap.version.major == 0 && Leap.version.minor < 5
    console.warn "The hand entry plugin requires LeapJS 0.5.0 or newer."

  # Note that for multiple devices, this would blink the still connected device's hands out of recognition for a moment. :-/
  @on "deviceStopped",  ->
    `for (var i = 0, len = activeHandIds.length; i < len; i++){
      id = activeHandIds[i];
      activeHandIds.splice(i, 1);
      // this gets executed before the current frame is added to the history.
      this.emit('handLost', this.lastConnectionFrame.hand(id))
      i--;
      len--;
    }`
    return

  {
    frame: (frame)->
      newValidHandIds = frame.hands.map (hand)-> hand.id

      `for (var i = 0, len = activeHandIds.length; i < len; i++){
        id = activeHandIds[i];
        if(  newValidHandIds.indexOf(id) == -1){
          activeHandIds.splice(i, 1);
          // this gets executed before the current frame is added to the history.
          this.emit('handLost', this.frame(1).hand(id));
          i--;
          len--;
        }
      }`

      for id in newValidHandIds
        if activeHandIds.indexOf(id) == -1
          activeHandIds.push id
          @emit('handFound', frame.hand(id))
  }



if (typeof Leap != 'undefined') && Leap.Controller
  Leap.Controller.plugin 'handEntry', handEntry
else if (typeof module != 'undefined')
  module.exports.handEntry = handEntry
else
  throw 'leap.js not included'