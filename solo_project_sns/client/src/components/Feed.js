import React, { useEffect, useState } from 'react';
import {
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
  Grid2,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const USER_PROFILE_SRC = '/mr_kim_profile.jpg';
const CP_LOGO_SRC = '/cp_logo_small.png';

function Feed() {
  const [open, setOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [feeds, setFeeds] = useState([]);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isComposingComment, setIsComposingComment] = useState(false);
  const [isComposingPost, setIsComposingPost] = useState(false);

  const navigate = useNavigate();

  // 게시물 가져오기
  const fnFeeds = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      navigate("/");
      return;
    }
    const decoded = jwtDecode(token);
    fetch("http://localhost:3010/feed")
      .then(res => res.json())
      .then(data => setFeeds(data.list))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fnFeeds();
  }, []);

  const handleOpenPostingModal = () => setIsPostingModalOpen(true);
  const handleClosePostingModal = () => {
    setIsPostingModalOpen(false);
    setNewPostContent('');
    setSelectedFile(null);
  };

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

  const FeedCard = ({ feed }) => (
    <Card sx={{ marginBottom: 2, borderRadius: '8px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
        <Avatar src={USER_PROFILE_SRC} alt="profile" sx={{ width: 32, height: 32, mr: 1 }} />
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Mr. KIM</Typography>
      </Box>

      {feed.image_url && (
        <CardMedia
          component="img"
          height="auto"
          image={feed.image_url}
          alt="feed image"
          onClick={() => handleClickOpen(feed)}
          style={{ cursor: 'pointer', maxHeight: '500px', objectFit: 'cover' }}
        />
      )}
      <CardContent>
        <Typography variant="body2" color="textPrimary">{feed.content}</Typography>
      </CardContent>

      <Box sx={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #ddd', p: 1 }}>
        <Button sx={{ color: '#606770' }} startIcon={<ThumbUpOutlinedIcon />}>좋아요</Button>
        <Button sx={{ color: '#606770' }} startIcon={<ChatBubbleOutlineIcon />}>댓글</Button>
        <Button sx={{ color: '#606770' }} startIcon={<VisibilityOutlinedIcon />}>공유</Button>
      </Box>
    </Card>
  );

  const PostingModal = () => {
    const handlePostFeed = async () => {
      const token = localStorage.getItem("token");
      if (!token) return alert("로그인 필요");

      const decoded = jwtDecode(token);
      const formData = new FormData();
      formData.append("userId", decoded.userId);
      formData.append("content", newPostContent);
      if (selectedFile) formData.append("file", selectedFile);

      try {
        const res = await fetch("http://localhost:3010/feed", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.result) {
          alert("피드 등록 완료!");
          handleClosePostingModal();
          fnFeeds();
        } else {
          alert("등록 실패: " + data.msg);
        }
      } catch (err) {
        console.error(err);
      }
    };



    return (
      <Dialog open={isPostingModalOpen} onClose={handleClosePostingModal} fullWidth maxWidth="sm">
        <DialogTitle>새 게시물 작성</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="무슨 생각을 하고 계신가요?"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            sx={{ mb: 2 }}
            value={newPostContent}
            onChange={e => !isComposingPost && setNewPostContent(e.target.value)}
            onCompositionStart={() => setIsComposingComment(true)}
            onCompositionEnd={e => { setIsComposingComment(false); setNewComment(e.target.value); }}


          />
          <Button variant="outlined" component="label">
            사진/동영상 추가
            <input type="file" hidden onChange={e => setSelectedFile(e.target.files[0])} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostingModal} color="secondary">취소</Button>
          <Button onClick={handlePostFeed} variant="contained" color="primary">게시</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0, 0, 0, .1)' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: '2000px', width: '100%', margin: '0 auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src="cp_logo.png" alt="CP Logo" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ color: '#1877f2', fontWeight: 'bold', display: { xs: 'none', sm: 'block' } }}>
              CP (Child Protection)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton color="primary"><ChatBubbleOutlineIcon /></IconButton>
            <IconButton color="primary"><HomeIcon /></IconButton>
            <IconButton color="primary"><NotificationsNoneIcon /></IconButton>
          </Box>
          <Avatar src={USER_PROFILE_SRC} alt="User Profile" sx={{ width: 40, height: 40 }} />
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{
        marginTop: '64px',
        marginLeft: '240px',
        width: 'calc(100% - 240px)',
        display: 'flex',
        justifyContent: 'center',
        pt: 4,
      }}>
        <Container maxWidth="sm" sx={{ p: 0 }}>
          <Card sx={{ marginBottom: 4, padding: 1.5, borderRadius: '8px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', pb: 1, borderBottom: '1px solid #f0f2f5' }}>
              <Avatar src={USER_PROFILE_SRC} alt="profile" sx={{ width: 40, height: 40, mr: 1.5 }} />
              <Button
                fullWidth
                variant="outlined"
                onClick={handleOpenPostingModal}
                sx={{
                  borderRadius: '20px',
                  justifyContent: 'flex-start',
                  backgroundColor: '#f0f2ff',
                  textTransform: 'none',
                  color: '#606770',
                  fontWeight: 'normal',
                  "&:hover": { backgroundColor: '#e4e6eb' }
                }}
              >
                어떤 이야기를 들려주실건가요?
              </Button>
            </Box>
          </Card>

          {feeds.length > 0 ? (
            <Grid2 container spacing={3}>
              {feeds.map(feed => (
                <Grid2 item xs={12} key={feed.post_id}>
                  <FeedCard feed={feed} />
                </Grid2>
              ))}
            </Grid2>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', mt: 5 }}>
              <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 'normal' }}>
                등록된 피드가 없습니다. 피드를 등록해보세요!
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      <PostingModal />

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>
          {selectedFeed?.content}
          <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close" sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1">{selectedFeed?.content}</Typography>
            {selectedFeed?.image_url && <img src={selectedFeed.image_url} alt="feed image" style={{ width: '100%', marginTop: '10px' }} />}
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
              onChange={e => !isComposingComment && setNewComment(e.target.value)}
              onCompositionStart={() => setIsComposingComment(true)}
              onCompositionEnd={e => { setIsComposingComment(false); setNewComment(e.target.value); }}
            />
            <Button variant="contained" color="primary" sx={{ marginTop: 1 }} onClick={handleAddComment}>
              댓글 추가
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDelete(selectedFeed?.post_id)} variant='contained' color="primary">삭제</Button>
          <Button onClick={handleClose} color="primary">닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Feed;
