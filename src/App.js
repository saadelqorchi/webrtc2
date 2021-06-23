import React, { Component } from 'react';

import io from 'socket.io-client'

class App extends Component {
  constructor(props) {
    super(props)

    // https://reactjs.org/docs/refs-and-the-dom.html
    this.localVideoref = React.createRef()
    this.remoteVideoref = React.createRef()
    this.state={
      candidateToAdmin:''
    }
      
    

    this.socket = null
    this.candidates = []
  }

  componentDidMount = () => {

    this.socket = io.connect(
      'http://scholar.ddns.net:4040/webrtcPeer',
      {
        path: '/io/webrtc',
        query: {}
      }
    )

    this.socket.on('connection-success', success => {
      console.log(success)
    })
    this.socket.on('connect_failed', err => {console.log('connection failed Le serveur est indisponible', err);
       });

    this.socket.on('connect_error', err => {
      console.log('connection error Le serveur est indisponible',err);
      // navigator.mediaDevices.enumerateDevices().then(devices => 
      //   devices.forEach(device => console.log(device.label)))
      navigator.mediaDevices.getUserMedia(constraints)
    .then(success)
    .catch(failure)

    } )
   // socket.on('disconnect', err => handleErrors(err));

    this.createAnswerNew = () => {

      console.log('creating Answer .....')
      this.pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp2 => {
        // console.log(JSON.stringify(sdp))

        // set answer sdp as local description
        this.pc.setLocalDescription(sdp2)

        this.socket.emit('Answer', {
        
          sdp: sdp2
        })
        console.log('Answer Sent')
    })

    }

    this.sendCandidateToAdmin=()=>{
    

    }


    this.socket.on('Offer', (sdp) => {
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log('Offer received');
      this.createAnswerNew();
      

    })

    this.socket.on('offerOrAnswer', (sdp) => {

      this.textref.value = JSON.stringify(sdp)

      // set sdp as remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })

    // this.socket.on('iceCandidateFromAdmin', (candidate) => {
      
    //   // console.log('From Peer... ', JSON.stringify(candidate))
    //   // this.candidates = [...this.candidates, candidate]
    //   this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    // })

    this.socket.on('iceCandidateFromAdmin', (candidate) => {
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      this.sendCandidateToAdmin();
    })

    // const pc_config = null

    const pc_config = {
      "iceServers": [
        // {
        //   urls: 'stun:[STUN_IP]:[PORT]',
        //   'credentials': '[YOR CREDENTIALS]',
        //   'username': '[USERNAME]'
        // },
        {
          urls : 'stun:stun.l.google.com:19302'
        }
      ]
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
    // create an instance of RTCPeerConnection
    this.pc = new RTCPeerConnection(pc_config)

    // triggered when a new candidate is returned
    this.pc.onicecandidate = (e) => {

     
      // send the candidates to the remote peer
      // see addCandidate below to be triggered on the remote peer
      if (e.candidate) {
        // console.log(JSON.stringify(e.candidate))

        console.log('sending candidate to admin....');
        this.socket.emit('candidateToAdmin', e.candidate)
        console.log('candidateToAdmin SENT')
        // this.sendToPeer('candidate', e.candidate)
      }
    }

    // triggered when there is a change in connection state
    this.pc.oniceconnectionstatechange = (e) => {
      console.log(e)
    }

    // triggered when a stream is added to pc, see below - this.pc.addStream(stream)
    // this.pc.onaddstream = (e) => {
    //   this.remoteVideoref.current.srcObject = e.stream
    // }

    this.pc.ontrack = (e) => {
      debugger
      this.remoteVideoref.current.srcObject = e.streams[0]
    }

    // called when getUserMedia() successfully returns - see below
    // getUserMedia() returns a MediaStream object (https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
    const success = (stream) => {
      window.localStream = stream
      this.localVideoref.current.srcObject = stream
      this.pc.addStream(stream)
    }

    // called when getUserMedia() fails - see below
    const failure = (e) => {
      console.log('getUserMedia Error: ', e)
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // see the above link for more constraint options
    const constraints = {
       audio: true,
      video: true,
      // video: {
      //   width: 1280,
      //   height: 720
      // },
      // video: {
      //   width: { min: 1280 },
      // }
      options: {
        mirror: true,
      }
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  
  }

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload
    })
  }

  /* ACTION METHODS FROM THE BUTTONS ON SCREEN */

  createOffer = () => {
    console.log('Offer')

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
    // initiates the creation of SDP
    this.pc.createOffer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        // console.log(JSON.stringify(sdp))

        // set offer sdp as local description
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)
    })
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
  // creates an SDP answer to an offer received from remote peer
  createAnswer = () => {
    console.log('Answer')
    this.pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        // console.log(JSON.stringify(sdp))

        // set answer sdp as local description
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)
    })
  }

  setRemoteDescription = () => {
    // retrieve and parse the SDP copied from the remote peer
    const desc = JSON.parse(this.textref.value)

    // set sdp as remote description
    this.pc.setRemoteDescription(new RTCSessionDescription(desc))
  }

  addCandidate = () => {
    // retrieve and parse the Candidate copied from the remote peer
    // const candidate = JSON.parse(this.textref.value)
    // console.log('Adding candidate:', candidate)

    // add the candidate to the peer connection
    // this.pc.addIceCandidate(new RTCIceCandidate(candidate))

    this.candidates.forEach(candidate => {
      console.log(JSON.stringify(candidate))
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    });
  }

  render() {

    return (
      <div style={{width:'100%', height:'100%', backgroundColor:'#CEFFF1'}}>
        <video
          style={{
            width: 240,
            height: 240,
            margin: 5,
            backgroundColor: 'black',
            position:'absolute',
            bottom:15,
            right:15
          }}
          ref={ this.localVideoref }
          autoPlay muted>
        </video>

        <video
          style={{
            width: '100%',
            height: '100%',
            margin: 0,
            backgroundColor: '#CEFFF1'
          }}
          ref={ this.remoteVideoref }
          autoPlay>
        </video>
        <img src={require('./scholartransparent.png')} style={{height:60, maxWidth:200, position:'absolute', left:15, top:15, objectFit:'contain'}} />

    

       

     

       
      </div>
    )
  }
}

export default App;