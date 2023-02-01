import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  styled,
  TextField,
  InputAdornment,
  Typography
} from '@mui/material';

import { usePubNub } from 'pubnub-react';
import TitleBar from 'src/components/TitleBar/TitleBar';
import Protection from 'src/roles/protection';
import sendIcon from '../../../assets/icons/chat/send.svg';
import fileUpload from '../../../assets/icons/chat/fileUpload.svg';
import MessageContent from './MessageContent';

const imgStyle = { cursor: 'pointer' };
const Chat = () => {
  const pubnub = usePubNub();
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState('admin');
  const [message, setMessage] = useState([]);
  const [startTime, setStartTime] = useState('');
  const buttonRef = useRef(null);

  const handleFetchMsgs = async () => {
    await pubnub.fetchMessages(
      {
        channels: [channel],
        count: 5,
        start: startTime,
      },
      (status, response) => {
        console.log(response?.channels[channel.replace('@', '%40')], 'response')
        try {
          if (response?.channels[channel.replace('@', '%40')]) {
            setStartTime(response?.channels[channel.replace('@', '%40')][0]?.timetoken)
            // eslint-disable-next-line array-callback-return
            const newMessage = response?.channels[channel.replace('@', '%40')]?.map((each) => {
              if (typeof each.message !== 'object') {
                return {
                  type: "text",
                  message: each.message,
                  sender: each.uuid,
                  timetoken: each.timetoken,
                };
              }
              if (typeof each.message === 'object') {
                const url = pubnub.getFileUrl(
                  { channel, id: each.message.file?.id, name: each.message.file?.name }
                );
                return {
                  type: "file",
                  url,
                  sender: each.uuid,
                  timetoken: each.timetoken,
                  id: each.message.file?.id,
                  name: each.message.file?.name,
                };
              }
            })
            setMessage(messages => [...newMessage, ...messages])
          }
        } catch (status) {
          console.log(status, 'status')
        }
      }
    );
  }

  useEffect(() => {
    pubnub.addListener({ message: handleMessage, file: handleFile });
    pubnub.setUUID(JSON.parse(localStorage.getItem("Email")))
    const id = pubnub.getUUID()
    if (channel === 'admin') {
      const randomName = `${Math.random(0, 10000000).toString()  }john`
      sendMessage(randomName)
    }
  }, [])

  useEffect(() => {
    setChannel(email)
    pubnub.unsubscribe({ channels: ['admin'] });
  }, [email])

  const boxElement = useRef(null);
  const executeScroll = () => {
    boxElement.current.scrollIntoView();
  };
  useEffect(() => {
    console.log(message, 'message')
    if (message.length > 0) {
      executeScroll();
    }
  }, [message]);

  useEffect(() => {
    const Useremail = JSON.parse(localStorage.getItem("Email"));
    setEmail(Useremail)
  }, [])

  const handleMessage = event => {
    console.log(event, 'LISTEN FOR MSGS')
    if (channel) {
      if (event.channel === 'admin') return
      const newMessage = {
        type: "text",
        message: event.message,
        uuid: event.publisher,
        timetoken: event.timetoken,
        sender: event.publisher,
        senderName: event?.userMetadata?.sender?.senderName
      }
      setMessage((prevMessages) => [...prevMessages, newMessage])
    }
  };

  const sendMessage = (message) => {
    const Useremail = JSON.parse(localStorage.getItem("Email"));
    if (message && Useremail) {
      pubnub
        .publish({
          channel, message,
          meta: {
            sender: {
              Useremail,
              displayName: "none"
            }
          }
        })
        .then((res) => {
          setMsg('')
          console.log(res, 'response')
        });
    }
  };

  const handlefileUpload = async (event) => {
    console.log(event, 'file upload event')
    pubnub.sendFile({
      channel,
      file: event.target.files[0],
      meta: {
        sender: { email }
      }
    }).then((res) => {
      console.log(res, 'file upload response')
    })
  }
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && channel) {
      handleFetchMsgs()
    }
  }

  const handleFile = event => {
    console.log(event, 'file listener')
    if (event.channel === 'admin') return
    const newMessage = {
      type: "file",
      ...event?.file,
      uuid: event.publisher,
      timetoken: event.timetoken,
      sender: event?.userMetadata?.sender?.email || email
    };
    setMessage((prevMessages) => [...prevMessages, newMessage])
  }

  useEffect(() => {
    if (channel !== 'admin') {
      pubnub.subscribe({ channels: [channel] });
    }
  }, [channel]);

  useEffect(() => {
    return () => {
      pubnub.removeListener({ message: handleMessage });
      pubnub.removeListener({ file: handleFile });
      pubnub.unsubscribe({ channels: [channel] })
    }
  }, [])


  useEffect(() => {
    // pubnub.deleteMessages(
    //   {
    //     channel: 'admin',
    //   },
    //   (status, response) => {
    //     console.log(status, response, 'delete all msgs');
    //   }
    // );
    // fetch msgs initally and handle text and file
    if (channel && channel !== 'admin') handleFetchMsgs()
  }, [channel])

  return (
    <Protection
      protection={[
        'IBC Phone Application IBC - New IBC GROUP',
        'IBC Phone Application IBC - Self Pricing GROUP'
      ]}
    >
      <TitleBar
        title="New Chat Message"
        bgColor="primary.light"
      />
      <Box sx={{ flexGrow: 1, mt: 1, typography: 'body2' }}>
        {message.length !== 0 ? (
          <>
            <Typography p="5px" textAlign="center">
              {email && email} has started the chat
            </Typography>
            <Box
              sx={{
                height: 'calc(100vh - 350px)',
                overflow: 'auto',
                p: 1
              }}
              onScroll={handleScroll}
            >
              <Grid container spacing={2}>
                {message?.map((item, index) => (
                  <MessageContent message={item} index={index}
                    key={`message${index + 1}`} email={email}
                    channel={channel} pubnub={pubnub} />
                ))}
              </Grid>
              <Box component='div' ref={boxElement}> </Box>
            </Box>
            <Typography p="5px" textAlign="center">
              {email && email} has closed this chat
            </Typography>
          </>
        ) : (
          <Typography
            sx={{
              height: 'calc(100vh - 280px)',
              alignItems: 'flex-end',
              display: 'flex',
              justifyContent: 'center',
              p: '5px'
            }}
          >
            Someone Will Be Right With You
          </Typography>
        )}
        <Box component="form">
          <TextField
            variant="outlined"
            placeholder="Write a message"
            value={msg}
            onKeyDown={e => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              sendMessage(msg);
            }}
            onChange={(e) => setMsg(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" onClick={() => buttonRef.current.click()}>
                  <img
                    src={fileUpload}
                    alt="icon"
                    style={imgStyle}
                  />
                  <input onChange={handlefileUpload}
                    style={{ display: "none" }}
                    type="file" id="myfile"
                    name="myfile" ref={buttonRef} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment
                  position="end"
                  type="submit"
                  component="button"
                  onClick={(e) => {
                    e.preventDefault();
                    sendMessage(msg);
                  }}
                >
                  <img
                    src={sendIcon}
                    alt="icon"
                    style={imgStyle}
                  />
                </InputAdornment>
              )
            }}
          />
        </Box>
      </Box>
    </Protection>
  );
};

export default Chat;
