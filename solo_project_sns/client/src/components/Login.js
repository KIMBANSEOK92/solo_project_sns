import React, { useRef } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  let navigate = useNavigate();
  let idRef = useRef(null);
  let pwdRef = useRef();

  // 1. 로그인 로직을 별도 함수로 분리
  const handleLogin = (e) => {
    // 폼 제출 시 페이지 새로고침 방지
    if (e) e.preventDefault();

    let param = {
      userId: idRef.current.value,
      pwd: pwdRef.current.value
    };

    fetch("http://localhost:3010/users/login", {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(param)
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        alert(data.msg);
        if (data.result) {
          localStorage.setItem("token", data.token);
          navigate("/feed");
        }
      });
  };

  const mainLayoutStyle = {
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  };

  const contentWrapperStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    maxWidth: '950px',
    width: '100%',
    padding: '20px',
    boxSizing: 'border-box',
  };

  const leftContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: '32px',
    textAlign: 'center',
  };

  const rightFormContainerStyle = {
    maxWidth: '396px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const formCardStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, .1), 0 8px 16px rgba(0, 0, 0, .1)',
    padding: '16px 16px 24px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  return (
    <Box sx={mainLayoutStyle}>
      <Box sx={contentWrapperStyle}>
        {/* 🚀 왼쪽: CP 로고 이미지 및 설명 텍스트 */}
        <Box sx={leftContentStyle}>
          <Box
            component="img"
            src="/cp_logo.png"
            alt="Child Protection Logo"
            sx={{
              width: '200px',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '50%',
              marginBottom: '13px',
            }}
          />

          <Typography
            variant="h5"
            sx={{
              fontSize: '20px',
              lineHeight: '28px',
              color: '#1c1e21',
              marginTop: '10px',
              maxWidth: '350px',
            }}
          >
            아이들을 보호하고 안전한 세상을 만드는 데 기여해주세요.
          </Typography>
        </Box>

        {/* 🔑 오른쪽: 로그인 폼 - <form>으로 변경하여 엔터 키 입력 처리 */}
        <Box sx={rightFormContainerStyle}>
          <Box
            component="form" // <--- 폼 태그로 변경
            onSubmit={handleLogin} // <--- 엔터 키 입력 시 이 함수 실행
            sx={formCardStyle}
          >
            <TextField
              inputRef={idRef}
              label="이메일 또는 전화번호"
              variant="outlined"
              margin="normal"
              fullWidth
              size="large"
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '52px',
                  fontSize: '17px',
                },
                marginBottom: '10px',
              }}
            />
            <TextField
              label="비밀번호"
              variant="outlined"
              margin="normal"
              fullWidth
              type="password"
              inputRef={pwdRef}
              size="large"
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '52px',
                  fontSize: '17px',
                },
                marginBottom: '10px',
              }}
            />
            <Button
              type="submit" // <--- 버튼 타입을 submit으로 설정
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                backgroundColor: '#1877f2',
                '&:hover': { backgroundColor: '#166fe5' },
                fontWeight: 'bold',
                fontSize: '18px',
                padding: '10px 0',
                marginTop: '10px',
                marginBottom: '10px',
                textTransform: 'none',
              }}
            >
              로그인
            </Button>

            <Link
              to="/forgot-password"
              style={{
                color: '#1877f2',
                fontSize: '14px',
                textDecoration: 'none',
                marginBottom: '20px',
              }}
            >
              비밀번호를 잊으셨나요?
            </Link>

            <Box sx={{ width: '100%', height: '1px', backgroundColor: '#dadde1', marginBottom: '24px' }} />

            <Button
              component={Link}
              to="/join"
              variant="contained"
              fullWidth={false}
              sx={{
                backgroundColor: '#42b72a',
                '&:hover': { backgroundColor: '#36a420' },
                fontWeight: 'bold',
                fontSize: '15px',
                padding: '12px 16px',
                width: 'auto',
                textTransform: 'none',
              }}
            >
              새 계정 만들기
            </Button>
          </Box>

          <Typography
            variant="body2"
            sx={{
              marginTop: '28px',
              fontSize: '14px',
            }}
          >
            <Link
              to="/create-page"
              style={{
                fontWeight: 'bold',
                color: '#1c1e21',
                textDecoration: 'none'
              }}
            >
              여러분들의 힘이 아이들의 희망이 되고 미래가 됩니다.
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;