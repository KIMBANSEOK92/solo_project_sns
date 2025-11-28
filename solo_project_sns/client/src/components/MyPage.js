import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Avatar, Grid, Paper, AppBar, Toolbar, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { jwtDecode } from 'jwt-decode';

const USER_PROFILE_SRC = "/mr_kim_profile.jpg";

function MyPage() {
  const [user, setUser] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [donations, setDonations] = useState([]);
  const [reports, setReports] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const fnGetUser = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      navigate("/");
      return;
    }

    const decoded = jwtDecode(token);
    fetch(`http://localhost:3010/users/${decoded.userId}/profile`)
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setFeeds(data.feeds);
        setFriends(data.friends);
        setDonations(data.donations);
        setReports(data.reports);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fnGetUser();
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleProfileClick = () => {
    navigate('/MyPage');
    handleMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate('/');
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: 'white' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src="cp_logo.png" sx={{ width: 40, height: 40, mr: 1 }} />
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
            src={user?.profileImage ? `http://localhost:3010${user.profileImage}` : USER_PROFILE_SRC}
            sx={{ width: 40, height: 40 }}
            onClick={handleMenuOpen}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleProfileClick}>마이페이지</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* 메인 콘텐츠 */}
      <Box
        component="main"
        sx={{
          marginTop: '64px', // 헤더 높이 만큼
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start', // 상단 정렬
          width: '100%',
          minHeight: 'calc(100vh - 64px)', // 헤더 제외
          pt: 4,
          pb: 4
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ padding: '30px', borderRadius: '15px', width: '100%' }}>
            {/* 프로필 정보 상단 */}
            <Box display="flex" flexDirection="column" alignItems="center" sx={{ marginBottom: 3 }}>
              <Avatar
                alt="프로필 이미지"
                src={user?.profileImage ? `http://localhost:3010${user.profileImage}` : USER_PROFILE_SRC}
                sx={{ width: 100, height: 100, marginBottom: 2 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{user?.userName}</Typography>
              <Typography variant="body2" color="text.secondary">@{user?.userId}</Typography>
            </Box>

            {/* 팔로워 / 팔로잉 / 게시물 */}
            <Grid container spacing={2} sx={{ marginTop: 2 }}>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h6">친구 수</Typography>
                <Typography variant="body1">{friends.length}</Typography>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h6">피드 수</Typography>
                <Typography variant="body1">{feeds.length}</Typography>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h6">신고 수</Typography>
                <Typography variant="body1">{reports.length}</Typography>
              </Grid>
            </Grid>

            {/* 내 소개 */}
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>내 소개</Typography>
              <Typography variant="body1">{user?.intro || "소개글이 없습니다."}</Typography>
            </Box>

            {/* 피드 목록 */}
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>내 피드</Typography>
              {feeds.length === 0 ? <Typography variant="body1">피드가 없습니다.</Typography> :
                feeds.map(feed => (
                  <Paper key={feed.post_id} sx={{ padding: 2, marginBottom: 2 }}>
                    <Typography variant="body1">{feed.content}</Typography>
                  </Paper>
                ))}
            </Box>

            {/* 친구 목록 */}
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>친구 목록</Typography>
              {friends.length === 0 ? (
                <Typography variant="body1">친구가 없습니다.</Typography>
              ) : (
                friends.map(friend => (
                  <Paper key={friend.relation_id} sx={{ padding: 2, marginBottom: 2 }}>
                    <Typography variant="body1">
                      {friend.requester_id === user.userId ? `친구 요청 보낸: ${friend.receiver_id}` : `친구 요청 받은: ${friend.requester_id}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">상태: {friend.status}</Typography>
                  </Paper>
                ))
              )}
            </Box>

            {/* 후원 목록 */}
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>후원 내역</Typography>
              {donations.length === 0 ? (
                <Typography variant="body1">후원 내역이 없습니다.</Typography>
              ) : (
                donations.map(donation => (
                  <Paper key={donation.donation_id} sx={{ padding: 2, marginBottom: 2 }}>
                    <Typography variant="body1">후원 금액: {donation.amount}원</Typography>
                    <Typography variant="body2" color="text.secondary">메시지: {donation.message || "없음"}</Typography>
                    <Typography variant="body2" color="text.secondary">후원 날짜: {new Date(donation.created_at).toLocaleDateString()}</Typography>
                  </Paper>
                ))
              )}
            </Box>

            {/* 아동학대 신고 목록 */}
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>아동학대 신고 내역</Typography>
              {reports.length === 0 ? (
                <Typography variant="body1">신고 내역이 없습니다.</Typography>
              ) : (
                reports.map(report => (
                  <Paper key={report.report_id} sx={{ padding: 2, marginBottom: 2 }}>
                    <Typography variant="body1">제목: {report.title}</Typography>
                    <Typography variant="body2" color="text.secondary">상태: {report.status}</Typography>
                    <Typography variant="body2" color="text.secondary">신고 날짜: {new Date(report.reported_at).toLocaleDateString()}</Typography>
                    <Typography variant="body2">{report.description}</Typography>
                  </Paper>
                ))
              )}
            </Box>

          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default MyPage;
