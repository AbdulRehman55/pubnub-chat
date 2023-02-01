import React from 'react'
import {
    Box,
    Grid,
    styled,
    TextField,
    InputAdornment,
    Typography,
    Button,
} from '@mui/material';

const MessageContent = ({ message, index, email, pubnub, channel }) => {
    const StyleBox = styled(Box)((props) => ({
        backgroundColor: props.sender ? '#67BEB9' : '#eee',
        color: props.sender ? '#fff' : '#000',
        padding: '10px',
        borderRadius: '8px',
        width: 'fit-content',
        maxWidth: '70%',
        lineBreak: 'anywhere',
        marginLeft: props.sender ? 'auto' : '12px',
        marginRight: props.sender ? '12px' : '',
        position: 'relative',
        '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            right: props.sender && '-16px',
            left: !props.sender && '-16px',
            borderBottom: props.sender
                ? '20px solid #67beb9'
                : '20px solid #eee',
            borderRight: props.sender && '25px solid #ff000000',
            borderLeft: !props.sender && '25px solid #ff000000'
        }
    }));

    const handleTime = () => {
        const unixTimestamp = message?.timetoken / 10000000;
        const gmtDate = new Date(unixTimestamp * 1000);
        const localeDateTime = gmtDate.toLocaleString();
        const splitTotalTime = localeDateTime?.split(' ')
        const lastindex = splitTotalTime[1]?.lastIndexOf(':')
        const time = `${splitTotalTime[1]?.slice(0, lastindex)} ${splitTotalTime[2]}`
        return time
    }
    const fileDownload = async (id, name) => {
        console.log(id, name)
        try {
            const result = await pubnub.downloadFile({
                channel,
                id,
                name
            })
            const url = URL.createObjectURL(await result.toBlob());
            const link = document.createElement('a');
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.log(error);
        }
    };
    if (channel === 'admin') return null
    return (
        <Grid item xs={12} key={index}>
            {message.type === 'text' ? <StyleBox sender={message.sender === email}>
                {message.message}
            </StyleBox> :
                <StyleBox sender={message.sender === email}>
                    <Button onClick={() => fileDownload(message?.id, message?.name)}>{message?.name}</Button>
                </StyleBox>
            }
            <Typography
                variant="body2"
                sx={{
                    marginTop: '5px',
                    display: 'flex',
                    justifyContent: message.sender === email
                        ? 'flex-end'
                        : 'flex-start'
                }}
            >
                {handleTime()}
            </Typography>
        </Grid>
    )
}
export default MessageContent
