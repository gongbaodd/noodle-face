import cv from 'opencv';
import fs from 'fs';
import http from 'http';
import mime from 'mime';
import socket from 'socket.io';

var app = http.createServer((req,res)=>{
    var file = req.url=='/' ? '/index.html' : req.url;
    console.log(`${req.method}:${file}`);

    fs.readFile(`./static${file}`,(err,data)=>{
       if(err){
           res.write(404);
           return res.end("<h1>HTTP 404 - Not Found</h1>");
       }
        res.writeHead(200,{
            'Content-Type':mime.lookup(`./static${file}`)
        });
        res.end(data);
    });
});

app.listen(8080);
console.log('listening port 8080');

var io = socket.listen(app).on('connection',(socket)=>{
    socket.on('canvas',(data)=>{
        try{
            readCanvas(data,socket);
        }catch(e){
            console.log(e);
            socket.emit('faces',[]);
        }
    })
})


function readCanvas(data,socket) {
    if(typeof data === 'string'){
            var _ref;
            data = data != null ? (_ref = data.split(',')) != null ? _ref[1] : void 0 : void 0;
            return cv.readImage(new Buffer(data,'base64'),(err,im)=>{
                if(err) console.log(err);
               im.detectObject('../node_modules/opencv/data/haarcascade_frontalface_alt.xml',{},(err,faces)=>{
                   if(!((faces != null ? faces.length : void 0)>0)){
                       return socket.emit('faces',[]);
                   }
                   return socket.emit('faces',faces);
               });
            });
        }else{
            return;
        }
}
