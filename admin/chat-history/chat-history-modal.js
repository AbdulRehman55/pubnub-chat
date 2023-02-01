import { useRef } from 'react'
import ChatBox from 'src/components/ChatBox/ChatBox';
import { Modal } from 'src/components/Dashboard/modal';
import { Box,Button } from '@mui/material'
import { messagesData } from 'src/_mocks_/dashboard/messages';
import { ChatContainer, Container } from '../chat-specialist';

const ChatHistoryModal = ({ open, handleClose, messages, title, handleScroll, pubnub, channel, email,handleFetchMsgs }) => {
  const boxElement = useRef(null);
  return (
    <Modal open={open} title={title} handleClose={handleClose}>
      <Container>
        <ChatContainer >
          {messages.length > 0 && <Box textAlign='center'>
            <Button onClick={handleFetchMsgs}>Load More</Button>
          </Box>}
          <ChatBox
            pubnub={pubnub}
            channel={channel}
            email={email}
            message={messages}
            senderColor="#CDCFD3"
            receiverColor="#EEEFF0"
          />
          <Box ref={boxElement}> </Box>
        </ChatContainer>
      </Container>
    </Modal>
  );
};

export default ChatHistoryModal;
