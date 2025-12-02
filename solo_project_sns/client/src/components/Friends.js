import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    Card,
    Button,
    Avatar,
    Grid2,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const USER_PROFILE_SRC = '/mr_kim_profile.jpg';

function Friends() {
    const [users, setUsers] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [friendStatuses, setFriendStatuses] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
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
            const userId = decoded.userId;
            console.log("디코딩된 userId:", userId, "타입:", typeof userId);
            setCurrentUserId(userId); // 타입 변환 없이 그대로 사용
            
            // 현재 사용자 프로필 정보 가져오기
            fetch(`http://localhost:3010/users/${userId}/profile`)
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

    // 전체 유저 조회
    const fnUsers = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        console.log("유저 목록 조회 시작, currentUserId:", currentUserId);

        try {
            const res = await fetch("http://localhost:3010/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!res.ok) {
                console.error("API 응답 오류:", res.status);
                return;
            }

            const data = await res.json();
            console.log("유저 목록 조회 결과:", data);

            if (data.result && data.list) {
                console.log("전체 유저 수:", data.list.length);
                // 현재 로그인 유저 제외
                const filteredUsers = data.list.filter(user => String(user.user_id) !== String(currentUserId));
                console.log("필터링된 유저 수:", filteredUsers.length);
                setUsers(filteredUsers);
                if (currentUserId) checkFriendStatuses(filteredUsers, currentUserId);
            } else {
                console.error("유저 목록 조회 실패:", data.msg);
            }
        } catch (err) {
            console.error("API 통신 오류:", err);
        }
    };

    // 친구 상태 확인
    const checkFriendStatuses = async (userList, userId) => {
        const token = localStorage.getItem("token");
        const statuses = {};

        try {
            const response = await fetch(`http://localhost:3010/friends/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            
            if (!response.ok) {
                console.error("친구 상태 API 오류:", response.status);
                userList.forEach(user => { statuses[user.user_id] = { status: 'none' } });
                setFriendStatuses(statuses);
                return;
            }

            const data = await response.json();

            if (data.result && data.list) {
                userList.forEach(user => {
                    const friendRelation = data.list.find(f => String(f.friend_id) === String(user.user_id));
                    if (friendRelation) {
                        statuses[user.user_id] = {
                            status: friendRelation.status,
                            relation_id: friendRelation.relation_id,
                            isRequester: friendRelation.original_requester_id === userId
                        };
                    } else {
                        statuses[user.user_id] = { status: 'none' };
                    }
                });
            } else {
                userList.forEach(user => { statuses[user.user_id] = { status: 'none' } });
            }
        } catch (err) {
            console.error("친구 상태 확인 오류:", err);
            userList.forEach(user => { statuses[user.user_id] = { status: 'none' } });
        }

        setFriendStatuses(statuses);
    };

    useEffect(() => {
        if (currentUserId) {
            fnUsers();
            fetchNotifications();
            fetchUnreadCount();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId]);

    // 알림 목록 조회
    const fetchNotifications = async () => {
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
    };

    // 읽지 않은 알림 개수 조회
    const fetchUnreadCount = async () => {
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
            console.error("읽지 않은 알림 개수 조회 오류:", err);
        }
    };

    // 친구 요청
    const handleAddFriend = async (receiverId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인 후 이용해주세요.");
            return;
        }

        // 토큰에서 직접 userId 가져오기
        const decoded = jwtDecode(token);
        const senderId = decoded.userId;

        console.log("친구 요청:", { senderId, receiverId, currentUserId });

        try {
            const res = await fetch("http://localhost:3010/friends", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    requester_id: senderId,
                    receiver_id: receiverId,
                })
            });
            
            if (!res.ok) {
                console.error("친구 요청 API 오류:", res.status);
                alert("친구 요청 중 서버 오류가 발생했습니다.");
                return;
            }

            const data = await res.json();
            console.log("친구 요청 결과:", data);
            alert(data.msg);
            if (data.result) {
                fnUsers();
                fetchNotifications();
                fetchUnreadCount();
            }
        } catch (err) {
            console.error("친구 요청 오류:", err);
            alert("친구 요청 중 오류가 발생했습니다.");
        }
    };

    // 친구 요청 수락
    const handleAcceptFriend = async (relationId, notificationId) => {
        const token = localStorage.getItem("token");
        if (!token || !currentUserId) {
            alert("로그인 후 이용해주세요.");
            return;
        }

        console.log("친구 요청 수락:", { relationId });

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
            
            if (!res.ok) {
                console.error("친구 수락 API 오류:", res.status);
                alert("친구 요청 수락 중 서버 오류가 발생했습니다.");
                return;
            }

            const data = await res.json();
            console.log("친구 수락 결과:", data);
            alert(data.msg);
            if (data.result) {
                fnUsers();
                fetchNotifications();
                fetchUnreadCount();
            }
        } catch (err) {
            console.error("친구 요청 수락 오류:", err);
            alert("친구 요청 수락 중 오류가 발생했습니다.");
        }
    };

    // 프로필 메뉴
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleProfileClick = () => { navigate('/MyPage'); handleMenuClose(); };
    const handleLogout = () => { localStorage.removeItem("token"); navigate('/'); handleMenuClose(); };

    // 유저 카드
    const UserCard = ({ user }) => {
        const friendStatus = friendStatuses[user.user_id] || { status: 'none' };

        const getButtonText = () => {
            switch (friendStatus.status) {
                case 'accepted': return '친구';
                case 'pending': return friendStatus.isRequester ? '요청됨' : '요청 수락';
                default: return '친구 추가';
            }
        };

        const getButtonVariant = () => {
            switch (friendStatus.status) {
                case 'accepted': return 'contained';
                case 'pending': return friendStatus.isRequester ? 'outlined' : 'contained';
                default: return 'outlined';
            }
        };

        const getButtonColor = () => {
            switch (friendStatus.status) {
                case 'accepted': return 'success';
                case 'pending': return friendStatus.isRequester ? 'default' : 'primary';
                default: return 'primary';
            }
        };

        const handleButtonClick = () => {
            if (friendStatus.status === 'accepted') {
                alert('이미 친구입니다.');
            } else if (friendStatus.status === 'pending' && !friendStatus.isRequester) {
                // 친구 요청 수락
                handleAcceptFriend(friendStatus.relation_id);
            } else {
                handleAddFriend(user.user_id);
            }
        };

        return (
            <Card sx={{ padding: 2, textAlign: 'center', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <Avatar
                    src={user.profile_img ? `http://localhost:3010/${user.profile_img}` : USER_PROFILE_SRC}
                    sx={{ width: 70, height: 70, margin: '0 auto', mb: 1, bgcolor: '#1877f2' }}
                >
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{user.username}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>{user.email}</Typography>
                {user.region && (
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                        지역: {user.region}
                    </Typography>
                )}
                <Button
                    variant={getButtonVariant()}
                    color={getButtonColor()}
                    sx={{ width: '100%' }}
                    onClick={handleButtonClick}
                    disabled={friendStatus.status === 'accepted' || (friendStatus.status === 'pending' && friendStatus.isRequester)}
                >
                    {getButtonText()}
                </Button>
            </Card>
        );
    };

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
                        <IconButton color="primary" onClick={() => setNotificationMenuOpen(true)}>
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
            <Box component="main" sx={{ marginTop: '64px', marginLeft: '240px', width: 'calc(100% - 240px)', display: 'flex', justifyContent: 'center', padding: 4 }}>
                <Container maxWidth="lg">
                    <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                        알고 싶은 친구를 추가해보세요
                    </Typography>
                    {users.length > 0 ? (
                        <Grid2 container spacing={3}>
                            {users.map((user) => (
                                <Grid2 xs={12} sm={6} md={4} lg={3} key={user.user_id}>
                                    <UserCard user={user} />
                                </Grid2>
                            ))}
                        </Grid2>
                    ) : (
                        <Box sx={{ textAlign: 'center', mt: 6 }}>
                            <Typography variant="h6">등록된 유저가 없거나 불러올 수 없습니다.</Typography>
                            <Button onClick={fnUsers} sx={{ mt: 2 }}>다시 로드하기</Button>
                        </Box>
                    )}
                </Container>
            </Box>

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
                                                handleAcceptFriend(notification.related_id, notification.notification_id);
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

export default Friends;
