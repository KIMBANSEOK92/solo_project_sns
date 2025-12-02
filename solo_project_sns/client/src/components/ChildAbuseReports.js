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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AddIcon from '@mui/icons-material/Add';
import { jwtDecode } from "jwt-decode";
import { useNavigate, useParams } from "react-router-dom";

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
      {report.region_name && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: "medium", mt: 0.5 }}>
          지역: {report.region_name}
        </Typography>
      )}
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

function ChildAbuseReports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [open, setOpen] = useState(false);
  const [addReportOpen, setAddReportOpen] = useState(false); // 신고 등록 폼 열기
  const [newReport, setNewReport] = useState({
    region_name: "", // region_id 대신 region_name 사용 (사용자가 직접 입력)
    title: "",
    description: "",
    status: "확인 중",
    image: null,
  });

  // 수정: 프로필 메뉴 상태 추가
  const [anchorEl, setAnchorEl] = useState(null);

  const navigate = useNavigate();
  const { regionName } = useParams(); // URL 파라미터에서 지역명 가져오기

  const token = localStorage.getItem("token");
  const decode = token ? jwtDecode(token) : {};
  const userName = decode?.userName || "사용자";
  const profileImage = decode?.profileImage
    ? `http://localhost:3010${decode.profileImage}`
    : USER_PROFILE_SRC;

  // ============================================================
  // 아동 학대 신고 목록 조회
  // ============================================================
  // URL 파라미터로 받은 regionName으로 해당 지역의 신고만 조회합니다.
  // regionName이 없으면 전체 신고를 조회합니다.
  // ============================================================
  const loadReports = useCallback(() => {
    let url = "http://localhost:3010/reports";

    // URL 파라미터에서 지역명이 있으면 해당 지역으로 필터링
    if (regionName) {
      url += `?region_name=${encodeURIComponent(regionName)}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("신고 목록을 가져오는 데 실패했습니다.");
        return res.json();
      })
      .then((data) => setReports(data.list || []))
      .catch((err) => {
        console.error(err);
        alert("서버에서 아동 학대 신고 목록을 가져오는 데 실패했습니다.");
      });
  }, [regionName]); // regionName이 변경될 때마다 다시 로드

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleOpenModal = (report) => { setSelectedReport(report); setOpen(true); };
  const handleCloseModal = () => { setOpen(false); setSelectedReport(null); };

  // ============================================================
  // 아동 학대 신고 등록 처리 함수
  // ============================================================
  // 사용자가 입력한 지역명(region_name)과 함께 신고 정보를 서버로 전송하여 DB에 저장합니다.
  // 서버에서 입력한 지역명이 regions 테이블에 없으면 자동으로 추가합니다.
  // ============================================================
  const handleAddReportSubmit = () => {
    // 필수 필드 검증
    if (!newReport.region_name || !newReport.region_name.trim()) {
      alert("지역을 입력해주세요.");
      return;
    }
    if (!newReport.title || !newReport.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!newReport.description || !newReport.description.trim()) {
      alert("상세 내용을 입력해주세요.");
      return;
    }

    // FormData 생성 (이미지 파일 전송을 위해 사용)
    const formData = new FormData();
    formData.append("region_name", newReport.region_name.trim()); // region_id 대신 region_name 전송
    formData.append("title", newReport.title.trim());
    formData.append("description", newReport.description.trim());
    formData.append("status", newReport.status || "확인 중");
    if (newReport.image) formData.append("image", newReport.image);

    // 서버로 신고 등록 요청 전송
    fetch("http://localhost:3010/reports/add", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((data) => {
        if (data.result) {
          alert("아동 학대 신고가 완료되었습니다.");
          // 폼 초기화
          setNewReport({
            region_name: "",
            title: "",
            description: "",
            status: "확인 중",
            image: null,
          });
          setAddReportOpen(false);
          // 신고 목록 새로고침 (현재 URL의 지역으로)
          loadReports();
        } else {
          alert(data.msg || "신고 등록에 실패하였습니다.");
        }
      })
      .catch((err) => {
        console.error("신고 등록 에러:", err);
        alert("서버와의 연결에 실패했습니다. 다시 시도해주세요.");
      });
  };

  // 수정: 프로필 메뉴 열기/닫기 및 액션
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileClick = () => { navigate("/MyPage"); handleMenuClose(); };
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); handleMenuClose(); };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex" }}>
      {/* 상단바 */}
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: "white" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar src="cp_logo.png" sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#1877f2", fontWeight: "bold" }}>Child Protection</Typography>
          </Box>

          <Box>
            <IconButton color="primary"><ChatBubbleOutlineIcon /></IconButton>
            <IconButton color="primary" onClick={() => navigate('/feed')}><HomeIcon /></IconButton>
            <IconButton color="primary"><NotificationsNoneIcon /></IconButton>
          </Box>

          {/* 수정: 프로필 Avatar 클릭 시 메뉴 */}
          <Avatar
            src={profileImage}
            sx={{ width: 40, height: 40, cursor: 'pointer', }} // 커서 손가락으로 변경
            onClick={handleMenuOpen}
          />
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleProfileClick}>마이페이지</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* 콘텐츠 영역 */}
      <Box component="main" sx={{ marginTop: "64px", width: "100%", display: "flex", justifyContent: "center", pt: 4 }}>
        <Container maxWidth="sm">
          {/* 현재 선택된 지역 표시 */}
          {regionName && (
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1877f2" }}>
                {regionName} 지역 신고 목록
              </Typography>
            </Box>
          )}
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
              <Typography>
                {regionName
                  ? `${regionName} 지역에 등록된 아동 학대 사례가 없습니다.`
                  : "등록된 아동 학대 사례가 없습니다."}
              </Typography>
            </Box>
          )}

          {/* 아동 학대 신고 등록 버튼 */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddReportOpen(true)}>
              아동 학대 신고
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 신고 등록 폼 */}
      <Dialog open={addReportOpen} onClose={() => setAddReportOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>아동 학대 신고 등록</DialogTitle>
        <DialogContent>
          {/* 지역 입력 필드 */}
          {/* 사용자가 직접 지역명을 입력합니다. 서버에서 자동으로 regions 테이블에 추가됩니다. */}
          <TextField
            label="지역 *"
            fullWidth
            value={newReport.region_name}
            onChange={(e) => setNewReport({ ...newReport, region_name: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="예: 서울, 부산, 인천 등(경기도/경상도/전라도 등 도 X)"
            required
          />

          {/* 제목 입력 */}
          <TextField
            label="제목 *"
            fullWidth
            value={newReport.title}
            onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          {/* 상세 내용 입력 */}
          <TextField
            label="상세 내용 *"
            fullWidth
            multiline
            rows={4}
            value={newReport.description}
            onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>상태</InputLabel>
            <Select value={newReport.status} onChange={(e) => setNewReport({ ...newReport, status: e.target.value })} label="상태">
              <MuiMenuItem value="확인 중">확인 중</MuiMenuItem>
              <MuiMenuItem value="조치 완료">조치 완료</MuiMenuItem>
              <MuiMenuItem value="의심 단계">의심 단계</MuiMenuItem>
            </Select>
          </FormControl>
          <TextField type="file" fullWidth onChange={(e) => setNewReport({ ...newReport, image: e.target.files[0] })} sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            // 폼 닫기 시 초기화
            setNewReport({
              region_name: "",
              title: "",
              description: "",
              status: "확인 중",
              image: null,
            });
            setAddReportOpen(false);
          }}>취소</Button>
          <Button onClick={handleAddReportSubmit} variant="contained" color="primary">등록</Button>
        </DialogActions>
      </Dialog>

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
              <img src={selectedReport.image_url} alt="report" style={{ width: "100%", borderRadius: "6px" }} />
            )}
            <Typography variant="h6" sx={{ mt: 2 }}>기본 정보</Typography>
            {selectedReport?.region_name && (
              <Typography sx={{ mb: 1 }}>
                <strong>지역:</strong> {selectedReport.region_name}
              </Typography>
            )}
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

export default ChildAbuseReports;