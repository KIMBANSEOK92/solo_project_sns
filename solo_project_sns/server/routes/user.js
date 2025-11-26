const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_KEY = "server_secret_key";

// -----------------
// Multer 설정
// -----------------
const uploadDir = path.join(__dirname, '..', 'uploads');

// uploads 폴더 없으면 생성
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const upload = multer({ storage: storage });


// 파일 업로드
router.post('/upload', upload.array('file'), async (req, res) => {
    try {
        const userId = req.body.userId;
        const files = req.files;

        console.log("업로드된 파일:", files);
        console.log("사용자 ID:", userId);

        res.json({ result: "success", files: files.map(f => f.filename) });
    } catch (error) {
        console.error(error);
        res.json({ result: "fail", msg: "파일 업로드 실패" });
    }
});


// 특정 사용자 조회
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const sql = `
            SELECT U.*, IFNULL(F.cnt, 0) AS cnt
            FROM Users U
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS cnt
                FROM Feed
                GROUP BY user_id
            ) F ON U.user_id = F.user_id
            WHERE U.user_id = ?
        `;
        const [list] = await db.query(sql, [userId]);
        res.json({
            user: list[0],
            result: "success"
        });
    } catch (error) {
        console.error(error);
        res.json({ result: "fail" });
    }
});


// 회원가입
router.post("/join", async (req, res) => {
    const { userId, pwd, userName, email, region } = req.body;
    try {
        const hashPwd = await bcrypt.hash(pwd, 10);

        // 먼저 회원가입만 DB에 저장 (프로필 이미지는 나중에)
        const sql = `
            INSERT INTO Users (user_id, username, email, password, region, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await db.query(sql, [userId, userName, email, hashPwd, region]);

        if (result.affectedRows === 1) {
            res.json({ result: true, msg: "가입되었습니다!" });
        } else {
            res.json({ result: false, msg: "가입 실패" });
        }
    } catch (error) {
        console.error(error);
        res.json({ result: false, msg: "가입 중 오류 발생" });
    }
});


// 아이디 중복 확인
router.get("/check/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const sql = "SELECT user_id FROM Users WHERE user_id = ?";
        const [list] = await db.query(sql, [userId]);
        if (list.length > 0) {
            res.json({ available: false });
        } else {
            res.json({ available: true });
        }
    } catch (err) {
        console.error(err);
        res.json({ available: false, msg: "조회 중 오류 발생" });
    }
});



// -----------------
// 로그인
// -----------------
router.post("/login", async (req, res) => {
    const { userId, pwd } = req.body;
    try {
        const sql = "SELECT * FROM Users WHERE user_id = ?";
        const [list] = await db.query(sql, [userId]);

        let msg = "";
        let result = false;
        let token = null;

        if (list.length > 0) {
            const match = await bcrypt.compare(pwd, list[0].password);
            if (match) {
                msg = list[0].username + "님 환영합니다!";
                result = true;

                const user = {
                    userId: list[0].user_id,
                    userName: list[0].username,
                    status: "A"
                };
                token = jwt.sign(user, JWT_KEY, { expiresIn: '1h' });
                console.log("발급된 토큰:", token);
            } else {
                msg = "비밀번호가 올바르지 않습니다.";
            }
        } else {
            msg = "아이디가 존재하지 않습니다.";
        }

        res.json({ result, msg, token });
    } catch (error) {
        console.error(error);
        res.json({ result: false, msg: "로그인 중 오류 발생" });
    }
});

module.exports = router;
