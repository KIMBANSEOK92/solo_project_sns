import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const USER_PROFILE_SRC = '/mr_kim_profile.jpg';

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 로그인 유저 확인
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      navigate("/");
      return;
    }
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
    } catch (err) {
      console.error("토큰 디코딩 실패:", err);
      navigate("/");
    }
  }, [navigate]);

  // 친구 목록 조회
  const fetchFriends = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !currentUserId) return;

    try {
      const res = await fetch(`http://localhost:3010/friends/${currentUserId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.result && data.list) {
        // accepted 상태인 친구만 필터링
        const acceptedFriends = data.list.filter(f => f.status === 'accepted');
        setFriends(acceptedFriends);
      }
    } catch (err) {
      console.error("친구 목록 조회 오류:", err);
    }
  }, [currentUserId]);

  // 대화 목록 조회 (메시지가 있는 대화)
  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3010/messages/conversations", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.result && data.list) {
        setConversations(data.list);
      }
    } catch (err) {
      console.error("대화 목록 조회 오류:", err);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
      fetchConversations();
      // 5초마다 대화 목록 갱신
      const interval = setInterval(() => {
        fetchConversations();
        fetchFriends();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUserId, fetchConversations, fetchFriends]);

  // 특정 사용자와의 메시지 내역 조회
  const fetchMessages = useCallback(async (otherUserId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3010/messages/${otherUserId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.result && data.list) {
        setMessages(data.list);
        // 스크롤을 맨 아래로
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      console.error("메시지 내역 조회 오류:", err);
    }
  }, []);

  // 대화 선택
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedUser({
      user_id: conversation.other_user_id,
      username: conversation.username,
      profile_img: conversation.profile_img
    });
    fetchMessages(conversation.other_user_id);
  }, [fetchMessages]);

  // 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3010/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: selectedUser.user_id,
          content: newMessage
        })
      });
      const data = await res.json();
      if (data.result) {
        setNewMessage('');
        fetchMessages(selectedUser.user_id);
        fetchConversations();
      } else {
        alert(data.msg);
      }
    } catch (err) {
      console.error("메시지 전송 오류:", err);
      alert("메시지 전송 중 오류가 발생했습니다.");
    }
  }, [newMessage, selectedUser, fetchMessages, fetchConversations]);

  // 실시간 메시지 갱신
  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => {
        fetchMessages(selectedUser.user_id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, fetchMessages]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileClick = () => { navigate('/MyPage'); handleMenuClose(); };
  const handleLogout = () => { localStorage.removeItem("token"); navigate('/'); handleMenuClose(); };

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
            <IconButton color="primary" onClick={() => navigate('/feed')}><HomeIcon /></IconButton>
            <IconButton color="primary"><NotificationsNoneIcon /></IconButton>
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
          marginLeft: '120px', 
          width: 'calc(100% - 240px)',
          display: 'flex',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden'
        }}
      >
        {/* 대화 목록 */}
        <Box sx={{ width: '300px', borderRight: '1px solid #ddd', overflow: 'auto', backgroundColor: 'white' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>메시지</Typography>
          </Box>
          <List>
            {/* 친구 목록 표시 */}
            {friends.length > 0 && (
              <>
                <Box sx={{ px: 2, py: 1, backgroundColor: '#a6d0f6ff' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#000000ff' }}>
                    친구 목록
                  </Typography>
                </Box>
                {friends.map((friend) => {
                  const conversationWithFriend = conversations.find(
                    c => c.other_user_id === friend.friend_id
                  );
                  return (
                    <ListItem 
                      key={`friend_${friend.friend_id}`}
                      onClick={() => handleSelectConversation({
                        other_user_id: friend.friend_id,
                        username: friend.username,
                        profile_img: friend.profile_img,
                        unread_count: conversationWithFriend?.unread_count || 0,
                        last_message: conversationWithFriend?.last_message || null
                      })}
                      sx={{ 
                        backgroundColor: selectedUser?.user_id === friend.friend_id ? '#f0f2ff' : 'transparent',
                        '&:hover': { backgroundColor: '#f0f2f5' },
                        cursor: 'pointer'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={conversationWithFriend?.unread_count || 0} color="error">
                          <Avatar 
                            src={friend.profile_img ? `http://localhost:3010${friend.profile_img}` : USER_PROFILE_SRC}
                          />
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={friend.username}
                        secondary={conversationWithFriend?.last_message || '메시지를 시작하세요'}
                        secondaryTypographyProps={{
                          noWrap: true,
                          sx: { maxWidth: '180px' }
                        }}
                      />
                    </ListItem>
                  );
                })}
              </>
            )}

            {/* 최근 대화 (친구가 아닌 사용자) */}
            {conversations.filter(c => !friends.some(f => f.friend_id === c.other_user_id)).length > 0 && (
              <>
                <Box sx={{ px: 2, py: 1, backgroundColor: '#f0f2f5', mt: friends.length > 0 ? 2 : 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#65676b' }}>
                    최근 대화
                  </Typography>
                </Box>
                {conversations
                  .filter(c => !friends.some(f => f.friend_id === c.other_user_id))
                  .map((conversation) => (
                    <ListItem 
                      key={conversation.other_user_id}
                      onClick={() => handleSelectConversation(conversation)}
                      sx={{ 
                        backgroundColor: selectedUser?.user_id === conversation.other_user_id ? '#f0f2ff' : 'transparent',
                        '&:hover': { backgroundColor: '#f0f2f5' },
                        cursor: 'pointer'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={conversation.unread_count || 0} color="error">
                          <Avatar 
                            src={conversation.profile_img ? `http://localhost:3010${conversation.profile_img}` : USER_PROFILE_SRC}
                          />
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={conversation.username}
                        secondary={conversation.last_message || '메시지를 시작하세요'}
                        secondaryTypographyProps={{
                          noWrap: true,
                          sx: { maxWidth: '180px' }
                        }}
                      />
                    </ListItem>
                  ))
                }
              </>
            )}

            {friends.length === 0 && conversations.length === 0 && (
              <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
                <Typography color="textSecondary">친구 또는 대화 내역이 없습니다.</Typography>
                <Typography variant="caption" color="textSecondary">
                  친구를 추가하거나 메시지를 보내보세요!
                </Typography>
              </Box>
            )}
          </List>
        </Box>

        {/* 메시지 영역 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          {selectedUser ? (
            <>
              {/* 헤더 */}
              <Box sx={{ p: 2, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={selectedUser.profile_img ? `http://localhost:3010${selectedUser.profile_img}` : USER_PROFILE_SRC}
                  sx={{ mr: 2 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedUser.username}
                </Typography>
              </Box>

              {/* 메시지 목록 */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                  <Box 
                    key={message.message_id}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: message.sender_id === currentUserId ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    {message.sender_id !== currentUserId && (
                      <Avatar 
                        src={message.sender_profile ? `http://localhost:3010${message.sender_profile}` : USER_PROFILE_SRC}
                        sx={{ width: 32, height: 32, mr: 1 }}
                      />
                    )}
                    <Paper 
                      sx={{ 
                        p: 1.5, 
                        maxWidth: '60%',
                        backgroundColor: message.sender_id === currentUserId ? '#1877f2' : '#f0f2f5',
                        color: message.sender_id === currentUserId ? 'white' : 'black'
                      }}
                    >
                      <Typography variant="body2">{message.content}</Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 0.5, 
                          opacity: 0.7,
                          fontSize: '0.7rem'
                        }}
                      >
                        {new Date(message.created_at).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* 입력 영역 */}
              <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="메시지를 입력하세요..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  multiline
                  maxRows={3}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 80, color: '#ddd', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  대화를 선택하세요
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  왼쪽에서 대화를 선택하거나 새로운 메시지를 시작하세요.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Messages;

