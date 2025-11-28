import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Toolbar,
  ListItemIcon,
  Box,
  Avatar,
  Collapse, //  드롭다운 애니메이션을 위한 컴포넌트
  Divider //  시각적 구분을 위한 구분선
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  PeopleAlt as FriendsIcon,
  Favorite as SupportIcon,
  ExpandLess, //  펼치기 아이콘
  ExpandMore, //  접기 아이콘
  LocationCity as LocationCityIcon //  지역 아이콘
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom'; // 현재 경로 확인을 위해 useLocation 추가
import { jwtDecode } from 'jwt-decode';

// 이미지에서 보여지는 지역 목록 (Mock Data)
const AREA_LIST = [
  { name: '서울특별시', emoji: '🐱‍🚀' },
  { name: '인천광역시', emoji: '🙈' },
  { name: '부산광역시', emoji: '🐶' },
  { name: '대구광역시', emoji: '🐺' },
  { name: '대전광역시', emoji: '🐱' },
  { name: '광주광역시', emoji: '🐯' },
  { name: '울산광역시', emoji: '🦒' },
  { name: '용인시', emoji: '🦊' },
  { name: '창원시', emoji: '🦝' },
  { name: '수원시', emoji: '🐮' },
  { name: '화성시', emoji: '🐷' },
  { name: '성남시', emoji: '🐗' },
  { name: '고양시', emoji: '🐭' },
  { name: '부천시', emoji: '🐹' },
  { name: '남양주시', emoji: '🐰' },
  { name: '전주시', emoji: '🐻' },
  { name: '천안시', emoji: '🐨' },
  { name: '안산시', emoji: '🐸' },
  { name: '평택시', emoji: '🦓' },
  { name: '청주시', emoji: '🦄' },
  { name: '김해시', emoji: '🐔' },
  { name: '시흥시', emoji: '🐲' },
  { name: '포항시', emoji: '🦍' },
  { name: '파주시', emoji: '🐪' },
  { name: '제주시', emoji: '🦉' },
  { name: '광주시', emoji: '🐧' },
  { name: '구미시', emoji: '🐢' },
  { name: '아산시', emoji: '🐱‍👤' },
  { name: '의정부시', emoji: '🐇' },
];

function Menu() {
  //  아동 찾기 메뉴 드롭다운 상태 관리
  const [openChildSearch, setOpenChildSearch] = useState(false);
  const location = useLocation();

  //  드롭다운 토글 함수
  const handleClickChildSearch = () => {
    setOpenChildSearch(!openChildSearch);
  };

  const menuItemStyle = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1c1e21',
  };

  const menuIconStyle = {
    minWidth: 40,
    color: '#1c1e21',
  };

  const token = localStorage.getItem("token");
  const decode = token ? jwtDecode(token) : {};

  const profileName = decode?.userName || "사용자";
  const profileImage = decode?.profileImage
    ? `http://localhost:3010${decode.profileImage}`
    : "/default_profile.jpg";

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#f8f8f8',
          borderRight: '1px solid #ddd',
          overflowX: 'hidden',
          overflowY: 'auto'
        },
      }}
    >
      <Toolbar />

      {/* 👤 사용자 DB 정보 출력 영역 (기존 코드 유지) */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar
          alt={`${profileName} Profile`}
          src={profileImage}
          sx={{ width: 60, height: 60, mb: 1.5, border: '2px solid #ddd' }}
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1c1e21' }}>
          {profileName}
        </Typography>
      </Box>

      {/* 메뉴 리스트 */}
      <List sx={{ pt: 1 }}>
        {/* 1. 피드 (기존 코드 유지) */}
        <ListItem
          button
          component={Link}
          to="/feed"
          selected={location.pathname === '/feed'}
        >
          <ListItemIcon sx={menuIconStyle}><HomeIcon /></ListItemIcon>
          <ListItemText primary="피드" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        {/* 2. 아동 찾기 (드롭다운 트리거로 변경됨) */}
        <ListItem
          button
          onClick={handleClickChildSearch} // 💡 추가: 클릭 이벤트
          // 아동 찾기 페이지에 있거나 드롭다운이 열려 있을 때 선택된 스타일 적용
          selected={location.pathname.startsWith('/childAbuseReports') || openChildSearch}
        >
          <ListItemIcon sx={menuIconStyle}><SearchIcon /></ListItemIcon>
          <ListItemText primary="아동 찾기" primaryTypographyProps={{ style: menuItemStyle }} />
          {/*  펼침/접힘 아이콘 */}
          {openChildSearch ? <ExpandLess /> : <ExpandMore />}
        </ListItem>

        {/* 2-1. 지역 목록 드롭다운 */}
        <Collapse in={openChildSearch} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2, backgroundColor: '#f0f0f0' }}>

            {/* 전체 목록 보기 */}
            <ListItem
              button
              component={Link}
              to="/childAbuseReports"
              selected={location.pathname === '/childAbuseReports'}
              sx={{ py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}><LocationCityIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="전체 목록" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }} />
            </ListItem>

            <Divider light />

            {/* 지역별 목록 */}
            {AREA_LIST.map((area, index) => (
              <ListItem
                button
                key={index}
                component={Link}
                // Mock 경로: /childAbuseReports/seoul 같은 형태로 가정
                to={`/childAbuseReports/${area.name}`}
                selected={location.pathname === `/childAbuseReports/${area.name}`}
                sx={{ py: 1 }}
              >
                <ListItemText
                  primary={`${area.emoji} ${area.name}`}
                  primaryTypographyProps={{ fontSize: '14px', ml: 4 }}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* 3. 친구 (기존 코드 유지) */}
        <ListItem
          button
          component={Link}
          to="/friends"
          selected={location.pathname === '/friends'}
        >
          <ListItemIcon sx={menuIconStyle}><FriendsIcon /></ListItemIcon>
          <ListItemText primary="친구" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        {/* 4. 후원 (기존 코드 유지) */}
        <ListItem
          button
          component={Link}
          to="/mui"
          selected={location.pathname === '/mui'}
        >
          <ListItemIcon sx={menuIconStyle}><SupportIcon /></ListItemIcon>
          <ListItemText primary="후원" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default Menu;