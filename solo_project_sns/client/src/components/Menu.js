import React from 'react';
import { Drawer, List, ListItem, ListItemText, Typography, Toolbar, ListItemIcon, Box, Avatar } from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  PeopleAlt as FriendsIcon,
  Favorite as SupportIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// 컴포넌트가 userImageSrc와 userName을 props로 받도록 수정
function Menu({ userImageSrc, userName }) {
  const menuItemStyle = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1c1e21',
  };

  const menuIconStyle = {
    minWidth: 40,
    color: '#1c1e21',
  };

  // 기본값 설정: props가 전달되지 않았을 경우를 대비합니다.
  const profileImage = userImageSrc || '/default_profile.jpg'; // 기본 이미지 경로 설정
  const profileName = userName || '사용자 이름';

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
        },
      }}
    >
      <Toolbar />

      {/* 👤 사용자 DB 정보 출력 영역 */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar
          alt={`${profileName} Profile`}
          src={profileImage} // <--- Props에서 받은 이미지 URL 연결
          sx={{ width: 60, height: 60, mb: 1.5, border: '2px solid #ddd' }}
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1c1e21' }}>
          {profileName} {/* <--- Props에서 받은 사용자 이름(ID) 연결 */}
        </Typography>
      </Box>

      {/* --- 메뉴 리스트 --- */}
      <List sx={{ pt: 1 }}>
        <ListItem button component={Link} to="/feed">
          <ListItemIcon sx={menuIconStyle}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="피드" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        <ListItem button component={Link} to="/childAbuseReports">
          <ListItemIcon sx={menuIconStyle}>
            <SearchIcon />
          </ListItemIcon>
          <ListItemText primary="아동 찾기" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        <ListItem button component={Link} to="/friends">
          <ListItemIcon sx={menuIconStyle}>
            <FriendsIcon />
          </ListItemIcon>
          <ListItemText primary="친구" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        <ListItem button component={Link} to="/mui">
          <ListItemIcon sx={menuIconStyle}>
            <SupportIcon />
          </ListItemIcon>
          <ListItemText primary="후원" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Menu;