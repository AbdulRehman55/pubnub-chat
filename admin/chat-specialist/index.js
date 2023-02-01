import {
  Box,
  Button,
  InputAdornment,
  TextField,
  styled,
  Grid,
  Typography,
  List,
  ListItemButton,
} from '@mui/material';
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePubNub } from 'pubnub-react';
import ChatBox from 'src/components/ChatBox/ChatBox';
import SubHeader from 'src/components/Dashboard/headers/sub-header';
import Protection from 'src/roles/protection';
import uploadIcon from '../../../assets/icons/chat/fileUpload.svg';


export const Container = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0px 3px 10px #0000003b',
  borderRadius: '10px',
  width: '100%',
  height: 'calc(78vh - 40px)'
}));
export const ChatContainer = styled(Box)(() => ({
  flex: 1,
  overflowY: 'scroll',
  padding: '30px',
  '&::-webkit-scrollbar': {
    display: 'none'
  }
}));

const ListButton = styled(ListItemButton)((props) => ({
  backgroundColor: props.active && '#1D4E89',
  '&:hover': {
    backgroundColor: props.active ? '#1D4E89' : 'rgba(0, 99, 155, 0.08)',
    color: !props.active && '#1D4E89'
  }
}))

const ChatSpecialist = () => {
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState([]);
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [createdChannels, setCreatedChannels] = useState([])
  const [selected, setSelected] = useState(0);
  const pubnub = usePubNub();
  const buttonRef = useRef(null);
  const boxElement = useRef(null);

  const handleFetchMsgs = async () => {
    // pubnub.deleteMessages(
    //   {
    //     channel: 'admin',
    //   },
    //   (status, response) => {
    //     console.log(status, response, 'delete all msgs');
    //   }
    // );
    // pubnub.deleteMessages(
    //   {
    //     channel: 'PhoneAppUser7@SBGA.COM',
    //   },
    //   (status, response) => {
    //     console.log(status, response, 'delete all msgs');
    //   }
    // );
    // pubnub.deleteMessages(
    //   {
    //     channel: 'PhoneAppUser4@SBGA.COM',
    //   },
    //   (status, response) => {
    //     console.log(status, response, 'delete all msgs');
    //   }
    // );
    const channelName = channel.replace('@', '%40')
    await pubnub.fetchMessages(
      {
        channels: [channel],
        count: 2,
        start: startTime,
      },
      (status, response) => {
        console.log(response, 'response from fetchMessages Api')
        try {
          if (response?.channels[channelName]) {
            setStartTime(response?.channels[channelName][0]?.timetoken)
            // eslint-disable-next-line array-callback-return
            const newMessage = response?.channels[channelName]?.map((each) => {
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

  const executeScroll = () => {
    boxElement.current?.scrollIntoView();
  };

  useEffect(() => {
    if (message.length > 0) {
      executeScroll();
    }
  }, [message]);
  useEffect(() => {
    const Useremail =
      JSON.parse(localStorage.getItem("Email"));
    setEmail(Useremail)
    pubnub.setUUID(Useremail)
    pubnub.addListener({ message: handleMessage, file: handleFile });
    pubnub.subscribe({ channels: ['admin'] });
  }, [])

  // fetch channels
  const handleJoinChannels = async () => {
    await pubnub.fetchMessages(
      { channels: ['admin'] },
      (status, response) => {
        console.log(response, 'invitations')
        try {
          const uniqueChannels = response?.channels?.admin?.reverse().filter((obj, index, self) =>
            self?.map(obj => obj?.uuid).indexOf(obj?.uuid) === index);
          if (uniqueChannels) {
            setCreatedChannels([...uniqueChannels])
            console.log(uniqueChannels, 'sorted channels')
          }
        } catch (status) {
          console.log(status, 'handle join channels error')
        }
      }
    );
  }

  const handleMessage = (event) => {
    console.log(event, 'LISTENER FOR MSGS')
    if (event.channel === 'admin') {
      handleJoinChannels()
      return
    }
    const newMessage = {
      type: "text",
      message: event.message,
      uuid: event.publisher,
      timetoken: event.timetoken,
      sender: event?.userMetadata?.sender?.email
    }
    setMessage((prevMessages) => [...prevMessages, newMessage])
  };

  const sendMessage = (message) => {
    if (message) {
      pubnub
        .publish({
          channel, message,
          meta: {
            sender: { email }
          }
        })
        .then((res) => {
          setInputValue('')
          console.log(res)
        });
    }
  };

  const handlefileUpload = async (event) => {
    console.log(event, 'file upload')
    pubnub.sendFile({
      channel,
      file: event.target.files[0],
      meta: {
        sender: { email }
      }
    }).then((res) => {
      console.log(res, 'response')
    })
  }
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && channel) {
      console.log(e.target.scrollTop, 'e.target.scrollTop')
      handleFetchMsgs()
    }
  }

  const handleFile = event => {
    console.log(event)
    if (event.channel === 'admin') return
    const newMessage = {
      type: "file",
      ...event?.file,
      uuid: event.publisher,
      timetoken: event.timetoken,
      sender: event?.userMetadata?.sender?.email
    };
    setMessage((prevMessages) => [...prevMessages, newMessage])
  }

  const handleOnClickItem = (item) => {
    if (item?.uuid !== channel) {
      setStartTime('')
      setMessage([])
      if (channel) pubnub.unsubscribe({ channels: [channel] })
      setChannel(item?.uuid);
    }
  }

  useEffect(() => {
    if (channel && channel !== 'admin') {
      pubnub.subscribe({ channels: [channel] })
      console.log(message, 'messages')
      handleFetchMsgs()
    }
  }, [channel])

  useEffect(() => {
    return () => {
      pubnub.removeListener({ message: handleMessage });
      pubnub.removeListener({ file: handleFile });
      pubnub.unsubscribe({ channels: [channel] })
      pubnub.unsubscribe({ channels: ['admin'] })
  }
  }, [])

  useEffect(() => {
    if (!channel?.length && createdChannels.length > 0) {
      setChannel(createdChannels[0]?.uuid)
    }
  }, [createdChannels])

  useEffect(() => {
    handleJoinChannels()
  }, [pubnub, channel])


  return (
    <Protection
      protection={['IBC Phone Application Admin GROUP', 'IBC Phone Application Chat Specialist GROUP']}
    >
      {createdChannels.length === 0 && (
        <SubHeader title="No users to display" />
      )}
      {createdChannels.length > 0 && (
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <SubHeader title="Users" />
            <Container>
              <ChatContainer>
                {createdChannels?.map((item, index) => {
                  return (
                    <List key={`item${index + 1}`}>
                      <ListButton active={selected === index} onClick={() => {
                        handleOnClickItem(item)
                        setSelected(index)
                      }}>
                        <Typography variant='subtitle2' sx={selected === index && { color: 'text.secondary' }}>{item?.message}</Typography>
                      </ListButton>
                    </List>
                  )
                })}
              </ChatContainer>
            </Container>
          </Grid>
          {channel && <Grid item xs={8}>
            <SubHeader title="Chat Specialist" />
            <Container>
              <ChatContainer onScroll={handleScroll}>
                {/* {message.length >0  && <Box textAlign='center'>
                  <Button onClick={handleFetchMsgs}>Load More</Button>
                </Box>} */}
                <ChatBox
                  email={email}
                  channel={channel}
                  pubnub={pubnub}
                  message={message}
                  senderColor="#CDCFD3"
                  receiverColor="#EEEFF0"
                />
                <Box ref={boxElement}> </Box>
              </ChatContainer>
              <Box
                component="form"
                sx={{
                  margin: '10px 25px'
                }}
              >
                <TextField
                  variant="outlined"
                  placeholder="Write a message"
                  value={inputValue}
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    sendMessage(inputValue);
                  }}
                  sx={{ input: { padding: '14px' } }}
                  onChange={(e) => setInputValue(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment>
                        <Button
                          sx={{ mr: 1, px: 3 }}
                          variant="contained"
                          color="inherit"
                          onClick={() => buttonRef.current.click()}
                          endIcon={
                            <>
                              <img
                                style={{ width: '65px' }}
                                src={uploadIcon}
                                alt="add"
                              />
                              <input onChange={handlefileUpload}
                                style={{ display: "none" }}
                                type="file" id="myfile"
                                name="myfile" ref={buttonRef} />
                            </>
                          }
                        >
                          Attach
                        </Button>
                        <Button
                          sx={{ px: 6 }}
                          variant="contained"
                          color="primary"
                          type="submit"
                          disabled={inputValue === ''}
                          onClick={(e) => {
                            e.preventDefault();
                            sendMessage(inputValue);
                          }}
                        >
                          Send
                        </Button>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </Container>
          </Grid>}
        </Grid>
      )
      }
    </Protection >
  );
};

export default ChatSpecialist;
