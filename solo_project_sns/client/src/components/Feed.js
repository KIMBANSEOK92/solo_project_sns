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

function Feed() {
  const [open, setOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likeCount, setLikeCount] = useState(0);

  const [feeds, setFeeds] = useState([]);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const navigate = useNavigate();

  // ------------------------------------
  // 전체 피드 조회
  // ------------------------------------
  const fnFeeds = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      navigate("/");
      return;
    }

    fetch("http://localhost:3010/feed")
      .then(res => res.json())
      .then(data => setFeeds(data.list))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fnFeeds();
  }, []);

  // ------------------------------------
  // 모달 열기 + 댓글 / 좋아요 불러오기
  // ------------------------------------
  const handleClickOpen = (feed) => {
    setSelectedFeed(feed);
    setOpen(true);

    // 댓글 불러오기
    fetch(`http://localhost:3010/feed/comments/${feed.post_id}`)
      .then(res => res.json())
      .then(data => setComments(data.list));

    // 좋아요 수 불러오기
    fetch(`http://localhost:3010/feed/likes/${feed.post_id}`)
      .then(res => res.json())
      .then(data => setLikeCount(data.count));
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFeed(null);
    setComments([]);
  };

  // ------------------------------------
  // 댓글 추가
  // ------------------------------------
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);

    fetch("http://localhost:3010/feed/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: selectedFeed.post_id,
        user_id: decoded.userId,
        comment: newComment,
      })
    })
      .then(() => {
        setNewComment("");

        // 댓글 다시 불러오기
        fetch(`http://localhost:3010/feed/comments/${selectedFeed.post_id}`)
          .then(res => res.json())
          .then(data => setComments(data.list));
      });
  };

  // ------------------------------------
  // 좋아요 기능
  // ------------------------------------
  const handleLike = () => {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);

    fetch("http://localhost:3010/feed/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: selectedFeed.post_id,
        user_id: decoded.userId,
      })
    })
      .then(() => {
        fetch(`http://localhost:3010/feed/likes/${selectedFeed.post_id}`)
          .then(res => res.json())
          .then(data => setLikeCount(data.count));
      });
  };

  // ------------------------------------
  // 공유(조회수 증가)
  // ------------------------------------
  const handleShare = () => {
    fetch(`http://localhost:3010/feed/share/${selectedFeed.post_id}`)
      .then(res => res.json())
      .then(data => alert(data.msg));
  };

  // ------------------------------------
  // 피드 삭제
  // ------------------------------------
  const handleDelete = (postId) => {
    fetch(`http://localhost:3010/feed/${postId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    })
      .then(res => res.json())
      .then(data => {
        alert(data.msg);
        setOpen(false);
        fnFeeds();
      });
  };

  // ------------------------------------
  // 게시물 카드 컴포넌트 (CSS 수정 없음)
  // ------------------------------------
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
        <Typography variant="body2">{feed.content}</Typography>
      </CardContent>

      <Box sx={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #ddd', p: 1 }}>
        <Button
          sx={{ color: '#606770' }}
          startIcon={<ThumbUpOutlinedIcon />}
          onClick={() => handleClickOpen(feed)}
        >
          좋아요
        </Button>

        <Button
          sx={{ color: '#606770' }}
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={() => handleClickOpen(feed)}
        >
          댓글
        </Button>

        <Button
          sx={{ color: '#606770' }}
          startIcon={<VisibilityOutlinedIcon />}
          onClick={() => handleClickOpen(feed)}
        >
          공유
        </Button>
      </Box>
    </Card>
  );

  // ------------------------------------
  // 게시물 작성 모달
  // ------------------------------------
  const PostingModal = () => {
    const handlePostFeed = async () => {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);

      const formData = new FormData();
      formData.append("userId", decoded.userId);
      formData.append("content", newPostContent);
      if (selectedFile) formData.append("file", selectedFile);

      fetch("http://localhost:3010/feed", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          alert("피드 등록 완료!");
          setIsPostingModalOpen(false);
          fnFeeds();
        });
    };

    return (
      <Dialog open={isPostingModalOpen} onClose={() => setIsPostingModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>새 게시물 작성</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="무슨 생각을 하고 계신가요?"
            fullWidth
            multiline
            rows={4}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />

          <Button variant="outlined" component="label" sx={{ mt: 2 }}>
            사진/동영상 추가
            <input type="file" hidden onChange={e => setSelectedFile(e.target.files[0])} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPostingModalOpen(false)} color="secondary">취소</Button>
          <Button onClick={handlePostFeed} variant="contained">게시</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ------------------------------------
  // 실제 화면 렌더링
  // ------------------------------------
  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: 'white' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src="cp_logo.png" alt="CP Logo" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#1877f2', fontWeight: 'bold' }}>
              CP (Child Protection)
            </Typography>
          </Box>

          <Box>
            <IconButton color="primary"><ChatBubbleOutlineIcon /></IconButton>
            <IconButton color="primary"><HomeIcon /></IconButton>
            <IconButton color="primary"><NotificationsNoneIcon /></IconButton>
          </Box>

          <Avatar src={USER_PROFILE_SRC} sx={{ width: 40, height: 40 }} />
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ marginTop: '64px', marginLeft: '240px', width: 'calc(100% - 240px)', display: 'flex', justifyContent: 'center', pt: 4 }}>
        <Container maxWidth="sm">
          <Card sx={{ marginBottom: 4, padding: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
              <Avatar src={USER_PROFILE_SRC} sx={{ width: 40, height: 40, mr: 1.5 }} />
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setIsPostingModalOpen(true)}
                sx={{ borderRadius: '20px', backgroundColor: '#f0f2ff' }}
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
            <Box sx={{ textAlign: 'center', mt: 5 }}>
              <Typography>등록된 피드가 없습니다. 피드를 등록해보세요!</Typography>
            </Box>
          )}
        </Container>
      </Box>

      <PostingModal />

      {/* 상세 모달 */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>
          {selectedFeed?.content}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex' }}>
          <Box sx={{ flex: 1 }}>
            <Typography>{selectedFeed?.content}</Typography>
            {selectedFeed?.image_url && <img src={selectedFeed.image_url} style={{ width: '100%', marginTop: 10 }} />}

            <Button sx={{ mt: 2 }} onClick={handleLike}>❤️ 좋아요 ({likeCount})</Button>
            <Button sx={{ mt: 2 }} onClick={handleShare}>🔗 공유</Button>
          </Box>

          <Box sx={{ width: '300px', ml: 2 }}>
            <Typography variant="h6">댓글</Typography>

            <List>
              {comments.map((comment, i) => (
                <ListItem key={i}>
                  <ListItemAvatar>
                    <Avatar>{comment.user_id[0].toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={comment.comment} secondary={comment.user_id} />
                </ListItem>
              ))}
            </List>

            <TextField
              fullWidth
              label="댓글을 입력하세요"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />

            <Button fullWidth sx={{ mt: 1 }} variant="contained" onClick={handleAddComment}>
              댓글 추가
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant='contained' onClick={() => handleDelete(selectedFeed?.post_id)}>삭제</Button>
          <Button onClick={handleClose}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Feed;
