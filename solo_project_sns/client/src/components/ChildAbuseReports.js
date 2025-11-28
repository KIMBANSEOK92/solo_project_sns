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
  Select,
  MenuItem as MuiMenuItem,
  InputLabel,
  FormControl,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AddIcon from '@mui/icons-material/Add';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const USER_PROFILE_SRC = "/mr_kim_profile.jpg";

// 아동 학대 신고 카드 디자인
const AbuseReportCard = memo(({ report, onClick }) => (
  <Card sx={{ marginBottom: 2, borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
    <Box sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
      <Avatar src={USER_PROFILE_SRC} sx={{ width: 32, height: 32, mr: 1 }} />
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        아동 학대 사례
      </Typography>
    </Box>

    {report.image_url && (
      <CardMedia
        component="img"
        height="auto"
        image={report.image_url}
        onClick={() => onClick(report)}
        style={{ cursor: "pointer", maxHeight: "500px", objectFit: "cover" }}
      />
    )}

    <CardContent>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {report.title}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        상태: {report.status}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        보고일: {report.reported_at}
      </Typography>
    </CardContent>

    <Box sx={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #ddd", p: 1 }}>
      <Button sx={{ color: "#606770" }} startIcon={<ChatBubbleOutlineIcon />} onClick={() => onClick(report)}>
        상세보기
      </Button>
    </Box>
  </Card>
));

function AbuseReportPage() {
  const [reports, setReports] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [open, setOpen] = useState(false);
  const [addReportOpen, setAddReportOpen] = useState(false); // 신고 등록 폼 열기
  const [newReport, setNewReport] = useState({
    region_id: "",
    title: "",
    description: "",
    status: "확인 중",
    image: null,
  });
  const [loadingRegions, setLoadingRegions] = useState(false); // 지역 로딩 상태 관리
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const decode = token ? jwtDecode(token) : {};
  const userName = decode?.userName || "사용자";
  const profileImage = decode?.profileImage
    ? `http://localhost:3010${decode.profileImage}`
    : USER_PROFILE_SRC;

  // 지역 목록 조회
  const loadRegions = useCallback(() => {
    setLoadingRegions(true);
    fetch("http://localhost:3010/regions")
      .then((res) => {
        if (!res.ok) {
          throw new Error("지역 목록을 가져오는 데 실패했습니다.");
        }
        return res.json();
      })
      .then((data) => setRegions(data.list || []))
      .catch((err) => {
        console.error(err);
        alert("서버에서 지역 목록을 가져오는 데 실패했습니다.");
      })
      .finally(() => setLoadingRegions(false));
  }, []);

  // 아동 학대 신고 목록 조회
  const loadReports = useCallback(() => {
    fetch("http://localhost:3010/reports")
      .then((res) => {
        if (!res.ok) {
          throw new Error("신고 목록을 가져오는 데 실패했습니다.");
        }
        return res.json();
      })
      .then((data) => setReports(data.list || []))
      .catch((err) => {
        console.error(err);
        alert("서버에서 아동 학대 신고 목록을 가져오는 데 실패했습니다.");
      });
  }, []);

  useEffect(() => {
    loadRegions();
    loadReports();
  }, [loadRegions, loadReports]);

  // 상세 모달 열기
  const handleOpenModal = (report) => {
    setSelectedReport(report);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedReport(null);
  };

  const handleAddReportSubmit = () => {
    const formData = new FormData();
    formData.append("region_id", newReport.region_id);
    formData.append("title", newReport.title);
    formData.append("description", newReport.description);
    formData.append("status", newReport.status);
    if (newReport.image) {
      formData.append("image", newReport.image);
    }

    fetch("http://localhost:3010/reports/add", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result) {
          alert("아동 학대 신고가 완료되었습니다.");
          setAddReportOpen(false);
          loadReports(); // 신고 목록 새로 고침
        } else {
          alert("신고 등록에 실패하였습니다.");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("서버와의 연결에 실패했습니다.");
      });
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex" }}>
      {/* 상단바 */}
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: "white" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar src="cp_logo.png" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#1877f2", fontWeight: "bold" }}>
              Child Protection
            </Typography>
          </Box>

          <Box>
            <IconButton color="primary"><ChatBubbleOutlineIcon /></IconButton>
            <IconButton color="primary" onClick={() => navigate('/feed')}><HomeIcon /></IconButton>
            <IconButton color="primary"><NotificationsNoneIcon /></IconButton>
          </Box>

          <Avatar
            src={profileImage}
            sx={{ width: 40, height: 40 }}
            onClick={() => navigate('/profile')}
          />
        </Toolbar>
      </AppBar>

      {/* 콘텐츠 영역 */}
      <Box component="main" sx={{ marginTop: "64px", width: "100%", display: "flex", justifyContent: "center", pt: 4 }}>
        <Container maxWidth="sm">
          {reports.length > 0 ? (
            <Grid2 container spacing={3}>
              {reports.map((report) => (
                <Grid2 item xs={12} key={report.report_id}>
                  <AbuseReportCard report={report} onClick={handleOpenModal} />
                </Grid2>
              ))}
            </Grid2>
          ) : (
            <Box sx={{ textAlign: "center", mt: 5 }}>
              <Typography>등록된 아동 학대 사례가 없습니다.</Typography>
            </Box>
          )}

          {/* 아동 학대 신고 등록 버튼 */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddReportOpen(true)}
            >
              아동 학대 신고
            </Button>
          </Box>

          {/* 신고 등록 폼 */}
          <Dialog open={addReportOpen} onClose={() => setAddReportOpen(false)}>
            <DialogTitle>아동 학대 신고 등록</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>지역</InputLabel>
                <Select
                  value={newReport.region_id}
                  onChange={(e) => setNewReport({ ...newReport, region_id: e.target.value })}
                  label="지역"
                  disabled={loadingRegions} // 로딩 중에는 비활성화
                >
                  {loadingRegions ? (
                    <MuiMenuItem value="">
                      <em>로딩 중...</em>
                    </MuiMenuItem>
                  ) : (
                    regions.length > 0 ? (
                      regions.map((region) => (
                        <MuiMenuItem key={region.region_id} value={region.region_id}>
                          {region.region_name}
                        </MuiMenuItem>
                      ))
                    ) : (
                      <MuiMenuItem value="">
                        <em>지역 정보가 없습니다.</em>
                      </MuiMenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField
                label="제목"
                fullWidth
                value={newReport.title}
                onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                label="상세 내용"
                fullWidth
                multiline
                rows={4}
                value={newReport.description}
                onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={newReport.status}
                  onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
                  label="상태"
                >
                  <MuiMenuItem value="확인 중">확인 중</MuiMenuItem>
                  <MuiMenuItem value="조치 완료">조치 완료</MuiMenuItem>
                  <MuiMenuItem value="의심 단계">의심 단계</MuiMenuItem>
                </Select>
              </FormControl>

              <TextField
                type="file"
                fullWidth
                onChange={(e) => setNewReport({ ...newReport, image: e.target.files[0] })}
                sx={{ mb: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddReportOpen(false)}>취소</Button>
              <Button onClick={handleAddReportSubmit} variant="contained">등록</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>

      {/* 상세 모달 */}
      <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="lg">
        <DialogTitle>
          {selectedReport?.title}
          <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={handleCloseModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: "flex" }}>
          <Box sx={{ flex: 1 }}>
            {selectedReport?.image_url && (
              <img
                src={selectedReport.image_url}
                alt="report"
                style={{ width: "100%", borderRadius: "6px" }}
              />
            )}

            <Typography variant="h6" sx={{ mt: 2 }}>기본 정보</Typography>
            <Typography>제목: {selectedReport?.title}</Typography>
            <Typography>상태: {selectedReport?.status}</Typography>
            <Typography>보고일: {selectedReport?.reported_at}</Typography>
            <Typography>설명: {selectedReport?.description}</Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AbuseReportPage;
