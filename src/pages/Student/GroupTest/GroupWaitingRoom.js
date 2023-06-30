import { Avatar, Box, Card, CardContent,Grid,Typography } from "@mui/material";
import CardHeader from "@mui/material/CardHeader";
import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
//icon mui
import GroupsTwoToneIcon from '@mui/icons-material/GroupsTwoTone';
import { useEffect, useState } from "react";
import StudentsLounge from "./StudentsLounge";
import { useSelector } from "react-redux";
import { selectUser } from "../../../features/user/userSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { socket } from "../../../app/socket";


export default function GroupWaitingRoom() {
    // const [students, setStudents] = useState([])
    const theme = useTheme()
    const navigate = useNavigate()

    const url = new URL(window.location.href)
    const searchParams = new URLSearchParams(url.search);
    const roomCode = searchParams.get("code");
    console.log("roomCode:", roomCode);

    const user = useSelector(selectUser)
    const location = useLocation();
    console.log("location in student lobby:", location);
    const { state } = location;

    const [peopleList, setPeopleList] = useState(state ? state.peopleList : []);
    const [peopleIndex, setPeopleIndex] = useState("");
    // setPeopleList()
    console.log("peopleList:", peopleList);
    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });
    const [open, setOpen] = React.useState(false);
    const [out, setOut] = React.useState(false);
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
        setOut(false)
    };


    useEffect(() => {
        localStorage.setItem('isStartingTest', undefined);

        if (!state) {
            socket.connect();
        }

        console.log('this [] effect on student lobby is running')

        function onConnect() {
            socket.emit('join-lobby',
                { roomCode: roomCode, email: user.info.email },
                (res) => {
                    console.log('join-lobby', res);
                    if (res.success !== false) {
                        setPeopleList(res);
                    }

                })
        }


        function onLobbyUpdate(arg) {
            console.log('lobby-update:', arg);
            if (arg.join) {
                setPeopleList((list) => [...list, arg.person])
                setPeopleIndex(arg.person)
                setOpen(true)
            } else if (arg.leave) {
                setPeopleList((list) => list.filter(item => item.email !== arg.email))
                setPeopleIndex(arg.email)
                setOut(true)
            }
        }

        function onStartTest(arg) {
            console.log('start-test:', arg);
            localStorage.setItem('isStartingTest', true);
            navigate('/groupTestTaking', {
                state: {
                    test: arg.test,
                    roomCode: roomCode
                }
            })
        }
        if (!state) {
            socket.on('connect', onConnect);
        }

        socket.on('lobby-update', onLobbyUpdate);
        socket.on('start-test', onStartTest);


        return () => {
            console.log('return for this [] effect on student lobby is running')

            socket.off('connect', onConnect);
            socket.off('lobby-update', onLobbyUpdate);
            socket.off('start-test', onStartTest);

            console.log("isStartingTest:", localStorage.getItem('isStartingTest'));
            if (localStorage.getItem('isStartingTest') !== 'true') {
                console.log("isStartingTest:", localStorage.getItem('isStartingTest'));
                console.log('socket disconnecting')
                socket.disconnect();
            }
        }

    }, [])

    return (
        <>
            <Box
                sx={{
                    p: 3,

                    margin: 'auto',
                    // transform: "scale(1.2)"
                    borderWidth: '0px',
                    [theme.breakpoints.up('md')]: {
                        // backgroundColor: theme.palette.primary.main,
                        maxWidth: '1200px',
                        p: 10,
                    },
                }}>

                <Grid container
                    // spacing={3}
                    sx={{
                        pb: 3,
                    }}
                >
                    <Grid item xs={8} sx={{ pr: 3 }}>
                        <Card sx={{
                            // pb: "24px",
                            height: "100%"
                        }}>
                            <CardHeader
                                avatar={
                                    <Avatar
                                        src="/assets/images/avatars/avatar_default.jpg"
                                        alt="photoURL"
                                        sx={{ height: '80px', width: '80px' }}
                                    />}
                                title={user.info.email}
                                subheader="You"
                                titleTypographyProps={{
                                    variant: 'h4'
                                }}
                                subheaderTypographyProps={{
                                    variant: 'h5'
                                }}
                                sx={{
                                    p: 5
                                }}
                            />
                        </Card>
                    </Grid>

                    <Grid item xs={4}>
                        <Card
                            sx={{
                                // display: "flex",
                                // justifyContent: "center",
                                // alignItems: "center",
                                height: "100%",
                                textAlign: 'center',
                            }}>
                            <CardContent
                                sx={{ pt: 5 }}
                            >
                                <Typography variant="h4" color="text.secondary" gutterBottom>
                                    JOIN CODE
                                </Typography>
                                <Typography variant="h3" component="div">
                                    {roomCode}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>

                <Grid container
                >

                    <Grid item xs={10}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                        }}>
                        <Typography variant="h4">
                            Waiting for the host to start....
                        </Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <Card sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%"
                        }}>
                            <Box sx={{
                                display: "flex", alignItems: "center",
                                py: 1
                            }}>
                                <GroupsTwoToneIcon fontSize='large' />
                                <Typography variant='h4' sx={{ ml: "4px" }}>{peopleList.length}</Typography>
                            </Box>
                        </Card>
                    </Grid>

                </Grid>

            </Box>
            <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="info" color="primary" sx={{ width: '100%' }}>
                    {console.log("peopleIndex",peopleIndex)}
                    { peopleIndex &&
                     <span> Tài khoản {peopleIndex.email} vừa tham gia phòng chờ ! </span>
                     }
                </Alert>
            </Snackbar>
            <Snackbar open={out} autoHideDuration={2000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="warning"  sx={{ width: '100%' }}>
                    {console.log("peopleIndex",peopleIndex)}
                    { peopleIndex &&
                     <span> Tài khoản {peopleIndex} vừa rời khỏi phòng chờ ! </span>
                     }
                </Alert>
            </Snackbar>
            {peopleList.length > 1?
            <StudentsLounge peopleList={peopleList.filter(item => item.email !== user.info.email)} />:<h2>Bạn là người tham gia đầu tiên ...</h2>
        }
        </>
    )
}