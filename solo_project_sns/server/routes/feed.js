const express = require('express');
const router = express.Router();
const db = require("../db");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// uploads 폴더
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ----------------------------------------
// 1. 피드 등록
// ----------------------------------------
router.post("/", upload.single('file'), async (req, res) => {
    try {
        const { userId, content } = req.body;
        let imageUrl = null;

        if (req.file) {
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        await db.query(
            `INSERT INTO feed (post_id, user_id, content, image_url, created_at, updated_at)
             VALUES (UUID(), ?, ?, ?, NOW(), NOW())`,
            [userId, content, imageUrl]
        );

        const [rows] = await db.query(
            "SELECT * FROM feed WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            [userId]
        );

        res.json({ result: true, feed: rows[0], msg: "피드 등록 완료" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "피드 등록 실패" });
    }
});

// ----------------------------------------
// 2. 전체 피드 조회
// ----------------------------------------
router.get("/", async (req, res) => {
    try {
        const sql = `
            SELECT 
                f.post_id,
                f.user_id,
                u.username,
                u.profile_img,
                f.content,
                f.image_url,
                f.created_at,
                f.updated_at
            FROM Feed f
            JOIN Users u ON f.user_id = u.user_id
            ORDER BY f.created_at DESC
        `;
        const [list] = await db.query(sql);

        res.json({
            list,
            result: true
        });
    } catch (error) {
        console.error(error);
        res.json({ result: false, msg: "피드 목록 조회 중 오류 발생" });
    }
});


// ----------------------------------------
// 3. 피드 삭제 (작성자만 가능)
// ----------------------------------------
router.delete("/:postId", async (req, res) => {
    const { postId } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ result: false, msg: "로그인이 필요합니다." });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, 'server_secret_key');
        const userId = decoded.userId;

        // 게시물 작성자 확인
        const [feedRows] = await db.query("SELECT user_id, image_url FROM feed WHERE post_id = ?", [postId]);

        if (feedRows.length === 0) {
            return res.status(404).json({ result: false, msg: "게시물을 찾을 수 없습니다." });
        }

        if (feedRows[0].user_id !== userId) {
            return res.status(403).json({ result: false, msg: "본인이 작성한 게시물만 삭제할 수 있습니다." });
        }

        // 이미지 파일 삭제
        if (feedRows[0].image_url) {
            const filePath = path.join(uploadDir, path.basename(feedRows[0].image_url));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // 관련 좋아요, 댓글도 삭제
        await db.query("DELETE FROM feed_likes WHERE post_id = ?", [postId]);
        await db.query("DELETE FROM feed_comments WHERE post_id = ?", [postId]);

        // 게시물 삭제
        await db.query("DELETE FROM feed WHERE post_id = ?", [postId]);

        res.json({ result: true, msg: "삭제되었습니다!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "삭제 중 오류 발생" });
    }
});

// ----------------------------------------
// ❤️ 좋아요 기능 (토글)
// ----------------------------------------
router.post("/likes", async (req, res) => {
    const { post_id, user_id } = req.body;

    try {
        const [exists] = await db.query(
            "SELECT like_id FROM feed_likes WHERE post_id = ? AND user_id = ?",
            [post_id, user_id]
        );

        if (exists.length > 0) {
            // 이미 좋아요를 눌렀으면 취소
            await db.query(
                "DELETE FROM feed_likes WHERE post_id = ? AND user_id = ?",
                [post_id, user_id]
            );
            res.json({ result: true, msg: "좋아요 취소", isLiked: false });
        } else {
            // 좋아요 추가
            await db.query(
                "INSERT INTO feed_likes (like_id, post_id, user_id, created_at) VALUES (UUID(), ?, ?, NOW())",
                [post_id, user_id]
            );
            res.json({ result: true, msg: "좋아요 완료!", isLiked: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false });
    }
});

// 좋아요 개수 및 사용자 좋아요 여부 조회
router.get("/likes/:postId", async (req, res) => {
    const { postId } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM feed_likes WHERE post_id = ?",
            [postId]
        );

        let isLiked = false;
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, 'server_secret_key');
                const userId = decoded.userId;

                const [likeRows] = await db.query(
                    "SELECT like_id FROM feed_likes WHERE post_id = ? AND user_id = ?",
                    [postId, userId]
                );
                isLiked = likeRows.length > 0;
            } catch (err) {
                // 토큰이 없거나 유효하지 않으면 isLiked는 false
            }
        }

        res.json({ count: rows[0].count, isLiked });
    } catch (err) {
        console.error(err);
        res.json({ count: 0, isLiked: false });
    }
});

// ----------------------------------------
// 💬 댓글 기능
// ----------------------------------------
router.post("/comments", async (req, res) => {
    const { post_id, user_id, comment } = req.body;

    try {
        await db.query(
            "INSERT INTO feed_comments (comment_id, post_id, user_id, comment, created_at) VALUES (UUID(), ?, ?, ?, NOW())",
            [post_id, user_id, comment]
        );

        res.json({ result: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false });
    }
});

// 댓글 조회
router.get("/comments/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM feed_comments WHERE post_id = ? ORDER BY created_at ASC",
            [postId]
        );
        res.json({ list: rows });
    } catch (err) {
        console.error(err);
        res.json({ list: [] });
    }
});

// ----------------------------------------
// 🔗 공유 기능 (조회수 증가) - 로그인 유저만
// ----------------------------------------
router.get("/share/:postId", async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ result: false, msg: "로그인이 필요합니다." });
    }

    try {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, 'server_secret_key'); // 토큰 검증만 수행

        await db.query(
            "UPDATE feed SET view_count = IFNULL(view_count, 0) + 1 WHERE post_id = ?",
            [req.params.postId]
        );
        res.json({ result: true, msg: "공유 완료!" });
    } catch (err) {
        console.error(err);
        res.json({ result: false, msg: "공유 실패" });
    }
});

module.exports = router;
