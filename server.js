
const express = require('express')

var io = require('socket.io')
({
  path: '/io/webrtc'
})

const app = express()
const port = 8080
var administrator= '';
var clients = new Array();
// let clientsMap = new Map();

// app.get('/', (req, res) => res.send('Hello World!!!!!'))

//https://expressjs.com/en/guide/writing-middleware.html
app.use(express.static(__dirname + '/build'))
app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/build/index.html')
})

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))

io.listen(server)

// default namespace
io.on('connection', socket => {
  console.log('WHAT IM SEARCHING FOR',socket.handshake.query.administrator)

  if(socket.handshake.query.administrator==="administrator"){
    socket.broadcast.to('/webrtcPeer#'+socket.id).emit('clients', clients);

    console.log('kjkjkjkjkj', socket.id)

  }
  


})

// https://www.tutorialspoint.com/socket.io/socket.io_namespaces.htm
const peers = io.of('/webrtcPeer')

// keep a reference of all socket connections
let connectedPeers = new Map()

peers.on('connection', socket => {
  if(socket.handshake.query.administrator==="administrator"){administrator= socket.id;
    console.log('administrator variable', administrator);
    socket.broadcast.to(socket.id).emit('clients', clients);

  }
  else{
    clients.push(socket.id);
   // clients.pop(socket.id);
    // clientsMap.set(socket.id);
    // console.log('clientsMap', clientsMap);
    
    console.log('clients NOW', clients);

    socket.broadcast.to(administrator).emit('clients', clients );

  


  }

 
  console.log('peers on connection',socket.id)
  socket.emit('connection-success', { success: socket.id })

  connectedPeers.set(socket.id, socket)

  socket.on('disconnect', () => {
    console.log('disconnected');
    if(socket.id===administrator){administrator='';}else{ clients.pop(socket.id);}
    
   

    socket.broadcast.to(administrator).emit('clients', clients );



    connectedPeers.delete(socket.id)
  })

  socket.on('OfferToOnePeer', (data) => {
    socket.broadcast.to(data.client).emit('Offer', data.payload);
    console.log('newOfferSENT');
  })

  socket.on('Answer', (data) => {
    socket.broadcast.to(administrator).emit('Answer', data.sdp);
    
    console.log('Answer Sent to admin', administrator)
  })

  socket.on('candidateFromAdmin', (data) =>{
    socket.broadcast.to(data.client).emit('iceCandidateFromAdmin', data.icecandidate)
  })

  socket.on('candidateToAdmin', (data) =>{
    socket.broadcast.to(administrator).emit('iceCandidateToAdmin', data)
  })

  socket.on('offerOrAnswer', (data) => {
    // send to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type)
        socket.emit('offerOrAnswer', data.payload)
      }
    }
  })

  socket.on('candidate', (data) => {
    // send candidate to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload)
        socket.emit('candidate', data.payload)
      }
    }
  })

})