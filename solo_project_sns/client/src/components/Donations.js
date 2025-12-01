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
  List,
  ListItem,
  ListItemText,
  Avatar,
  Grid2,
  Menu,
  MenuItem,
  Divider,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from "react-router-dom";

const USER_PROFILE_SRC = "/mr_kim_profile.jpg";

// --------------------------------------------------
// Donation Card (기존 디자인 그대로 유지)
// --------------------------------------------------
const DonationCard = memo(({ donation, onClick }) => (
  <Card sx={{ marginBottom: 2, borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
    <Box sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
      <Avatar
        src={
          donation.profile_image
            ? `http://localhost:3010${donation.profile_image}`
            : USER_PROFILE_SRC
        }
        sx={{ width: 32, height: 32, mr: 1 }}
      />
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        {donation.donor_name}
      </Typography>
    </Box>

    {donation.image_url && (
      <CardMedia
        component="img"
        height="auto"
        image={donation.image_url}
        onClick={() => onClick(donation)}
        style={{ cursor: "pointer", maxHeight: "500px", objectFit: "cover" }}
      />
    )}

    <CardContent>
      <Typography variant="body2" color="text.secondary">
        후원 금액: {donation.amount}원
      </Typography>
      <Typography variant="body2" color="text.secondary">
        후원 날짜: {donation.created_at}
      </Typography>
    </CardContent>

    <Box
      sx={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #ddd", p: 1 }}
    >
      <Button
        sx={{ color: "#606770" }}
        startIcon={<VisibilityOutlinedIcon />}
        onClick={() => onClick(donation)}
      >
        상세보기
      </Button>
    </Box>
  </Card>
));

function Donations() {
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDonate, setOpenDonate] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const decode = token ? jwtDecode(token) : {};
  const userId = decode?.userId;

  const profileImage = decode?.profile_img
    ? `http://localhost:3010${decode.profile_img}`
    : USER_PROFILE_SRC;

  // --------------------------------------------------
  // 후원 목록 불러오기
  // --------------------------------------------------
  const loadDonationList = useCallback(() => {
    fetch("http://localhost:3010/donation/list")
      .then(res => {
        if (!res.ok) throw new Error("서버 오류");
        return res.json();
      })
      .then(data => setDonations(data.list || []))
      .catch(err => console.error("후원 목록 로드 오류:", err));
  }, []);

  useEffect(() => {
    loadDonationList();
  }, [loadDonationList]);

  // --------------------------------------------------
  // 상세보기 모달
  // --------------------------------------------------
  const handleOpenDetail = (donation) => {
    setSelectedDonation(donation);
    setOpenDetail(true);
  };
  const handleCloseDetail = () => setOpenDetail(false);

  // --------------------------------------------------
  // 후원 등록 모달
  // --------------------------------------------------
  const handleOpenDonate = () => setOpenDonate(true);
  const handleCloseDonate = () => {
    setDonationAmount('');
    setDonationMessage('');
    setOpenDonate(false);
  };

  // --------------------------------------------------
  // 후원 등록
  // --------------------------------------------------
  const handleDonate = () => {
    if (!donationAmount) return alert("후원 금액을 입력해주세요.");
    if (!userId) return alert("로그인이 필요합니다.");

    const payload = {
      user_id: userId,
      amount: donationAmount,
      message: donationMessage,
    };

    fetch("http://localhost:3010/donation/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.result) {
          alert("후원이 완료되었습니다!");
          handleCloseDonate();
          loadDonationList();
        } else {
          alert("후원 실패");
        }
      })
      .catch(err => console.error("후원 등록 오류:", err));
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      {/* --------------------------------------------------
          상단바 (기존 디자인 절대 변경 없음)
      -------------------------------------------------- */}
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: "white" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar src="cp_logo.png" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#1877f2", fontWeight: "bold" }}>
              CP (Child Protection)
            </Typography>
          </Box>

          <Box>
            <IconButton><ChatBubbleOutlineIcon /></IconButton>
            <IconButton onClick={() => navigate('/feed')}><HomeIcon /></IconButton>
            <IconButton><NotificationsNoneIcon /></IconButton>
          </Box>

          <Avatar src={profileImage} sx={{ width: 40, height: 40 }} onClick={handleMenuOpen} />

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => navigate('/MyPage')}>마이페이지</MenuItem>
            <Divider />
            <MenuItem onClick={() => { localStorage.removeItem("token"); navigate('/'); }}>
              로그아웃
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* --------------------------------------------------
          메인 콘텐츠 (CSS 변경 없음)
      -------------------------------------------------- */}

      <Box component="main" sx={{ marginTop: "80px", width: "100%", textAlign: "center" }}>

        {/* 🔥 후원하기 버튼 추가 - UI 변경 없음 */}
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 3 }}
          onClick={handleOpenDonate}
        >
          후원하기
        </Button>

        <Container maxWidth="sm">
          {donations.length > 0 ? (
            <Grid2 container spacing={3}>
              {donations.map(donation => (
                <Grid2 item xs={12} key={donation.donation_id}>
                  <DonationCard donation={donation} onClick={handleOpenDetail} />
                </Grid2>
              ))}
            </Grid2>
          ) : (
            <Box sx={{ mt: 5 }}>
              <Typography>등록된 후원 내역이 없습니다.</Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* --------------------------------------------------
          상세보기 모달 (기존 UI 그대로 유지)
      -------------------------------------------------- */}
      <Dialog open={openDetail} onClose={handleCloseDetail} fullWidth maxWidth="md">
        <DialogTitle>
          후원 상세정보
          <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={handleCloseDetail}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {selectedDonation && (
            <>
              <Typography>후원자: {selectedDonation.donor_name}</Typography>
              <Typography>후원 금액: {selectedDonation.amount}원</Typography>
              <Typography>메시지: {selectedDonation.message || "메시지 없음"}</Typography>
              <Typography>날짜: {selectedDonation.created_at}</Typography>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetail}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* --------------------------------------------------
          후원 입력 모달 (기능만 추가, CSS 변경 X)
      -------------------------------------------------- */}
      <Dialog open={openDonate} onClose={handleCloseDonate} fullWidth maxWidth="sm">
        <DialogTitle>
          후원하기
          <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={handleCloseDonate}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <TextField
            label="후원 금액"
            type="number"
            fullWidth
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="후원 메시지 (선택)"
            fullWidth
            multiline
            rows={3}
            value={donationMessage}
            onChange={(e) => setDonationMessage(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={handleDonate}>후원하기</Button>
          <Button onClick={handleCloseDonate}>취소</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Donations;
