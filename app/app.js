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
    console.log("connection on"+socket.handshake.address);

    socket.emit('open',"hello from server");

    socket.on('canvas',function(face){
        if(face && typeof face === 'string'){
            if(face.split(',') != null){
                var face = new Buffer(face.split(',')[1],'base64');
                cv.readImage(face,(err,im)=>{

                    im.resize(200,200);

                    var image = im;
                    var faces = []

                    db.connect(DB_URL,(err,db)=>{
                        var collection = db.collection('inf');
                        collection.find({}).toArray((err,doc)=>{

                            console.log(`[${new Date()}]READ ${doc.length} files`);

                            doc.forEach((elem)=>{
                                var base = elem.face;
                                    cv.readImage(new Buffer(base,'base64'),(err,im)=>{
                                        if(err){
                                            console.log(`[${elem.id}]${e}`);
                                        }
                                        console.log(`[PUSHING] ${elem.id}`);
                                        faces.push([elem.id,im]);
                                        if(faces.length == doc.length){
                                            var pca = new cv.FaceRecognizer.createEigenFaceRecognizer();

                                            pca.trainSync(faces);
                                            var result = pca.predictSync(image);
                                            console.log("===========predict==============")
                                            console.log(result);

                                            if(result.confidence>8500){
                                                var buffer = im.toBuffer().toString('base64');
                                                var time   = new Date();

                                                faceUnknown(buffer,time,socket.handshake.address);
                                            }else{
                                                checkTime(result.id,image,doc,socket);
                                            }
                                            db.close();
                                        }
                                    });
                            });

                        })
                    });
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
                            console.log("inserted one unknown face");
                            db.close();
                        });
                    });
}
function checkTime(id,im,doc,socket){
            var emit = true;
            var time = new Date();
            var ip   = socket.handshake.address;
            for(let i=0;i<doc.length;i++){
                if(doc[i].id != id)continue;
                if((new Date(doc[i].time)).getTime()-(new Date()).getTime()<90*60*1000){
                    if(ip===doc[i].ip){
                        emit = false;
                        break;
                    }
                }
            }
            if(emit){
                console.log("emiting>>>>>>>>>>>>>>>>>>>")
                socket.emit('face',{
                            face:im,
                            id:id
                });
            }
//            db.connect(DB_URL,(err,db)=>{
//                        console.log(`[${time}]${ip}:${id}`);
//                        var collection = db.collection('inf');
//                        collection.insert({
//                            face:im,
//                            time:time,
//                            ip:ip,
//                            id:id,
//                            class:id.slice(0,7)
//                        },function(err,result){
//                            console.log("inserted one new face");
//                            db.close();
//                        });
//            });
}




server.listen(8080);
console.log('listening 8080')
