import cv from 'opencv';
import fs from 'fs';
import koa from 'koa';
import http from 'http';
import mime from 'mime';
import socket from 'socket.io';
import router from 'koa-router';
import serve from 'koa-static';

var app = koa();

app.use(pageNotFound);
app.use(router(app));
app.use(serve('./static'));

var server = http.Server(app.callback());
var io = socket(server);

io.on('connection',function(socket){
    socket.on('canvas',function(face){
        if(face && typeof face === 'string'){
            if(face.split(',') != null){
                cv.readImage(new Buffer(face.split(',')[1],'base64'),(err,im)=>{
                    im.convertGrayscale();
                    im.resize(200,200);
                });
            }
        }
    })
})

app.get('/',function* (next){
    this.response.redirect('/index.html');
});

function *pageNotFound(next){
    yield next;

    if(404 != this.status) return;

    this.status = 404;

    switch (this.accepts('html','json')){
            case 'html':
                this.type = 'html';
                this.body = '<p>Page Not Found</p>';
                break;
            case 'json':
                this.body = {
                    message : 'Page Not Found'
                };
                break;
            default:
                this.type = 'text';
                this.body = 'Page Not Found';
    }
}


server.listen(8080);
console.log('listening 8080')
