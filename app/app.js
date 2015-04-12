import cv from 'opencv';
import fs from 'fs';
import koa from 'koa';
import http from 'http';
import mime from 'mime';
import socket from 'socket.io';
import router from 'koa-router';
import serve from 'koa-static';
import mongo from 'mongodb';

var app = koa();

app.use(pageNotFound);
app.use(router(app));
app.use(serve('./static'));

var server = http.Server(app.callback());
var io = socket(server);

var db = mongo.MongoClient;

const DB_URL = 'mongodb://localhost:27017/faces';

io.on('connection',function(socket){
    socket.on('canvas',function(face){
        if(face && typeof face === 'string'){
            if(face.split(',') != null){
                var face = new Buffer(face.split(',')[1],'base64');
                cv.readImage(face,(err,im)=>{

                    im.resize(200,200);
                    var detected = false;
                    var faces = [];

                    db.connect(DB_URL,(err,db)=>{
                        var collection = db.collection('inf');
                        collection.find({class:1104052}).toArray((err,doc)=>{
                            doc.forEach((elem)=>{
                                var base = elem.face;
                                try{
                                    cv.readImage(new Buffer(base,'base64'),(err,im)=>{
                                        if(err){
                                            console.log(err);
                                            return;
                                        }
                                        faces.push([elem.id,im]);
                                    });
                                }catch(e){
                                    console.log(e);
                                }
                            })
                        })
                    });
                    var pca = new cv.FaceRecognizer.createEigenFaceRecognizer();
                    try{
                        pca.trainSync(faces);
                        var result = pca.predictSync(im);
                        console.log(result);
                    }catch(e){
                        console.log(e);
                    }

                    var buffer = im.toBuffer().toString('base64');
                    var time   = new Date();
                    faceUnknown(buffer,time,socket.handshake.address);

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

function faceUnknown(buffer,time,ip){
       db.connect(DB_URL,(err,db)=>{
                        console.log(`[${time}]${ip}:UNKOWN`);
                        var collection = db.collection('unkown');
                        collection.insert({
                            face:buffer,
                            time:time,
                            ip:ip
                        },function(err,result){
                            console.log("inserted one face");
                            db.close();
                        });
                    });
}




server.listen(8080);
console.log('listening 8080')
