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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from "react-router-dom";

const USER_PROFILE_SRC = "/mr_kim_profile.jpg";

/* --------------------------------------------------
    카드 UI (FeedCard 스타일 그대로 재사용)
---------------------------------------------------- */
const ChildCard = memo(({ child, onClick }) => (
    <Card sx={{ marginBottom: 2, borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
        <Box sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
            <Avatar src={USER_PROFILE_SRC} sx={{ width: 32, height: 32, mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>후원자 정보</Typography>
        </Box>

        {child.image_url && (
            <CardMedia
                component="img"
                height="auto"
                image={child.image_url}
                onClick={() => onClick(child)}
                style={{ cursor: "pointer", maxHeight: "500px", objectFit: "cover" }}
            />
        )}

        <CardContent>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>{child.name}</Typography>
            <Typography variant="body2" color="textSecondary">실종일: {child.missing_date}</Typography>
            <Typography variant="body2" color="textSecondary">나이: {child.age}</Typography>
        </CardContent>

        <Box sx={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #ddd", p: 1 }}>
            <Button sx={{ color: "#606770" }} startIcon={<VisibilityOutlinedIcon />} onClick={() => onClick(child)}>
                상세보기
            </Button>
            <Button sx={{ color: "#606770" }} startIcon={<ChatBubbleOutlineIcon />} onClick={() => onClick(child)}>
                제보하기
            </Button>
        </Box>
    </Card>
));

/* --------------------------------------------------
      메인 페이지
---------------------------------------------------- */
function SearchChild() {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // 실종 아동 목록 조회
    const loadChildList = useCallback(() => {
        fetch("http://localhost:3010/child/find")
            .then((res) => res.json())
            .then((data) => setChildren(data.list || []))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        loadChildList();
    }, []);

    // 상세 모달 열기
    const handleOpenModal = (child) => {
        setSelectedChild(child);
        setOpen(true);
    };
    const handleCloseModal = () => {
        setOpen(false);
        setSelectedChild(null);
    };

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex" }}>
            {/* 상단바 */}
            <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: "white" }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar src="cp_logo.png" sx={{ width: 40, height: 40, mr: 1 }} />
                        <Typography variant="h6" sx={{ color: "#1877f2", fontWeight: "bold" }}>
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

            {/* 콘텐츠 영역 (Feed 스타일 그대로 적용) */}
            <Box
                component="main"
                sx={{
                    marginTop: "64px",
                    marginLeft: "240px",
                    width: "calc(100% - 240px)",
                    display: "flex",
                    justifyContent: "center",
                    pt: 4,
                }}
            >
                <Container maxWidth="sm">
                    {children.length > 0 ? (
                        <Grid2 container spacing={3}>
                            {children.map((child) => (
                                <Grid2 item xs={12} key={child.child_id}>
                                    <ChildCard child={child} onClick={handleOpenModal} />
                                </Grid2>
                            ))}
                        </Grid2>
                    ) : (
                        <Box sx={{ textAlign: "center", mt: 5 }}>
                            <Typography>등록된 실종 아동 정보가 없습니다.</Typography>
                        </Box>
                    )}
                </Container>
            </Box>

            {/* 상세 모달 */}
            <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="lg">
                <DialogTitle>
                    {selectedChild?.name}
                    <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={handleCloseModal}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ display: "flex" }}>
                    {/* 왼쪽: 이미지 및 정보 */}
                    <Box sx={{ flex: 1 }}>
                        {selectedChild?.image_url && (
                            <img
                                src={selectedChild.image_url}
                                alt="child"
                                style={{ width: "100%", borderRadius: "6px" }}
                            />
                        )}

                        <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>기본 정보</Typography>
                        <Typography>이름: {selectedChild?.name}</Typography>
                        <Typography>나이: {selectedChild?.age}</Typography>
                        <Typography>성별: {selectedChild?.gender}</Typography>
                        <Typography>실종일: {selectedChild?.missing_date}</Typography>
                        <Typography>실종 장소: {selectedChild?.missing_location}</Typography>

                        <Button sx={{ mt: 3 }} variant="contained" color="primary">
                            제보하기
                        </Button>
                    </Box>

                    {/* 오른쪽: 제보 기록 */}
                    <Box sx={{ width: "300px", ml: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>제보 기록</Typography>
                        <List>
                            <ListItem>
                                <ListItemText primary="최근 제보 기능 준비중" />
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

export default SearchChild;
