import React from 'react';
import { Drawer, List, ListItem, ListItemText, Typography, Toolbar, ListItemIcon, Box, Avatar } from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  PeopleAlt as FriendsIcon,
  Favorite as SupportIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Menu() {

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
        },
      }}
    >
      <Toolbar />

      {/* 👤 사용자 DB 정보 출력 영역 */}
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
        <ListItem button component={Link} to="/feed">
          <ListItemIcon sx={menuIconStyle}><HomeIcon /></ListItemIcon>
          <ListItemText primary="피드" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        <ListItem button component={Link} to="/childAbuseReports">
          <ListItemIcon sx={menuIconStyle}><SearchIcon /></ListItemIcon>
          <ListItemText primary="아동 찾기" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        <ListItem button component={Link} to="/friends">
          <ListItemIcon sx={menuIconStyle}><FriendsIcon /></ListItemIcon>
          <ListItemText primary="친구" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        <ListItem button component={Link} to="/mui">
          <ListItemIcon sx={menuIconStyle}><SupportIcon /></ListItemIcon>
          <ListItemText primary="후원" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default Menu;
