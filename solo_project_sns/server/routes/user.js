const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_KEY = "server_secret_key";
let codeStorage = {}; // 이메일 인증 코드 임시 저장

// -----------------
// Multer 설정
// -----------------
const uploadDir = path.join(__dirname, '..', 'uploads');
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

const upload = multer({ storage });

// -----------------
// 파일 업로드 + DB profile_img 업데이트
// -----------------
router.post('/upload', upload.single("file"), async (req, res) => {
    try {
        const userId = req.body.userId;
        const file = req.file;

        if (!file) {
            return res.json({ result: false, msg: "업로드된 파일이 없습니다." });
        }

        const filePath = `/uploads/${file.filename}`;

        // DB 업데이트
        const sql = `
            UPDATE Users
            SET profile_img = ?
            WHERE user_id = ?
        `;
        await db.query(sql, [filePath, userId]);

        res.json({
            result: true,
            msg: "프로필 이미지가 저장되었습니다.",
            filePath
        });

    } catch (error) {
        console.error(error);
        res.json({ result: false, msg: "파일 업로드 처리 중 오류 발생" });
    }
});

// -----------------
// 전체 사용자 조회
// -----------------
router.get("/", async (req, res) => {
    try {
        const sql = `
            SELECT user_id, username, email, profile_img, region, created_at
            FROM Users
            ORDER BY created_at DESC
        `;
        const [list] = await db.query(sql);

        res.json({
            list,
            result: true
        });
    } catch (error) {
        console.error(error);
        res.json({ result: false, msg: "사용자 목록 조회 중 오류 발생" });
    }
});

// -----------------
// 단일 사용자 조회
// -----------------
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

// -----------------
// 회원가입
// -----------------
router.post("/join", async (req, res) => {
    const { userId, pwd, userName, email, region } = req.body;

    try {
        const hashPwd = await bcrypt.hash(pwd, 10);

        const sql = `
            INSERT INTO Users (user_id, username, email, password, region, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await db.query(sql, [
            userId,
            userName,
            email,
            hashPwd,
            region
        ]);

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

// -----------------
// 아이디 중복 확인
// -----------------
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
                    profileImage: list[0].profile_img,
                    status: "A"
                };

                token = jwt.sign(user, JWT_KEY, { expiresIn: "1h" });
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

// -----------------
// 아이디 찾기 이메일 인증 코드 발송
// -----------------
router.post("/find-id/send-code", async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query("SELECT user_id FROM Users WHERE email = ?", [email]);
    if (users.length === 0) return res.json({ result: false, msg: "등록된 이메일이 없습니다." });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codeStorage[email] = code;
    res.json({ result: true, code }); // 테스트용으로 code 반환
  } catch (err) {
    console.error(err);
    res.json({ result: false, msg: "서버 오류" });
  }
});

// 인증 성공 후 아이디 반환
router.post("/find-id/verify", async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query("SELECT user_id FROM Users WHERE email = ?", [email]);
    if (users.length === 0) return res.json({ result: false, msg: "사용자를 찾을 수 없습니다." });
    res.json({ userId: users[0].user_id });
  } catch (err) {
    console.error(err);
    res.json({ result: false, msg: "서버 오류" });
  }
});

// -----------------
// 비밀번호 재설정 이메일 인증 코드 발송
// -----------------
router.post("/forgot-password/send-code", async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query("SELECT user_id FROM Users WHERE email = ?", [email]);
    if (users.length === 0) return res.json({ result: false, msg: "등록된 이메일이 없습니다." });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codeStorage[email] = code;
    res.json({ result: true, code }); // 테스트용으로 code 반환
  } catch (err) {
    console.error(err);
    res.json({ result: false, msg: "서버 오류" });
  }
});

// -----------------
// 새 비밀번호 DB 업데이트
// -----------------
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const hashPwd = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE Users SET password = ? WHERE email = ?", [hashPwd, email]);
    res.json({ result: true, msg: "비밀번호가 변경되었습니다." });
  } catch (err) {
    console.error(err);
    res.json({ result: false, msg: "비밀번호 변경 중 오류 발생" });
  }
});

// ======================================================
// 마이페이지용 전체 정보 조회 
// ======================================================
router.get("/:userId/profile", async (req, res) => {
  const { userId } = req.params;

  try {
    // 유저 정보 조회 (intro 컬럼 제외 - 테이블에 없을 수 있음)
    const [userRows] = await db.query(
      `SELECT 
          user_id AS userId,
          username AS userName,
          email,
          region,
          profile_img AS profileImage 
       FROM Users 
       WHERE user_id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ result: false, msg: "사용자를 찾을 수 없습니다." });
    }

    const user = userRows[0];
    user.intro = null; // intro 컬럼이 없으므로 기본값 설정

    // 피드 조회
    const [feeds] = await db.query(
      `SELECT post_id, content, created_at 
       FROM Feed 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    // 친구 목록 조회
    const [friends] = await db.query(
      `SELECT relation_id, requester_id, receiver_id, status 
       FROM Friends 
       WHERE requester_id = ? OR receiver_id = ?`,
      [userId, userId]
    );

    // 후원 내역 조회
    const [donations] = await db.query(
      `SELECT donation_id, amount, message, created_at 
       FROM Donations 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    // 신고 내역 조회 (테이블명 확인 - child_abuse_reports일 수 있음)
    let reports = [];
    try {
      const [reportsResult] = await db.query(
        `SELECT report_id, title, description, status, reported_at 
         FROM child_abuse_reports 
         WHERE user_id = ?
         ORDER BY reported_at DESC`,
        [userId]
      );
      reports = reportsResult;
    } catch (reportErr) {
      // 테이블이 없거나 user_id 컬럼이 없으면 빈 배열 반환
      console.log("신고 내역 조회 실패 (테이블 또는 컬럼 없음):", reportErr.message);
      reports = [];
    }

    return res.json({
      result: true,
      user,
      feeds,
      friends,
      donations,
      reports,
    });

  } catch (error) {
    console.error("Profile API Error:", error);
    res.status(500).json({ result: false, msg: "서버 오류 발생" });
  }
});



module.exports = router;
