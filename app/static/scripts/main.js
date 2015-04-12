'use strict';
;(function(){
    var faces = [];
    var mainTimer;
    var noDetect = 0;
    var fps = 16;

    var video = document.getElementById('video');
    var canvas= document.getElementById('canvas');

    var ctx = canvas.getContext('2d');
window.onload = function(){
    navigator.getMedia = (navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia);
    navigator.getMedia({video:true,audio:false},function(stream){
        video.src = window.URL.createObjectURL(stream);
    },function(err){console.log(err);});

    var socket = io.connect(top.location.origin);
    socket.on('face',function(im){
        if(!im||im.length === 0){
            if(++noDetect>10){
                noDetect=0;
                faces = [];
            }
            return;
        }
        faces = im;
        console.log(JSON.stringify({faces:{total:faces.length,data:faces}}));
    }).on('disconnect',function(data){
        console.log('disconnected',data);
    });

    function capture() {
        mainTimer = setInterval(function(){
            ctx.drawImage(video,0,0,720,500);
            if(faces && faces.length){
                for(var i in faces){
                    var face = faces[i];

                    ctx.beginPath();
                    ctx.rect(face.x,face.y,face.width,face.height);
                    ctx.fillStyle = 'rgba(46,166,203,0.5)';
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#2ba6cb';
                    ctx.stroke();
                }
            }
            socket.emit('canvas',canvas.toDataURL('image/jpeg'));
        },1000/fps);
    }
     capture();
}
})();
