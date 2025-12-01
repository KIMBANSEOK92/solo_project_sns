import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function FindCredentials() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [selectedOption, setSelectedOption] = useState('find-id');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [serverCode, setServerCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [foundId, setFoundId] = useState('');
  const navigate = useNavigate();

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
    setCodeSent(false);
    setVerified(false);
    setFoundId('');
    setCode('');
    setNewPassword('');
    setUserId('');
    setEmail('');
  };

  // 인증 코드 발송
  const sendCode = async () => {
    if (!email) return alert('이메일을 입력해주세요.');
    if (selectedOption === 'forgot-password' && !userId) return alert('아이디를 입력해주세요.');

    try {
      let endpoint = '';
      let bodyData = {};

      if (selectedOption === 'find-id') {
        endpoint = '/users/find-id/send-code';
        bodyData = { email };
      } else if (selectedOption === 'forgot-password') {
        endpoint = '/users/forgot-password/send-code';
        bodyData = { email, userId };
      }

      const res = await fetch(`http://localhost:3010${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();

      if (data.result) {
        setServerCode(data.code);
        setCodeSent(true);
        alert('인증 코드가 발송되었습니다. (테스트용: ' + data.code + ')');
      } else {
        alert(data.msg);
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류');
    }
  };

  // 인증 코드 확인
  const verifyCode = async () => {
    if (code !== serverCode) return alert('인증 코드가 올바르지 않습니다.');
    setVerified(true);

    if (selectedOption === 'find-id') {
      try {
        const res = await fetch('http://localhost:3010/users/find-id/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setFoundId(data.userId);
      } catch (err) {
        console.error(err);
        alert('서버 오류');
      }
    }
  };

  // 비밀번호 재설정
  const resetPassword = async () => {
    if (!newPassword) return alert('새 비밀번호를 입력해주세요.');
    try {
      const res = await fetch('http://localhost:3010/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, newPassword }),
      });
      const data = await res.json();
      alert(data.msg);
      if (data.result) navigate('/');
    } catch (err) {
      console.error(err);
      alert('서버 오류');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Typography variant="h4" gutterBottom>
          {selectedOption === 'find-id' ? '아이디 찾기' : '비밀번호 재설정'}
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup row value={selectedOption} onChange={handleOptionChange}>
            <FormControlLabel value="find-id" control={<Radio />} label="아이디 찾기" />
            <FormControlLabel value="forgot-password" control={<Radio />} label="비밀번호 재설정" />
          </RadioGroup>
        </FormControl>

        {selectedOption === 'forgot-password' && (
          <TextField
            label="아이디"
            variant="outlined"
            fullWidth
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            sx={{ mb: 2 }}
            disabled={verified}
          />
        )}

        <TextField
          label="이메일"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          disabled={verified}
        />

        {!codeSent && <Button fullWidth variant="contained" onClick={sendCode}>인증 코드 발송</Button>}

        {codeSent && !verified && (
          <>
            <TextField
              label="인증 코드 입력"
              variant="outlined"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
              sx={{ my: 2 }}
            />
            <Button fullWidth variant="contained" onClick={verifyCode}>인증</Button>
          </>
        )}

        {verified && selectedOption === 'find-id' && (
          <Typography sx={{ mt: 2 }}>회원님의 아이디: {foundId}</Typography>
        )}

        {verified && selectedOption === 'forgot-password' && (
          <>
            <TextField
              label="새 비밀번호"
              type="password"
              variant="outlined"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ my: 2 }}
            />
            <Button fullWidth variant="contained" onClick={resetPassword}>비밀번호 변경</Button>
          </>
        )}

        <Typography variant="body2" sx={{ mt: 2 }}>
          <a href="/">로그인 페이지로 돌아가기</a>
        </Typography>
      </Box>
    </Container>
  );
}

export default FindCredentials;
