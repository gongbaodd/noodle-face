'use strict';
(function(){
    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    var socket = io(top.location.origin);

    var nodetect = 0;

    var tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    tracking.track('#video',tracker,{camera:true});

    tracker.on('track',function(event){
        context.clearRect(0,0,canvas.width,canvas.height);

        event.data.forEach(function(rect){
            _drawFace(context,rect);

            var face = _convertImg(video,rect);

            socket.emit('canvas',face);
        });
    });

    socket.on('face',function(faces){

    });

    function _drawFace(context,rect){
        context.beginPath();
        context.rect(rect.x,rect.y,rect.width,rect.height);
        context.fillStyle = 'rgba(46, 166, 203, 0.5)';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = '#2ba6cb';
        context.stroke();
        context.font = '11px Helvetica';
        context.fillStyle = "#fff";
        context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
        context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
    };
    function _convertImg(video,rect){
        var _canvas = document.createElement('canvas');
        _canvas.width = rect.width;
        _canvas.height= rect.height;
        _canvas.getContext('2d').drawImage(video,rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);

        return _canvas.toDataURL('image/jpg');
    };
})();
