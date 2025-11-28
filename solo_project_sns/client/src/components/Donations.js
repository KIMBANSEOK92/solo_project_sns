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
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from "react-router-dom";

const USER_PROFILE_SRC = "/mr_kim_profile.jpg";

const DonationCard = memo(({ donation, onClick }) => (
  <Card sx={{ marginBottom: 2, borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
    <Box sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
      <Avatar src={USER_PROFILE_SRC} sx={{ width: 32, height: 32, mr: 1 }} />
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>후원자 정보</Typography>
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
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>{donation.donor_name}</Typography>
      <Typography variant="body2" color="text.secondary">후원 금액: {donation.amount}원</Typography>
      <Typography variant="body2" color="text.secondary">후원 날짜: {donation.date}</Typography>
    </CardContent>

    <Box sx={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #ddd", p: 1 }}>
      <Button sx={{ color: "#606770" }} startIcon={<VisibilityOutlinedIcon />} onClick={() => onClick(donation)}>
        상세보기
      </Button>
    </Box>
  </Card>
));

function Donations() {
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const decode = token ? jwtDecode(token) : {};
  const profileImage = decode?.profileImage ? `http://localhost:3010${decode.profileImage}` : USER_PROFILE_SRC;

  const loadDonationList = useCallback(() => {
    fetch("http://localhost:3010/donation/list")
      .then(res => res.json())
      .then(data => setDonations(data.list || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    loadDonationList();
  }, [loadDonationList]);

  const handleOpenModal = (donation) => {
    setSelectedDonation(donation);
    setOpen(true);
  };
  const handleCloseModal = () => {
    setOpen(false);
    setSelectedDonation(null);
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileClick = () => { navigate('/MyPage'); handleMenuClose(); };
  const handleLogout = () => { localStorage.removeItem("token"); navigate('/'); handleMenuClose(); };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: "white" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar src="cp_logo.png" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#1877f2", fontWeight: "bold" }}>CP (Child Protection)</Typography>
          </Box>
          <Box>
            <IconButton color="primary"><ChatBubbleOutlineIcon /></IconButton>
            <IconButton color="primary" onClick={() => navigate('/feed')}><HomeIcon /></IconButton>
            <IconButton color="primary"><NotificationsNoneIcon /></IconButton>
          </Box>
          <Avatar src={profileImage} sx={{ width: 40, height: 40 }} onClick={handleMenuOpen} />
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleProfileClick}>마이페이지</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ marginTop: "64px", width: "100%", display: "flex", justifyContent: "center", pt: 4, pb: 4 }}>
        <Container maxWidth="sm">
          {donations.length > 0 ? (
            <Grid2 container spacing={3}>
              {donations.map(donation => (
                <Grid2 item xs={12} key={donation.donation_id}>
                  <DonationCard donation={donation} onClick={handleOpenModal} />
                </Grid2>
              ))}
            </Grid2>
          ) : (
            <Box sx={{ textAlign: "center", mt: 5 }}>
              <Typography>등록된 후원 내역이 없습니다.</Typography>
            </Box>
          )}
        </Container>
      </Box>

      <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="lg">
        <DialogTitle>
          후원 상세정보
          <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={handleCloseModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex" }}>
          <Box sx={{ flex: 1 }}>
            {selectedDonation?.image_url && (
              <img src={selectedDonation.image_url} alt="donation" style={{ width: "100%", borderRadius: "6px" }} />
            )}
            <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>기본 정보</Typography>
            <Typography>후원자: {selectedDonation?.donor_name}</Typography>
            <Typography>후원 금액: {selectedDonation?.amount}원</Typography>
            <Typography>후원 날짜: {selectedDonation?.date}</Typography>
            <Button sx={{ mt: 3 }} variant="contained" color="primary">후원자에게 메시지 보내기</Button>
          </Box>
          <Box sx={{ width: "300px", ml: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>관련 기록</Typography>
            <List>
              <ListItem>
                <ListItemText primary="최근 후원 관련 기능 준비중" />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Donations;
