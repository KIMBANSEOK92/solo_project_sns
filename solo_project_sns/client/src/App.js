import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Login from './components/Login';
import Join from './components/Join';
import FindCredentials from './components/FindCredentials';
import Feed from './components/Feed';
import Register from './components/Register';
import MyPage from './components/MyPage';
import Menu from './components/Menu';
import Donations from './components/Donations';
import ChildAbuseReports from './components/ChildAbuseReports';
import Friends from './components/Friends';


function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/join' || location.pathname === '/FindCredentials';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {!isAuthPage && <Menu />}

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>

          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/findCredentials" element={<FindCredentials />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/childAbuseReports/:regionName?" element={<ChildAbuseReports />} />
          <Route path="/friends" element={<Friends />} />

          {/* 🔥 필수: /mui 오류 해결 라우트 */}
          <Route path="/mui" element={<div />} />

          {/* 404 처리 */}
          <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;