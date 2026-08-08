import React, { useState, useRef, useEffect } from "react";

import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton
} from "@mui/material";

import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";


function Chatbot() {


    const [open, setOpen] = useState(false);

    const [message, setMessage] = useState("");

    const [chat, setChat] = useState([]);

    const [loading, setLoading] = useState(false);


    const chatEndRef = useRef(null);



    // Auto scroll messages
    useEffect(() => {

        chatEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [chat]);




    const sendMessage = async () => {


        if (!message.trim())
            return;



        const userMessage = message;


        setChat(prev => [
            ...prev,
            {
                sender: "You",
                text: userMessage
            }
        ]);



        setMessage("");

        setLoading(true);



        try {


            const response = await fetch(

                "http://127.0.0.1:5005/webhooks/rest/webhook",

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },


                    body: JSON.stringify({

                        sender: "react_user",

                        message: userMessage

                    })

                }

            );



            const data = await response.json();



            if (data.length > 0) {


                const botMessages = data.map(item => ({

                    sender: "Bot",

                    text: item.text

                }));


                setChat(prev => [

                    ...prev,

                    ...botMessages

                ]);

            }

            else {


                setChat(prev => [

                    ...prev,

                    {

                        sender: "Bot",

                        text: "I could not understand that."

                    }

                ]);

            }



        }

        catch(error) {


            console.error(
                "Rasa Error:",
                error
            );


            setChat(prev => [

                ...prev,

                {

                    sender: "Bot",

                    text: "Unable to connect to Rasa server."

                }

            ]);

        }



        setLoading(false);

    };





    return (

        <>


            {/* Floating Button */}

            {!open && (


                <IconButton

                    onClick={() => setOpen(true)}

                    sx={{

                        position:"fixed",

                        right:30,

                        bottom:30,

                        width:65,

                        height:65,

                        background:"#2563eb",

                        color:"white",

                        boxShadow:5,


                        "&:hover":{

                            background:"#1d4ed8"

                        }

                    }}

                >

                    <SmartToyIcon fontSize="large"/>


                </IconButton>


            )}






            {/* Chat Window */}

            {open && (


                <Paper

                    sx={{

                        position:"fixed",

                        right:25,

                        bottom:25,

                        width:360,

                        height:500,

                        padding:2,

                        zIndex:3000,

                        display:"flex",

                        flexDirection:"column"

                    }}

                >




                    {/* Header */}

                    <Box

                        sx={{

                            display:"flex",

                            justifyContent:"space-between",

                            alignItems:"center"

                        }}

                    >


                        <Typography

                            variant="h6"

                            fontWeight="bold"

                        >

                            🤖 Analytics Bot

                        </Typography>



                        <IconButton

                            onClick={()=>setOpen(false)}

                        >

                            <CloseIcon/>

                        </IconButton>


                    </Box>







                    {/* Messages */}

                    <Box

                        sx={{

                            flex:1,

                            overflowY:"auto",

                            mt:2

                        }}

                    >



                        {

                            chat.map((item,index)=>(


                                <Typography

                                    key={index}

                                    sx={{

                                        mb:1,

                                        wordBreak:"break-word",

                                        background:

                                            item.sender==="You"

                                            ? "#e0f2fe"

                                            : "#f3f4f6",

                                        padding:1,

                                        borderRadius:2

                                    }}

                                >

                                    <b>

                                        {item.sender}

                                    </b>

                                    :

                                    {" "}

                                    {item.text}


                                </Typography>


                            ))

                        }



                        {

                            loading &&

                            <Typography>

                                Bot is typing...

                            </Typography>

                        }



                        <div ref={chatEndRef}/>


                    </Box>







                    {/* Input */}


                    <TextField

                        fullWidth

                        value={message}


                        onChange={(e)=>

                            setMessage(e.target.value)

                        }


                        onKeyDown={(e)=>{


                            if(e.key==="Enter"){

                                sendMessage();

                            }


                        }}


                        placeholder="Ask about sales, profit, orders..."

                    />





                    <Button

                        variant="contained"

                        fullWidth

                        sx={{

                            mt:1

                        }}


                        onClick={sendMessage}

                    >

                        Send

                    </Button>




                </Paper>


            )}



        </>

    );

}


export default Chatbot;