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
    Divider
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
    const [friendStatuses, setFriendStatuses] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
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
            setCurrentUserId(Number(decoded.userId)); // <-- 숫자로 변환
        } catch (err) {
            console.error("토큰 디코딩 실패:", err);
            navigate("/");
        }
    }, [navigate]);

    // 전체 유저 조회
    const fnUsers = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch("http://localhost:3010/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.result && data.list) {
                // 현재 로그인 유저 제외
                const filteredUsers = data.list.filter(user => String(user.user_id) !== String(currentUserId));
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
        if (currentUserId) fnUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId]);

    // 친구 요청
    const handleAddFriend = async (receiverId) => {
        const token = localStorage.getItem("token");
        if (!token || !currentUserId) {
            alert("로그인 후 이용해주세요.");
            return;
        }

        try {
            const res = await fetch("http://localhost:3010/friends", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    requester_id: currentUserId,
                    receiver_id: receiverId,
                })
            });
            const data = await res.json();
            alert(data.msg);
            if (data.result) fnUsers();
        } catch (err) {
            console.error("친구 요청 오류:", err);
            alert("친구 요청 중 오류가 발생했습니다.");
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
                alert('친구 요청 수락 기능은 추후 구현 예정입니다.');
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
                        <IconButton color="primary"><NotificationsNoneIcon /></IconButton>
                    </Box>
                    <Avatar src={USER_PROFILE_SRC} sx={{ width: 40, height: 40, cursor: 'pointer' }} onClick={handleMenuOpen} />
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
                                <Grid2 item xs={12} sm={6} md={4} lg={3} key={user.user_id}>
                                    <UserCard user={user} />
                                </Grid2>
                            ))}
                        </Grid2>
                    ) : (
                        <Box sx={{ textAlign: 'center', mt: 5 }}>
                            <Typography variant="h6">등록된 유저가 없거나 불러올 수 없습니다.</Typography>
                            <Button onClick={fnUsers} sx={{ mt: 2 }}>다시 로드하기</Button>
                        </Box>
                    )}
                </Container>
            </Box>
        </Box>
    );
}

export default Friends;
