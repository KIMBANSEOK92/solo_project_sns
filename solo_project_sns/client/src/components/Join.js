import React, { useRef, useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  IconButton,
  Avatar
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { Link, useNavigate } from 'react-router-dom';

function Join() {
  const navigate = useNavigate();
  const userId = useRef();
  const pwd = useRef();
  const pwdConfirm = useRef(); // 비밀번호 확인
  const userName = useRef();
  const email = useRef();
  const region = useRef();

  const [files, setFiles] = useState([]);
  const [idChecked, setIdChecked] = useState(false); // 아이디 중복 확인 상태
  const [idMsg, setIdMsg] = useState("");

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const fnUploadFile = async (userId) => {
    if (files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }
    formData.append("userId", userId);

    try {
      const res = await fetch("http://localhost:3010/users/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      console.log("파일 업로드 결과:", data);
    } catch (err) {
      console.error("업로드 오류:", err);
    }
  };

  // =========================
  // 아이디 중복 확인
  // =========================
  const handleCheckId = async () => {
    const id = userId.current.value.trim();
    if (!id) return alert("아이디를 입력하세요.");

    try {
      const res = await fetch(`http://localhost:3010/users/check/${id}`);
      const data = await res.json();
      if (data.available) {
        setIdChecked(true);
        setIdMsg("사용 가능한 아이디입니다.");
      } else {
        setIdChecked(false);
        setIdMsg("이미 사용 중인 아이디입니다.");
      }
    } catch (err) {
      console.error(err);
      alert("중복 확인 중 오류 발생");
    }
  };

  // =========================
  // 회원가입
  // =========================
  const handleJoin = async () => {
    const param = {
      userId: userId.current.value.trim(),
      pwd: pwd.current.value,
      userName: userName.current.value.trim(),
      email: email.current.value.trim(),
      region: region.current.value.trim(),
    };

    // 비밀번호 재입력 확인
    if (pwd.current.value !== pwdConfirm.current.value) {
      return alert("비밀번호가 일치하지 않습니다.");
    }

    // 아이디 중복 확인 여부
    if (!idChecked) {
      return alert("아이디 중복 확인을 해주세요.");
    }

    try {
      const res = await fetch("http://localhost:3010/users/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(param)
      });
      const data = await res.json();
      alert(data.msg);

      if (data.result && files.length > 0) {
        await fnUploadFile(param.userId);
      }

      navigate("/");
    } catch (err) {
      console.error("회원가입 오류:", err);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Typography variant="h4" gutterBottom>회원가입</Typography>

        <Box display="flex" alignItems="center">
          <TextField inputRef={userId} label="아이디" variant="outlined" margin="normal" fullWidth />
          <Button sx={{ ml: 1 }} onClick={handleCheckId} variant="contained">중복확인</Button>
        </Box>
        <Typography variant="body2" color={idChecked ? "green" : "red"}>{idMsg}</Typography>

        <TextField inputRef={pwd} label="비밀번호" variant="outlined" margin="normal" type="password" fullWidth />
        <TextField inputRef={pwdConfirm} label="비밀번호 확인" variant="outlined" margin="normal" type="password" fullWidth />
        <TextField inputRef={userName} label="이름" variant="outlined" margin="normal" fullWidth />
        <TextField inputRef={email} label="이메일" variant="outlined" margin="normal" fullWidth />
        <TextField inputRef={region} label="지역" variant="outlined" margin="normal" fullWidth />

        {/* 파일 업로드 */}
        <Box display="flex" alignItems="center" width="100%" mt={2}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            multiple
          />
          <label htmlFor="file-upload">
            <IconButton color="primary" component="span">
              <PhotoCamera />
            </IconButton>
          </label>

          {files.length > 0 && [...files].map((file, index) => (
            <Avatar key={index} alt="첨부 이미지" src={URL.createObjectURL(file)} sx={{ width: 56, height: 56, ml: 2 }} />
          ))}
        </Box>

        <Button variant="contained" color="primary" fullWidth sx={{ mt: 3 }} onClick={handleJoin}>
          회원가입
        </Button>

        <Typography variant="body2" sx={{ mt: 1 }}>
          이미 회원이라면? <Link to="/login">로그인</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Join;
