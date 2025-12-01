import React, { useRef } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  let navigate = useNavigate();
  let idRef = useRef(null);
  let pwdRef = useRef();

  const handleLogin = (e) => {
    if (e) e.preventDefault();

    let param = {
      userId: idRef.current.value,
      pwd: pwdRef.current.value,
    };

    fetch("http://localhost:3010/users/login", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(param),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.msg);
        if (data.result) {
          localStorage.setItem("token", data.token);
          navigate("/feed");
        }
      });
  };

  return (
    <Box sx={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '950px', padding: '20px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Box component="img" src="/cp_logo.png" alt="Logo" sx={{ width: '200px', height: '200px', borderRadius: '50%', marginBottom: '13px' }} />
          <Typography variant="h5" sx={{ fontSize: '20px', lineHeight: '28px', color: '#1c1e21', marginTop: '10px' }}>
            아이들을 보호하고 안전한 세상을 만드는 데 기여해주세요.
          </Typography>
        </Box>

        <Box sx={{ maxWidth: '396px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Box component="form" onSubmit={handleLogin} sx={{ backgroundColor: '#fff', padding: '16px', width: '100%' }}>
            <TextField inputRef={idRef} label="아이디" variant="outlined" margin="normal" fullWidth size="large" sx={{ marginBottom: '10px' }} />
            <TextField label="비밀번호" variant="outlined" margin="normal" fullWidth type="password" inputRef={pwdRef} size="large" sx={{ marginBottom: '10px' }} />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ marginTop: '10px' }}>
              로그인
            </Button>

            <Link to="/FindCredentials" style={{ color: '#1877f2', fontSize: '14px', textDecoration: 'none', marginBottom: '20px' }}>
              아이디나 비밀번호를 잊으셨나요?
            </Link>

            <Box sx={{ width: '100%', height: '1px', backgroundColor: '#dadde1', marginBottom: '24px' }} />

            <Button component={Link} to="/join" variant="contained" fullWidth={false} sx={{ backgroundColor: '#42b72a', '&:hover': { backgroundColor: '#36a420' }, textTransform: 'none' }}>
              새 계정 만들기
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
