import React, { useEffect, useState, useCallback, memo } from 'react';
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
  // Grid2 대신 Grid를 사용하겠습니다.
  Grid, 
  Menu,
  MenuItem,
  Divider,
  Badge
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

// ------------------------------------
// 게시물 카드 컴포넌트
// ------------------------------------
const FeedCard = memo(({ feed, onFeedClick }) => (
  <Card sx={{ marginBottom: 2, borderRadius: '8px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
      <Avatar
        src={feed.profile_img ? `http://localhost:3010${feed.profile_img}` : USER_PROFILE_SRC}
        alt="profile"
        sx={{ width: 32, height: 32, mr: 1 }}
      />
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{feed.username}</Typography>
    </Box>

    {feed.image_url && (
      <CardMedia
        component="img"
        height="auto"
        image={feed.image_url}
        alt="feed image"
        onClick={() => onFeedClick(feed)}
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
        onClick={() => onFeedClick(feed)}
      >
        좋아요
      </Button>

      <Button
        sx={{ color: '#606770' }}
        startIcon={<ChatBubbleOutlineIcon />}
        onClick={() => onFeedClick(feed)}
      >
        댓글
      </Button>

      <Button
        sx={{ color: '#606770' }}
        startIcon={<VisibilityOutlinedIcon />}
        onClick={() => onFeedClick(feed)}
      >
        공유
      </Button>
    </Box>
  </Card>
));

// ------------------------------------
// 게시물 작성 모달
// ------------------------------------
const PostingModal = memo(({ open, onClose, onPost, content, onContentChange, onFileChange }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>새 게시물 작성</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="무슨 생각을 하고 계신가요?"
          fullWidth
          multiline
          rows={4}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
        />

        <Button variant="outlined" component="label" sx={{ mt: 2 }}>
          사진/동영상 추가
          <input type="file" hidden onChange={e => onFileChange(e.target.files[0])} />
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">취소</Button>
        <Button onClick={onPost} variant="contained">게시</Button>
      </DialogActions>
    </Dialog>
  );
});

function Feed() {
  const [open, setOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const [feeds, setFeeds] = useState([]);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editFile, setEditFile] = useState(null);

  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId);
        
        // 현재 사용자 프로필 정보 가져오기
        fetch(`http://localhost:3010/users/${decoded.userId}/profile`)
          .then(res => res.json())
          .then(data => {
            if (data.result && data.user) {
              setCurrentUserProfile(data.user);
            }
          })
          .catch(err => console.error("프로필 조회 실패:", err));

        // 읽지 않은 알림 개수 조회
        fetch("http://localhost:3010/notifications/unread-count", {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.result) {
              setUnreadCount(data.count);
            }
          })
          .catch(err => console.error("알림 개수 조회 실패:", err));
      } catch (err) {
        console.error("토큰 디코딩 실패:", err);
      }
    }
  }, []);

  // 전체 피드 조회
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

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3010/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.result && data.list) {
        setNotifications(data.list);
      }
    } catch (err) {
      console.error("알림 조회 오류:", err);
    }
  }, []);

  // 읽지 않은 알림 개수 갱신
  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3010/notifications/unread-count", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.result) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error("알림 개수 조회 실패:", err);
    }
  }, []);

  // 친구 요청 수락
  const handleAcceptFriend = useCallback(async (relationId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3010/friends/accept", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          relation_id: relationId
        })
      });

      const data = await res.json();
      alert(data.msg);
      if (data.result) {
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (err) {
      console.error("친구 요청 수락 오류:", err);
      alert("친구 요청 수락 중 오류가 발생했습니다.");
    }
  }, [fetchNotifications, fetchUnreadCount]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileClick = () => { navigate('/MyPage'); handleMenuClose(); };
  const handleLogout = () => { localStorage.removeItem("token"); navigate('/'); handleMenuClose(); };

  const handleClickOpen = useCallback((feed) => {
    setSelectedFeed(feed);
    setOpen(true);

    const token = localStorage.getItem("token");

    // 댓글 불러오기
    fetch(`http://localhost:3010/feed/comments/${feed.post_id}`)
      .then(res => res.json())
      .then(data => setComments(data.list));

    // 좋아요 수 및 사용자 좋아요 여부 불러오기
    fetch(`http://localhost:3010/feed/likes/${feed.post_id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setLikeCount(data.count); setIsLiked(data.isLiked || false); });
  }, []);

  const handleClose = () => { setOpen(false); setSelectedFeed(null); setComments([]); };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) { alert("로그인 후 이용해주세요."); return; }
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
        fetch(`http://localhost:3010/feed/comments/${selectedFeed.post_id}`)
          .then(res => res.json())
          .then(data => setComments(data.list));
      })
      .catch(err => { console.error(err); alert("댓글 추가 중 오류가 발생했습니다."); });
  };

  const handleLike = () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("로그인 후 이용해주세요."); return; }
    const decoded = jwtDecode(token);

    fetch("http://localhost:3010/feed/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: selectedFeed.post_id, user_id: decoded.userId })
    })
      .then(res => res.json())
      .then(() => {
        fetch(`http://localhost:3010/feed/likes/${selectedFeed.post_id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => { setLikeCount(data.count); setIsLiked(data.isLiked || false); });
      });
  };

  const handleEditOpen = useCallback((feed) => {
    setEditingFeed(feed);
    setEditContent(feed.content);
    setEditFile(null);
    setIsEditModalOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingFeed(null);
    setEditContent('');
    setEditFile(null);
  }, []);

  const handleEditFeed = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) { alert("로그인 후 이용해주세요."); return; }

    const formData = new FormData();
    formData.append('content', editContent);
    if (editFile) formData.append('file', editFile);

    fetch(`http://localhost:3010/feed/${editingFeed.post_id}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.result) {
          alert(data.msg);
          handleEditClose();
          fnFeeds();
          if (open && selectedFeed && selectedFeed.post_id === editingFeed.post_id) {
            handleClose();
          }
        } else {
          alert(data.msg);
        }
      })
      .catch(err => { console.error(err); alert("게시물 수정 중 오류가 발생했습니다."); });
  }, [editingFeed, editContent, editFile, open, selectedFeed]);

  const handleShare = () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("로그인 후 이용해주세요."); return; }

    fetch(`http://localhost:3010/feed/share/${selectedFeed.post_id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => alert(data.msg || "공유 완료"))
      .catch(err => { console.error(err); alert("공유 중 오류가 발생했습니다."); });
  };

  const handleDelete = (postId) => {
    fetch(`http://localhost:3010/feed/${postId}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    })
      .then(res => res.json())
      .then(data => { alert(data.msg); setOpen(false); fnFeeds(); });
  };

  const handlePostFeed = useCallback(() => {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    const formData = new FormData();
    formData.append("userId", decoded.userId);
    formData.append("content", newPostContent);
    if (selectedFile) formData.append("file", selectedFile);

    fetch("http://localhost:3010/feed", { method: "POST", body: formData })
      .then(res => res.json())
      .then(() => { setIsPostingModalOpen(false); setNewPostContent(''); setSelectedFile(null); fnFeeds(); });
  }, [newPostContent, selectedFile]);

  const handleClosePostingModal = useCallback(() => { setIsPostingModalOpen(false); setNewPostContent(''); setSelectedFile(null); }, []);
  const handleContentChange = useCallback((value) => setNewPostContent(value), []);
  const handleFileChange = useCallback((file) => setSelectedFile(file), []);

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: 'white' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src="cp_logo.png" alt="CP Logo" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#1877f2', fontWeight: 'bold' }}>CP (Child Protection)</Typography>
          </Box>
          <Box>
            <IconButton color="primary" onClick={() => navigate('/messages')}><ChatBubbleOutlineIcon /></IconButton>
            <IconButton color="primary"><HomeIcon /></IconButton>
            <IconButton color="primary" onClick={() => { setNotificationMenuOpen(true); fetchNotifications(); }}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Box>
          <Avatar 
            src={currentUserProfile?.profileImage ? `http://localhost:3010${currentUserProfile.profileImage}` : USER_PROFILE_SRC} 
            sx={{ width: 40, height: 40, cursor: 'pointer' }} 
            onClick={handleMenuOpen} 
          />
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleProfileClick}>마이페이지</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box 
        component="main" 
        sx={{ 
          marginTop: '64px', 
          marginLeft: '240px', 
          width: 'calc(100% - 240px)',
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'flex-start',
          pt: 4,
          pb: 4,
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Container 
          maxWidth="sm" 
          sx={{ 
            width: '100%',
            maxWidth: '600px !important',
            px: { xs: 2, sm: 3 },
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Card sx={{ marginBottom: 4, padding: 1.5, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
              <Avatar 
                src={currentUserProfile?.profileImage ? `http://localhost:3010${currentUserProfile.profileImage}` : USER_PROFILE_SRC} 
                sx={{ width: 40, height: 40, mr: 1.5 }} 
              />
              <Button fullWidth variant="outlined" onClick={() => setIsPostingModalOpen(true)} sx={{ borderRadius: '20px', backgroundColor: '#f0f2ff' }}>
                어떤 이야기를 들려주실건가요?
              </Button>
            </Box>
          </Card>

          {feeds.length > 0 ? (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {feeds.map(feed => (
                <Box key={feed.post_id} sx={{ width: '100%', mb: 2 }}>
                  <FeedCard feed={feed} onFeedClick={handleClickOpen} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 5, width: '100%' }}>
              <Typography>등록된 피드가 없습니다. 피드를 등록해보세요!</Typography>
            </Box>
          )}
        </Container>
      </Box>

      <PostingModal open={isPostingModalOpen} onClose={handleClosePostingModal} onPost={handlePostFeed} content={newPostContent} onContentChange={handleContentChange} onFileChange={handleFileChange} />

      {/* 상세 모달 */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>
          {selectedFeed?.content}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={handleClose}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex' }}>
          <Box sx={{ flex: 1 }}>
            <Typography>{selectedFeed?.content}</Typography>
            {selectedFeed?.image_url && <img src={selectedFeed.image_url} style={{ width: '100%', marginTop: 10 }} />}
            <Button sx={{ mt: 2, color: isLiked ? '#1877f2' : '#606770' }} onClick={handleLike}>
              {isLiked ? '❤️' : '🤍'} 좋아요 ({likeCount})
            </Button>
            <Button sx={{ mt: 2 }} onClick={handleShare}>🔗 공유</Button>
          </Box>

          <Box sx={{ width: '300px', ml: 2 }}>
            <Typography variant="h6">댓글</Typography>

            <List>
              {comments.map((comment, i) => (
                <ListItem key={i}>
                  <ListItemAvatar>
                    <Avatar src={comment.profile_img ? `http://localhost:3010${comment.profile_img}` : USER_PROFILE_SRC} />
                  </ListItemAvatar>
                  <ListItemText primary={comment.comment} secondary={comment.username || comment.user_id} />
                </ListItem>
              ))}
            </List>

            <TextField fullWidth label="댓글을 입력하세요" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <Button fullWidth sx={{ mt: 1 }} variant="contained" onClick={handleAddComment}>댓글 추가</Button>
          </Box>
        </DialogContent>

        <DialogActions>
          {selectedFeed && currentUserId && selectedFeed.user_id === currentUserId && (
            <>
              <Button variant='contained' color="primary" onClick={() => { handleClose(); handleEditOpen(selectedFeed); }}>수정</Button>
              <Button variant='contained' color="error" onClick={() => handleDelete(selectedFeed?.post_id)}>삭제</Button>
            </>
          )}
          <Button onClick={handleClose}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={isEditModalOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle>게시물 수정</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="내용 수정"
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />

          <Button variant="outlined" component="label" sx={{ mt: 2 }}>
            새 사진/동영상 추가
            <input type="file" hidden onChange={e => setEditFile(e.target.files[0])} />
          </Button>
          {editFile && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              선택된 파일: {editFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="secondary">취소</Button>
          <Button onClick={handleEditFeed} variant="contained">수정 완료</Button>
        </DialogActions>
      </Dialog>

      {/* 알림 다이얼로그 */}
      <Dialog 
        open={notificationMenuOpen} 
        onClose={() => setNotificationMenuOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          알림
          <Button 
            size="small" 
            onClick={fetchNotifications}
            sx={{ float: 'right' }}
          >
            새로고침
          </Button>
        </DialogTitle>
        <DialogContent>
          {notifications.length > 0 ? (
            <List>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.notification_id}
                  sx={{ 
                    backgroundColor: notification.is_read ? 'transparent' : '#f0f2ff',
                    mb: 1,
                    borderRadius: 1
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#1877f2' }}>
                      {notification.type === 'friend_request' ? '👤' : '✓'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.created_at).toLocaleString('ko-KR')}
                  />
                  {notification.type === 'friend_request' && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => {
                        handleAcceptFriend(notification.related_id);
                      }}
                      sx={{ ml: 2 }}
                    >
                      수락
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">알림이 없습니다.</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Feed;