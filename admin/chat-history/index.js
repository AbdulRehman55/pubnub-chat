import { Grid } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { usePubNub } from 'pubnub-react';
import moment from "moment";
import { columns } from 'src/columns/chat-history';
import SubHeader from 'src/components/Dashboard/headers/sub-header';
import SwitchCard from 'src/components/Dashboard/SwitchCard/SwitchCard';
import { DynamicTable } from 'src/components/Dashboard/Table/DynamicTable';
import Protection from 'src/roles/protection';
import { chatHistroy } from 'src/_mocks_/dashboard/chat-history';
import MessageContent from '../../web-app/chat/MessageContent';
import ChatHistoryModal from './chat-history-modal';

const ChatHistory = () => {
  const [loading, setLoading] = useState(false);
  const [activeSwitch, setActiveSwitch] = useState(false);
  const [openChatHistoryModal, setOpenChatHistoryModal] =
    useState(false);
  const [channel, setChannel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [message, setMessage] = useState([]);
  const [chatData, setChatData] = useState([])
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('')
  const pubnub = usePubNub();

  
  const handleFetchMsgs = async () => {
    const channelName = channel.replace('@', '%40')
    await pubnub.fetchMessages(
      {
        channels: [channel],
        count: 2,
        start: startTime,
      },
      (status, response) => {
        console.log(response, 'response for fetch msgs')
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
          console.log(status, ' response status')
        }
      }
    );
  }

  const getActiveChannels = async () => {
    await pubnub.fetchMessages(
      { channels: ['admin'] },
      async (status, response) => {
        // console.log(response, 'invitations')
        try {
          const roomsObj = {};

          // eslint-disable-next-line array-callback-return
          response?.channels.admin?.map((obj) => {
            if (!roomsObj[obj.uuid])
              roomsObj[obj.uuid] = { ...obj, name: obj?.uuid, firstName: obj?.message };
          });

          // eslint-disable-next-line no-restricted-syntax, guard-for-in
          for (const room in roomsObj) {
            // eslint-disable-next-line no-await-in-loop
            const timeStamp = await getLastMsgTimeStamp(roomsObj[room]);
            roomsObj[room].timeStamp = +timeStamp;
            if (!timeStamp) {
              delete roomsObj[room];
            }
          }
          const roomArr = Object.keys(roomsObj).map((key) => ({ ...roomsObj[key], ...handleTimeStamps(roomsObj[key].timeStamp) }))
            .sort((roomA, roomB) => ((roomA.timeStamp) < (roomB.timeStamp)) ? 1 : ((roomA.timeStamp) > (roomB.timeStamp)) ? -1 : 0);
          setChatData(roomArr)
          console.log(roomArr?.length,'roomAr length')
        } catch (status) {
          console.log(status, 'get channels error')
        }
      }
    );
  }


  const getLastMsgTimeStamp = async (channel) => {
    try {
      const channelName = channel?.name?.replace('@', '%40');
      const { channels } = await pubnub.fetchMessages(
        {
          channels: [channel?.name],
          count: 1,
        });
      return channels[channelName] && channels[channelName][0] ? channels[channelName][0]?.timetoken : null;
    } catch (error) {
      throw new Error(error)
    }
  }

  // get chat date and time
  const handleTimeStamps = (timeStamp) => {
    const unixTimestamp = timeStamp / 10000000;
    const gmtDate = new Date(unixTimestamp * 1000);
    return {
      chatDate: moment(gmtDate).format('l'),
      chatTime: moment(gmtDate).format('LT')
    }
  }

  const handleOnClickItem = (item) => {
    // console.log(item, 'on click item')
    if (item?.name !== channel) {
      setStartTime('')
      setMessage([])
      setChannel(item?.name);
      setTitle(item?.firstName)
    }
  }

  const handleSwitch = () => {
    setActiveSwitch((current) => !current);
  };

  const handleScroll = (e) => {
    // console.log(e.target.scrollTop, 'scrooll')
    if (e.target.scrollTop === 0) {
      handleFetchMsgs()
    }
  }

  useEffect(() => {
    // pubnub.deleteMessages(
    //   {
    //     channel: 'admin',
    //   },
    //   (status, response) => {
    //     console.log(status, response, 'delete all msgs');
    //   }
    //   );
    const Useremail = JSON.parse(localStorage.getItem("Email"));
    setEmail(Useremail)
    getActiveChannels()
  }, [])

  useEffect(() => {
    handleFetchMsgs()
  }, [channel])

  useEffect(()=>{
    console.log('change in pubnub')
    getActiveChannels()
  },[pubnub])

  return (
    <Protection
      protection={['IBC Phone Application Admin GROUP']}
    >
      <SubHeader
        title="Chat History"
        nodeAfterTitle
      // rightNode={
      //   <SwitchCard
      //     value={activeSwitch}
      //     type="ActiveSwitch"
      //     onChange={() => {
      //       handleSwitch();
      //     }}
      //   />
      // }
      />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <DynamicTable
            isLoading={loading}
            columns={columns()}
            data={chatData}
            onRowClick={(item) => {
              setOpenChatHistoryModal(true)
              handleOnClickItem(item)
            }}
          />
        </Grid>
      </Grid>
      <ChatHistoryModal
        pubnub={pubnub}
        channel={channel}
        email={email}
        title={title}
        messages={message}
        open={openChatHistoryModal}
        handleFetchMsgs={handleFetchMsgs}
        handleClose={() => setOpenChatHistoryModal(false)}
      />
    </Protection>
  );
};

export default ChatHistory;
