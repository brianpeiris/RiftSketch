// intellisense is IntelliJ's proprietery code highlighting.  This needs a proper name.


angular.module('code-aware', [])
  .directive('editor', function() {
    return {
      restrict: 'E',
      template: '<textarea ng-model="file.contents" ></textarea><canvas  class="some-canvas"></canvas>',
      link: function(scope, element, attrs){

        var textarea = element.find('textarea')[0],
            canvas = element.find('canvas')[0];

        canvas.style.position = "absolute";
        canvas.style.top  = 0;
        canvas.style.left = 0;
        canvas.style.pointerEvents = 'none';
        var ctx = canvas.getContext("2d");
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#777700";
        var lineHeight = parseInt(getComputedStyle(textarea).getPropertyValue('line-height'), 10),
            yOffset = 4,
            characterWidth = 6;

        var clearHighlight = function(){
          ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        };

        // takes in the line number (1-indexed), the characters from the beginning of the line of the start and end of the selection block
        var highlightArea = function(lineNumber, startChar, endChar){
          clearHighlight();

          ctx.fillRect(
            characterWidth * startChar,         // x
            yOffset + lineHeight * lineNumber,  // y
            characterWidth * endChar,           // width
            lineHeight                          // height
          );

        };


        // given a current text area cursor position, this function checks for presence of a Leap-adjustable variable
        // or method, and highlights it appropriately, while setting global state for Leap interaction.


        var currentLine = function(){
          var text = textarea.value;
          var cursor = textarea.selectionStart;

          var charsFromLineStart = 0, charsToLineEnd = text.length, i, lineNumber = 0;

          for (i = cursor; i > charsFromLineStart; i--){
            if (text[i] == "\n"){
              charsFromLineStart = i + 1;
              break;
            }
          }

          for (i = cursor; i < charsToLineEnd; i++){
            if (text[i] == "\n"){
              charsToLineEnd = i;
              break;
            }
          }

          for (i = cursor; i > 0; i--){
            if (text[i] == "\n"){
              lineNumber++;
            }
          }

          return {
            line: text.substring(charsFromLineStart, charsToLineEnd),
            startIndex: charsFromLineStart,
            endIndex: charsToLineEnd,
            lineNumber: lineNumber
        };
        };

        // for now - only matching position variables.
        var regex = /position.set\(([\d\.\s]+?),([\d\.\s]+?),([\d\.\s]+?)\)/g;

        // if the cursor intersects with a match, returns the start and end bounds of the match.
        var getMatch = function(line, cursorPosition){
          // this regex matches a triplet of arguments which can be digits with spaces or dots.

          var lastMatch, endIndex;

          while (lastMatch = regex.exec(line)){
            endIndex = lastMatch.index + lastMatch[0].length;
            if (cursorPosition > lastMatch.index && cursorPosition < endIndex){
              return lastMatch
            }
          }

          return null;
        };

        var highlightTextArea = function (){
          var lineInfo = currentLine(textarea);

          var match = getMatch(
            lineInfo.line,
            textarea.selectionStart - lineInfo.startIndex
          );


          if (match) {
            highlightArea(
              lineInfo.lineNumber,
              match.index + 3,
              match.index + match[0].length + 2
            );
          } else {
            clearHighlight();
          }
        };

        textarea.addEventListener('keydown', highlightTextArea, false);
        textarea.addEventListener('keyup'  , highlightTextArea, false);
        textarea.addEventListener('focus',   highlightTextArea, false);
        textarea.addEventListener('blur',    highlightTextArea, false);
        textarea.addEventListener('click',   highlightTextArea, false);

      }
    };
  });