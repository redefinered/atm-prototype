/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

import React, {
  useState,
  useRef,
  useEffect,
  MutableRefObject,
  useContext
} from 'react';
import {
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TouchableOpacity
} from 'react-native';

import {io} from 'socket.io-client';
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
  mediaDevices
} from 'react-native-webrtc';

import TextInputContainer from './text-input-container';
import CallAnswer from './assets/CallAnswer';
import CallEnd from './assets/CallEnd';
import {createId} from './create-id.util';

import MicOn from './assets/MicOn';
import MicOff from './assets/MicOff';
import VideoOn from './assets/VideoOn';
import VideoOff from './assets/VideoOff';
import CameraSwitch from './assets/CameraSwitch';
import PodcastPlay from './assets/PodcastPlay';
import PodcastPause from './assets/PodcastPause';

import IconContainer from './icon-container';
import InCallManager from 'react-native-incall-manager';
import axios, {AxiosError} from 'axios';
import {AuthContext} from './auth-context';

export default function CallScreen({}) {
  const [type, setType] = useState<any>('JOIN');
  // const [type, setType] = useState<any>('WEBRTC_ROOM');
  const {token} = useContext(AuthContext);

  let remoteRTCMessage = useRef();
  const otherUserId = useRef(null);

  const [callerId] = useState<string>(createId());
  const socket = useRef<any>();

  // Stream of local user
  const [localStream, setlocalStream] = useState<MediaStream | null>(null);

  /* When a call is connected, the video stream from the receiver is appended to this state in the stream*/
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Handling Mic status
  const [localMicOn, setlocalMicOn] = useState<any>(true);

  // Handling Camera status
  const [localWebcamOn, setlocalWebcamOn] = useState<any>(true);

  // Switch Camera
  function switchCamera() {
    localStream
      ?.getVideoTracks()
      .forEach((track: {_switchCamera: () => void}) => {
        track._switchCamera();
      });
  }

  // Enable/Disable Camera
  function toggleCamera() {
    localWebcamOn ? setlocalWebcamOn(false) : setlocalWebcamOn(true);
    localStream?.getVideoTracks().forEach((track: {enabled: boolean}) => {
      localWebcamOn ? (track.enabled = false) : (track.enabled = true);
    });
  }

  // Enable/Disable Mic
  function toggleMic() {
    localMicOn ? setlocalMicOn(false) : setlocalMicOn(true);
    localStream?.getAudioTracks().forEach((track: {enabled: boolean}) => {
      localMicOn ? (track.enabled = false) : (track.enabled = true);
    });
  }

  // Destroy WebRTC Connection
  function leave() {
    peerConnection.current?.close();
    setlocalStream(null);
    setType('JOIN');
  }

  /* This creates an WebRTC Peer Connection, which will be used to set local/remote descriptions and offers. */
  const peerConnection: MutableRefObject<RTCPeerConnection | null> = useRef(
    new RTCPeerConnection({
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
    })
  );

  useEffect(() => {
    if (callerId === '0') return;

    socket.current = io(process.env.SIGNALLING_SERVER_HOST, {
      transports: ['websocket'],
      query: {
        callerId
        /* We have generated this `callerId` in `JoinScreen` implementation */
      }
    });
  }, [callerId]);

  useEffect(() => {
    localStream?.getTracks().forEach(track => {
      peerConnection.current?.addTrack(track, localStream);
    });
  }, [localStream]);

  // @@START_CALL
  useEffect(() => {
    socket.current.on('newCall', (data: any) => {
      remoteRTCMessage.current = data.rtcMessage;
      otherUserId.current = data.callerId;
      setType('INCOMING_CALL');
    });

    socket.current.on('play', (data: any) => {
      console.log('data on play event', data);
      const getToken = async () => {
        try {
          let reqpayload = JSON.stringify({
            context_uri: 'spotify:album:5ht7ItJgpBH7W6vJ5BqpPr',
            offset: {
              position: 5
            },
            position_ms: 0
          });

          let config = {
            method: 'put',
            url: 'https://api.spotify.com/v1/me/player/play',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            data: reqpayload
          };

          const response = await axios.request(config);

          console.log('play call response: ', response?.data);
        } catch (error) {
          // 401
          console.log({error});
        }
      };

      getToken();
    });

    socket.current.on('pause', (data: any) => {
      console.log('data on pause event', data);
      const getToken = async () => {
        try {
          let reqpayload = JSON.stringify({
            context_uri: 'spotify:album:5ht7ItJgpBH7W6vJ5BqpPr',
            offset: {
              position: 5
            },
            position_ms: 0
          });

          let config = {
            method: 'put',
            url: 'https://api.spotify.com/v1/me/player/pause',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            data: reqpayload
          };

          const response = await axios.request(config);

          console.log('pause call response: ', response?.data);
        } catch (error) {
          // 401
          console.log({error});
        }
      };

      getToken();
    });

    socket.current.on('callAnswered', (data: any) => {
      /* This event occurs whenever remote peer accept the call. */
      remoteRTCMessage.current = data.rtcMessage;
      peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current)
      );
      setType('WEBRTC_ROOM');
    });

    socket.current.on('ICEcandidate', (data: any) => {
      console.log('on ICEcandidate event');
      /* This event is for exchangin Candidates. */
      let message = data.rtcMessage;

      if (peerConnection.current) {
        peerConnection?.current
          .addIceCandidate(new RTCIceCandidate(message.candidate))
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow
          .then((data: any) => {
            console.log('SUCCESS');
          })
          .catch((err: any) => {
            console.log('Error', err);
          });
      }
    });

    let isFront = false;

    /*The MediaDevices interface allows you to access connected media inputs such as cameras and microphones. We ask the user for permission to access those media inputs by invoking the mediaDevices.getUserMedia() method. */
    mediaDevices.enumerateDevices().then((sourceInfos: any) => {
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind === 'videoinput' &&
          sourceInfo.facing === (isFront ? 'user' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            mandatory: {
              minWidth: 500, // Provide your own width, height and frame rate here
              minHeight: 300,
              minFrameRate: 30
            },
            facingMode: isFront ? 'user' : 'environment',
            optional: videoSourceId ? [{sourceId: videoSourceId}] : []
          }
        })
        .then((stream: any) => {
          // Get local stream!
          setlocalStream(stream);

          // setup stream listening
          // peerConnection.current?.addStream(stream);

          // FIX add stream not does not work when local stream is set
          /// do it in a useEffect block
        })
        .catch((error: any) => {
          // Log error
          console.log('Error: getUserMedia error', {error});
        });
    });

    // peerConnection.current?.onaddstream = (event: {
    //   stream: React.SetStateAction<null>;
    // }) => {
    //   console.log('call is connected');
    //   setRemoteStream(event.stream);
    // };

    peerConnection.current?.addEventListener('onaddstream', (event: any) => {
      console.log('call is connected');
      setRemoteStream(event.stream);
    });

    peerConnection.current?.addEventListener('connectionstatechange', () => {
      console.log('connection state', peerConnection.current?.connectionState);
    });

    // Setup ice handling
    peerConnection.current?.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        // Alice sends serialized candidate data to Bob using Socket
        sendICEcandidate({
          calleeId: otherUserId.current,
          rtcMessage: {
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          }
        });
      } else {
        console.log('End of candidates.');
      }
    });

    return () => {
      socket.current.off('newCall');
      socket.current.off('callAnswered');
      socket.current.off('ICEcandidate');
    };
  }, []);

  useEffect(() => {
    InCallManager.start();
    InCallManager.setKeepScreenOn(true);
    InCallManager.setForceSpeakerphoneOn(true);

    return () => {
      InCallManager.stop();
    };
  }, []);

  function sendICEcandidate(data: {
    calleeId: null;
    rtcMessage: {label: any; id: any; candidate: any};
  }) {
    socket.current.emit('ICEcandidate', data);
  }

  async function processCall() {
    // 1. Alice runs the `createOffer` method for getting SDP.
    const sessionDescription = await peerConnection.current?.createOffer({});

    // 2. Alice sets the local description using `setLocalDescription`.
    await peerConnection.current?.setLocalDescription(sessionDescription);

    // 3. Send this session description to Bob uisng socket
    sendCall({
      calleeId: otherUserId.current,
      rtcMessage: sessionDescription
    });
  }

  async function processAccept() {
    // 4. Bob sets the description, Alice sent him as the remote description using `setRemoteDescription()`
    peerConnection.current?.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage.current)
    );

    // 5. Bob runs the `createAnswer` method
    const sessionDescription = await peerConnection.current?.createAnswer();

    // 6. Bob sets that as the local description and sends it to Alice
    await peerConnection.current?.setLocalDescription(sessionDescription);
    answerCall({
      callerId: otherUserId.current,
      rtcMessage: sessionDescription
    });
  }

  function answerCall(data: {callerId: null; rtcMessage: any}) {
    socket.current.emit('answerCall', data);
  }

  function sendCall(data: {calleeId: null; rtcMessage: any}) {
    socket.current.emit('call', data);
  }

  function podcastPlay() {
    const data = {
      calleeId: otherUserId.current
    };
    socket.current.emit('play', data);
  }

  function podcastPause() {
    const data = {
      calleeId: otherUserId.current
    };
    socket.current.emit('pause', data);
  }

  const WebrtcRoomScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#050A0E',
          paddingHorizontal: 12,
          paddingVertical: 12
        }}>
        {localStream ? (
          <RTCView
            objectFit={'cover'}
            style={{flex: 1, backgroundColor: '#050A0E'}}
            streamURL={localStream.toURL()}
          />
        ) : null}

        <View
          style={{
            marginVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-evenly'
          }}>
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034'
            }}
            backgroundColor={'transparent'}
            onPress={podcastPlay}
            Icon={() => {
              return <PodcastPlay height={26} width={26} fill="#FFF" />;
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034'
            }}
            backgroundColor={'transparent'}
            onPress={podcastPause}
            Icon={() => {
              return <PodcastPause height={26} width={26} fill="#FFF" />;
            }}
          />
        </View>
        {remoteStream ? (
          <RTCView
            objectFit={'cover'}
            style={{
              flex: 1,
              backgroundColor: '#050A0E',
              marginTop: 8
            }}
            streamURL={remoteStream.toURL()}
          />
        ) : null}
        <View
          style={{
            marginVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-evenly'
          }}>
          <IconContainer
            backgroundColor={'red'}
            onPress={() => {
              leave();
              setlocalStream(null);
            }}
            Icon={() => {
              return <CallEnd height={26} width={26} fill="#FFF" />;
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034'
            }}
            backgroundColor={!localMicOn ? '#fff' : 'transparent'}
            onPress={() => {
              toggleMic();
            }}
            Icon={() => {
              return localMicOn ? (
                <MicOn height={24} width={24} fill="#FFF" />
              ) : (
                <MicOff height={28} width={28} fill="#1D2939" />
              );
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034'
            }}
            backgroundColor={!localWebcamOn ? '#fff' : 'transparent'}
            onPress={() => {
              toggleCamera();
            }}
            Icon={() => {
              return localWebcamOn ? (
                <VideoOn height={24} width={24} fill="#FFF" />
              ) : (
                <VideoOff height={36} width={36} fill="#1D2939" />
              );
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034'
            }}
            backgroundColor={'transparent'}
            onPress={() => {
              switchCamera();
            }}
            Icon={() => {
              return <CameraSwitch height={24} width={24} fill="#FFF" />;
            }}
          />
        </View>
      </View>
    );
  };

  const JoinScreen = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: '#050A0E',
          justifyContent: 'center',
          paddingHorizontal: 42
        }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <>
            <View
              style={{
                padding: 35,
                backgroundColor: '#1A1C22',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 14
              }}>
              <Text
                style={{
                  fontSize: 18,
                  color: '#D0D4DD'
                }}>
                Your Caller ID
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 12,
                  alignItems: 'center'
                }}>
                <Text
                  style={{
                    fontSize: 32,
                    color: '#ffff',
                    letterSpacing: 6
                  }}>
                  {callerId}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#1A1C22',
                padding: 40,
                marginTop: 25,
                justifyContent: 'center',
                borderRadius: 14
              }}>
              <Text
                style={{
                  fontSize: 18,
                  color: '#D0D4DD'
                }}>
                Enter call id of another user
              </Text>
              <TextInputContainer
                placeholder={'Enter Caller ID'}
                value={otherUserId.current}
                setValue={(text: null) => {
                  otherUserId.current = text;
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  setType('OUTGOING_CALL');
                  processCall();
                }}
                style={{
                  height: 50,
                  backgroundColor: '#5568FE',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  marginTop: 16
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#FFFFFF'
                  }}>
                  Call Now
                </Text>
              </TouchableOpacity>
            </View>
          </>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  };

  const OutgoingCallScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'space-around',
          backgroundColor: '#050A0E'
        }}>
        <View
          style={{
            padding: 35,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14
          }}>
          <Text
            style={{
              fontSize: 16,
              color: '#D0D4DD'
            }}>
            Calling to...
          </Text>

          <Text
            style={{
              fontSize: 36,
              marginTop: 12,
              color: '#ffff',
              letterSpacing: 6
            }}>
            {otherUserId.current}
          </Text>
        </View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <TouchableOpacity
            onPress={() => {
              setType('JOIN');
              otherUserId.current = null;
            }}
            style={{
              backgroundColor: '#FF5D5D',
              borderRadius: 30,
              height: 60,
              aspectRatio: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <CallEnd width={50} height={12} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const IncomingCallScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'space-around',
          backgroundColor: '#050A0E'
        }}>
        <View
          style={{
            padding: 35,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14
          }}>
          <Text
            style={{
              fontSize: 36,
              marginTop: 12,
              color: '#ffff'
            }}>
            {otherUserId.current} is calling..
          </Text>
        </View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <TouchableOpacity
            onPress={() => {
              processAccept();
              setType('WEBRTC_ROOM');
            }}
            style={{
              backgroundColor: 'green',
              borderRadius: 30,
              height: 60,
              aspectRatio: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <CallAnswer height={28} fill={'#fff'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  switch (type) {
    case 'JOIN':
      return JoinScreen();
    case 'INCOMING_CALL':
      return IncomingCallScreen();
    case 'OUTGOING_CALL':
      return OutgoingCallScreen();
    case 'WEBRTC_ROOM':
      return WebrtcRoomScreen();
    default:
      return null;
  }
}
