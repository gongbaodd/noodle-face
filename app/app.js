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

var io = socket.listen(app).on('connection',(socket)=>{
    socket.on('canvas',(data)=>{
        if(typeof data == 'string'){
            data = data?data.split(',')[1]:data;
            cv.readImage(new Buffer(data,'base64'),(err,im)=>{
               im.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt2.xml',{},(err,faces)=>{
                   if(err)console.log(err);
                   if(faces && faces.length>0){
                       return socket.emit('face',faces);
                   }else{
                       return socket.emit('face',[]);
                   }
               });
            });
        }else{
            return;
        }
    })
})
io.disable('sync disconnect on unload')
io.enable('browser client minification')
io.enable('browser client etag')
io.enable('browser client gzip')
io.enable('log');
io.set('log level', 1)
io.set('transports', [
    'websocket',
  'xhr-polling',
  'jsonp-polling'
])
