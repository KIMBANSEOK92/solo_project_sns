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
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

const USER_PROFILE_SRC = '/mr_kim_profile.jpg';
// 임시로 현재 로그인된 사용자 ID를 설정합니다. (실제로는 로그인 API에서 받아와야 함)
const CURRENT_USER_ID = 'test_user_001';

function Feed() {
    // 서버에서 불러온 전체 사용자 목록을 저장할 상태
    const [users, setUsers] = useState([]);

    // ------------------------------------
    // 전체 유저 목록 조회 (서버: GET /users)
    // ------------------------------------
    const fnUsers = () => {
        // 실제로는 인증 토큰을 포함해야 하지만, 여기서는 간결하게 생략합니다.
        fetch("http://localhost:3010/users") // 서버 라우터 경로에 맞게 수정
            .then(res => res.json())
            .then(data => {
                if (data.result && data.list) {
                    // 현재 사용자 자신은 리스트에서 제외
                    const filteredUsers = data.list.filter(user => user.user_id !== CURRENT_USER_ID);
                    setUsers(filteredUsers);
                } else {
                    console.error("유저 목록 조회 실패:", data.msg);
                }
            })
            .catch(err => console.error("API 통신 오류:", err));
    };

    useEffect(() => {
        fnUsers();
    }, []);

    // ------------------------------------
    // 친구 추가/요청 기능 (서버: POST /friends)
    // ------------------------------------
    const handleAddFriend = (receiverId) => {
        // 실제로는 JWT 토큰을 사용하여 요청자를 인증해야 합니다.
        fetch("http://localhost:3010/friends", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requester_id: CURRENT_USER_ID, // 임시 로그인 사용자
                receiver_id: receiverId,
            })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.msg);
                // 요청 후 목록을 다시 로드하여 상태 변화를 반영할 수 있습니다.
                // fnUsers(); 
            })
            .catch(err => console.error("친구 요청 오류:", err));
    };

    // ------------------------------------
    // 유저 삭제 기능 (서버: DELETE /users/:user_id)
    // ------------------------------------
    const handleDeleteUser = (userId) => {
        if (!window.confirm(`${userId} 유저를 영구 삭제하시겠습니까? (테스트용)`)) {
            return;
        }

        fetch(`http://localhost:3010/users/${userId}`, {
            method: "DELETE",
        })
            .then(res => res.json())
            .then(data => {
                alert(data.msg);
                if (data.result) {
                    // 성공 시 리스트 업데이트
                    fnUsers();
                }
            })
            .catch(err => console.error("유저 삭제 오류:", err));
    };

    // ------------------------------------
    // 유저 카드 컴포넌트
    // ------------------------------------
    const UserCard = ({ user }) => (
        <Card
            sx={{
                padding: 2,
                textAlign: 'center',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            <Avatar
                src={user.profile_img || USER_PROFILE_SRC}
                sx={{
                    width: 70,
                    height: 70,
                    margin: '0 auto',
                    mb: 1,
                    bgcolor: '#1877f2', // 이미지가 없을 때 기본 배경색
                }}
            >
                {/* 이미지가 없으면 이름의 첫 글자를 표시 */}
                {user.username ? user.username[0].toUpperCase() : 'U'}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user.username}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {user.email}
            </Typography>

            {/* 친구 추가 버튼 */}
            <Button
                variant="outlined"
                sx={{ width: '100%' }}
                onClick={() => handleAddFriend(user.user_id)}
            >
                친구 요청
            </Button>

            {/* 유저 삭제 버튼 (관리/테스트용) */}
            <Button
                variant="text"
                color="error"
                sx={{ mt: 1, width: '100%', border: '1px solid #ccc' }}
                onClick={() => handleDeleteUser(user.user_id)}
            >
                유저 삭제
            </Button>
        </Card>
    );

    // ------------------------------------
    // 실제 화면 렌더링
    // ------------------------------------
    return (
        <Box
            sx={{
                flexGrow: 1,
                backgroundColor: '#f0f2f5',
                minHeight: '100vh',
                display: 'flex',
            }}
        >

            {/* ======================= 상단 메뉴바 ======================= */}
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


            {/* ======================= 메인 화면 (User Cards) ======================= */}
            <Box
                component="main"
                sx={{
                    marginTop: '64px',
                    marginLeft: '240px', // 좌측 공간 확보
                    width: 'calc(100% - 240px)',
                    display: 'flex',
                    justifyContent: 'center', // 중앙 정렬
                    padding: 4,
                }}
            >
                <Container maxWidth="lg">
                    <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                        👀 찾고 있는 친구
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
                            <Typography variant="h6">
                                등록된 유저가 없거나 불러올 수 없습니다.
                            </Typography>
                            <Button onClick={fnUsers} sx={{ mt: 2 }}>
                                다시 로드하기
                            </Button>
                        </Box>
                    )}
                </Container>
            </Box>
        </Box>
    );
}

export default Feed;