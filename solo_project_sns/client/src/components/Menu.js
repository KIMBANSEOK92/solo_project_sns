import React, { useState, useEffect, useCallback } from 'react';
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
  Collapse,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  PeopleAlt as FriendsIcon,
  Favorite as SupportIcon,
  ExpandLess,
  ExpandMore,
  LocationCity as LocationCityIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// ============================================================
// 지역명에서 키워드 추출 함수
// ============================================================
// "인천광역시" → "인천", "서울특별시" → "서울", "용인시" → "용인"
// 중복된 지역명(예: "인천"과 "인천광역시")을 하나로 그룹화하기 위해 사용
// ============================================================
const extractRegionKeyword = (regionName) => {
  if (!regionName) return "";
  
  // "XX특별시", "XX광역시", "XX시" 등에서 키워드 추출
  const patterns = [
    /^(.+?)특별시/,  // 서울특별시 → 서울
    /^(.+?)광역시/,  // 인천광역시 → 인천
    /^(.+?)시$/,     // 용인시 → 용인
    /^(.+?)도$/,     // 경기도 → 경기
    /^(.+?)군$/,     // 양평군 → 양평
  ];
  
  for (const pattern of patterns) {
    const match = regionName.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // 패턴에 매치되지 않으면 원본 반환
  return regionName.trim();
};

function Menu() {
  const [openChildSearch, setOpenChildSearch] = useState(false);
  const [regions, setRegions] = useState([]); // DB에서 가져온 지역 목록 (키워드로 그룹화됨)
  const location = useLocation();

  // ============================================================
  // DB에서 지역 목록 조회 및 키워드로 그룹화
  // ============================================================
  // regions 테이블에서 지역 목록을 가져와서 키워드로 그룹화합니다.
  // 같은 키워드의 지역은 하나로 표시 (예: "인천"과 "인천광역시" → "인천" 하나만 표시)
  // ============================================================
  const loadRegions = useCallback(() => {
    fetch("http://localhost:3010/regions")
      .then((res) => {
        if (!res.ok) throw new Error("지역 목록을 가져오는 데 실패했습니다.");
        return res.json();
      })
      .then((data) => {
        const regionsList = data.list || [];
        
        // 키워드로 그룹화: 같은 키워드를 가진 지역 중 가장 짧은 이름을 대표로 사용
        // 예: "인천"과 "인천광역시" → 키워드 "인천" 하나로 그룹화
        const keywordMap = new Map();
        
        regionsList.forEach((region) => {
          const keyword = extractRegionKeyword(region.region_name);
          
          // 키워드를 추출할 수 없으면 원본 지역명을 키워드로 사용
          const finalKeyword = keyword || region.region_name;
          
          // 이미 같은 키워드가 있으면, 이름이 더 짧은 것을 대표로 선택
          if (keywordMap.has(finalKeyword)) {
            const existing = keywordMap.get(finalKeyword);
            if (region.region_name.length < existing.original_name.length) {
              keywordMap.set(finalKeyword, {
                ...region,
                keyword: finalKeyword,
                original_name: region.region_name
              });
            }
          } else {
            keywordMap.set(finalKeyword, {
              ...region,
              keyword: finalKeyword,
              original_name: region.region_name
            });
          }
        });
        
        // Map을 배열로 변환하여 키워드 이름으로 정렬
        const groupedRegions = Array.from(keywordMap.values());
        groupedRegions.sort((a, b) => a.keyword.localeCompare(b.keyword, 'ko'));
        
        setRegions(groupedRegions);
      })
      .catch((err) => {
        console.error("지역 목록 조회 에러:", err);
        // 에러가 발생해도 메뉴는 계속 표시
      });
  }, []);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

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

      <List sx={{ pt: 1 }}>

        <ListItem button component={Link} to="/feed" selected={location.pathname === '/feed'}>
          <ListItemIcon sx={menuIconStyle}><HomeIcon /></ListItemIcon>
          <ListItemText primary="피드" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        <ListItem
          button
          onClick={handleClickChildSearch}
          selected={location.pathname.startsWith('/childAbuseReports') || openChildSearch}
        >
          <ListItemIcon sx={menuIconStyle}><SearchIcon /></ListItemIcon>
          <ListItemText primary="아동 찾기" primaryTypographyProps={{ style: menuItemStyle }} />
          {openChildSearch ? <ExpandLess /> : <ExpandMore />}
        </ListItem>

        <Collapse in={openChildSearch} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2, backgroundColor: '#f0f0f0' }}>
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

            {/* DB에서 가져온 지역 목록 표시 (키워드로 그룹화됨) */}
            {/* 예: "인천"과 "인천광역시" → "인천" 하나만 표시, 클릭 시 둘 다 포함된 결과 조회 */}
            {regions.length > 0 ? (
              regions.map((region) => {
                // 키워드로 메뉴에 표시하고, 검색 시에도 키워드로 검색
                const keyword = region.keyword || extractRegionKeyword(region.region_name) || region.region_name;
                
                return (
                  <ListItem
                    button
                    key={region.region_id}
                    component={Link}
                    to={`/childAbuseReports/${encodeURIComponent(keyword)}`}
                    selected={location.pathname === `/childAbuseReports/${encodeURIComponent(keyword)}`}
                    sx={{ py: 1 }}
                  >
                    <ListItemText
                      primary={keyword}
                      primaryTypographyProps={{ fontSize: '14px', ml: 4 }}
                    />
                  </ListItem>
                );
              })
            ) : (
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary="지역 정보 로딩 중..."
                  primaryTypographyProps={{ fontSize: '14px', ml: 4, color: 'textSecondary' }}
                />
              </ListItem>
            )}
          </List>
        </Collapse>

        <ListItem button component={Link} to="/friends" selected={location.pathname === '/friends'}>
          <ListItemIcon sx={menuIconStyle}><FriendsIcon /></ListItemIcon>
          <ListItemText primary="친구" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

        {/* ✔ 수정됨: 후원 메뉴 정상 동작 */}
        <ListItem button component={Link} to="/donations" selected={location.pathname === '/donations'}>
          <ListItemIcon sx={menuIconStyle}><SupportIcon /></ListItemIcon>
          <ListItemText primary="후원" primaryTypographyProps={{ style: menuItemStyle }} />
        </ListItem>

      </List>
    </Drawer>
  );
}

export default Menu;