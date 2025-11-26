import React, { useEffect, useState } from 'react';
import {
    Grid2,
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    Card,
    CardMedia,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Modal,

} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

function Feed() {
    const [open, setOpen] = useState(false);
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [feeds, setFeeds] = useState([]);
    const navigate = useNavigate();


    const handleOpen = () => setOpen(true);

    const fnFeeds = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인 후 이용해주세요.");
            navigate("/");
            return;
        }
        const decoded = jwtDecode(token);
        fetch(`http://localhost:3010/feed/${decoded.userId}`)
            .then(res => res.json())
            .then(data => {
                setFeeds(data.list);
                console.log(data);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fnFeeds();
    }, []);

    const handleClickOpen = (feed) => {
        setSelectedFeed(feed);
        setOpen(true);
        setComments([
            { id: 'user1', text: '멋진 사진이에요!' },
            { id: 'user2', text: '이 장소에 가보고 싶네요!' },
            { id: 'user3', text: '아름다운 풍경이네요!' },
        ]);
        setNewComment('');
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedFeed(null);
        setComments([]);
    };

    const handleAddComment = () => {
        if (newComment.trim()) {
            setComments([...comments, { id: 'currentUser', text: newComment }]);
            setNewComment('');
        }
    };

    const handleDelete = (postId) => {
        fetch(`http://localhost:3010/feed/${postId}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
        })
            .then(res => res.json())
            .then(data => {
                alert(data.msg || "삭제되었습니다!");
                setOpen(false);
                fnFeeds();
            })
            .catch(err => console.error(err));
    };

    return (
        <Container maxWidth="md">
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6">SNS</Typography>
                </Toolbar>
            </AppBar>

            <Box mt={4}>
                <Grid2 container spacing={3}>
                    {feeds.length > 0 ? feeds.map(feed => (
                        <Grid2 xs={12} sm={6} md={4} key={feed.post_id}>
                            <Card>
                                {feed.image_url && (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={feed.image_url}
                                        alt="feed image"
                                        onClick={() => handleClickOpen(feed)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                )}
                                <CardContent>
                                    <Typography variant="body2" color="textSecondary">
                                        {feed.content}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid2>
                    )) : "등록된 피드가 없습니다. 피드를 등록해보세요!"}
                </Grid2>
            </Box>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
                <DialogTitle>
                    {selectedFeed?.content}
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close"
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1">{selectedFeed?.content}</Typography>
                        {selectedFeed?.image_url && (
                            <img
                                src={selectedFeed.image_url}
                                alt="feed image"
                                style={{ width: '100%', marginTop: '10px' }}
                            />
                        )}
                    </Box>

                    <Box sx={{ width: '300px', marginLeft: '20px' }}>
                        <Typography variant="h6">댓글</Typography>
                        <List>
                            {comments.map((comment, index) => (
                                <ListItem key={index}>
                                    <ListItemAvatar>
                                        <Avatar>{comment.id.charAt(0).toUpperCase()}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={comment.text} secondary={comment.id} />
                                </ListItem>
                            ))}
                        </List>
                        <TextField
                            label="댓글을 입력하세요"
                            variant="outlined"
                            fullWidth
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddComment}
                            sx={{ marginTop: 1 }}
                        >
                            댓글 추가
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleDelete(selectedFeed.post_id)} variant='contained' color="primary">
                        삭제
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        닫기
                    </Button>
                </DialogActions>
            </Dialog>

            <div>
                <Button onClick={handleOpen}>Open modal</Button>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Text in a modal
                        </Typography>
                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                        </Typography>
                    </Box>


                </Modal>
            </div>

        </Container>
    );
}

export default Feed;
