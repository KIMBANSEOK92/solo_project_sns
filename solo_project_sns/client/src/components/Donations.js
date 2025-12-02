import React, { useEffect, useState, useCallback } from 'react';
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
  Avatar,
  TextField,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from "react-router-dom";

const USER_PROFILE_SRC = "/mr_kim_profile.jpg";

const DonationCard = ({ donation, onClick, onEdit, onDelete, canEdit }) => (
  <Card sx={{ marginBottom: 2, borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
    <Box sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
      <Avatar
        src={donation.profile_image ? `http://localhost:3010${donation.profile_image}` : USER_PROFILE_SRC}
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

    <Box sx={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #ddd", p: 1 }}>
      <Button sx={{ color: "#606770" }} onClick={() => onClick(donation)}>
        상세보기
      </Button>

      {canEdit && (
        <>
          <Button sx={{ color: "#606770" }} onClick={() => onEdit(donation)}>
            수정
          </Button>
          <Button sx={{ color: "#f44336" }} onClick={() => onDelete(donation.donation_id)}>
            삭제
          </Button>
        </>
      )}
    </Box>
  </Card>
);

function Donations() {
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDonate, setOpenDonate] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [editingDonation, setEditingDonation] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // 🔹 메뉴용 상태
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const decode = token ? jwtDecode(token) : {};
  const userId = decode?.userId;

  const loadDonationList = useCallback(() => {
    fetch("http://localhost:3010/donation/list")
      .then(res => res.json())
      .then(data => setDonations(data.list || []))
      .catch(err => console.error("후원 목록 로드 오류:", err));
  }, []);

  useEffect(() => {
    loadDonationList();
  }, [loadDonationList]);

  const handleOpenDetail = (donation) => {
    setSelectedDonation(donation);
    setOpenDetail(true);
  };
  const handleCloseDetail = () => setOpenDetail(false);

  const handleOpenDonate = () => setOpenDonate(true);
  const handleCloseDonate = () => {
    setDonationAmount('');
    setDonationMessage('');
    setOpenDonate(false);
    setEditingDonation(null);
  };

  const handleDonate = () => {
    if (!donationAmount) return alert("후원 금액을 입력해주세요.");
    if (!userId) return alert("로그인이 필요합니다.");

    const payload = {
      user_id: userId,
      amount: Number(donationAmount),
      message: donationMessage,
    };

    const url = editingDonation ? `http://localhost:3010/donation/edit/${editingDonation.donation_id}` : "http://localhost:3010/donation/add";

    fetch(url, {
      method: editingDonation ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            console.error("서버 에러 응답:", errorData);
            throw new Error(errorData.msg || "후원 등록/수정 중 알 수 없는 서버 오류 발생");
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.result) {
          alert(editingDonation ? "후원 수정 완료" : "후원 완료");
          handleCloseDonate();
          loadDonationList();
        } else {
          alert("후원 실패: " + (data.msg || "알 수 없는 오류"));
        }
      })
      .catch(err => {
        alert("후원 등록/수정 오류: " + err.message);
        console.error("클라이언트 처리 오류:", err);
      });
  };

  const handleEditDonation = (donation) => {
    setEditingDonation(donation);
    setDonationAmount(String(donation.amount));
    setDonationMessage(donation.message || '');
    setOpenDonate(true);
  };

  const handleDeleteDonation = (donationId) => {
    if (window.confirm("정말로 이 후원을 삭제하시겠습니까?")) {
      fetch(`http://localhost:3010/donation/delete/${donationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.result) {
            alert("후원이 삭제되었습니다.");
            loadDonationList();
          } else {
            alert("삭제 실패: " + (data.msg || "알 수 없는 오류"));
          }
        })
        .catch(err => console.error("후원 삭제 오류:", err));
    }
  };

  // 🔹 메뉴 관련 핸들러
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileClick = () => { navigate('/MyPage'); handleMenuClose(); };
  const handleLogout = () => { localStorage.removeItem("token"); navigate('/'); handleMenuClose(); };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: "white" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar src="cp_logo.png" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#1877f2", fontWeight: "bold" }}>
              CP (Child Protection)
            </Typography>
          </Box>

          {/* 🔹 우측 프로필 메뉴 */}
          <Box>
            <Avatar
              src={decode?.profile_img ? `http://localhost:3010${decode.profile_img}` : USER_PROFILE_SRC}
              sx={{ width: 40, height: 40 }}
              onClick={handleMenuOpen}
              style={{ cursor: "pointer" }}
            />
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={handleProfileClick}>마이페이지</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ marginTop: "80px", width: "100%", textAlign: "center" }}>
        <Button variant="contained" color="primary" sx={{ mb: 3 }} onClick={handleOpenDonate}>
          후원하기
        </Button>

        <Container maxWidth="sm">
          {donations.length > 0 ? (
            <Box>
              {donations.map(donation => (
                <DonationCard
                  key={donation.donation_id}
                  donation={donation}
                  onClick={handleOpenDetail}
                  onEdit={handleEditDonation}
                  onDelete={handleDeleteDonation}
                  canEdit={String(donation.user_id) === String(userId)}
                />
              ))}
            </Box>
          ) : (
            <Typography>등록된 후원 내역이 없습니다.</Typography>
          )}
        </Container>
      </Box>

      {/* 후원 상세 모달 */}
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

      {/* 후원하기/수정 모달 */}
      <Dialog open={openDonate} onClose={handleCloseDonate} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingDonation ? "후원 수정" : "후원하기"}
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
          <Button variant="contained" onClick={handleDonate}>{editingDonation ? "수정하기" : "후원하기"}</Button>
          <Button onClick={handleCloseDonate}>취소</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Donations;
