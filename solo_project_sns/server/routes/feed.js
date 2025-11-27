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
        const [list] = await db.query(`
            SELECT post_id, user_id, content, image_url, created_at, updated_at
            FROM feed
            ORDER BY created_at DESC
        `);
        res.json({ list, result: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "피드 조회 중 오류 발생" });
    }
});

// ----------------------------------------
// 3. 피드 삭제
// ----------------------------------------
router.delete("/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
        const [rows] = await db.query("SELECT image_url FROM feed WHERE post_id = ?", [postId]);

        if (rows.length > 0 && rows[0].image_url) {
            const filePath = path.join(uploadDir, path.basename(rows[0].image_url));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await db.query("DELETE FROM feed WHERE post_id = ?", [postId]);

        res.json({ result: true, msg: "삭제되었습니다!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "삭제 중 오류 발생" });
    }
});

// ----------------------------------------
// ❤️ 좋아요 기능
// ----------------------------------------
router.post("/likes", async (req, res) => {
    const { post_id, user_id } = req.body;

    try {
        const [exists] = await db.query(
            "SELECT like_id FROM feed_likes WHERE post_id = ? AND user_id = ?",
            [post_id, user_id]
        );

        if (exists.length > 0) {
            res.json({ result: false, msg: "이미 좋아요를 눌렀습니다." });
            return;
        }

        await db.query(
            "INSERT INTO feed_likes (like_id, post_id, user_id, created_at) VALUES (UUID(), ?, ?, NOW())",
            [post_id, user_id]
        );

        res.json({ result: true, msg: "좋아요 완료!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false });
    }
});

// 좋아요 개수 조회
router.get("/likes/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM feed_likes WHERE post_id = ?",
            [postId]
        );
        res.json({ count: rows[0].count });
    } catch (err) {
        console.error(err);
        res.json({ count: 0 });
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
// 🔗 공유 기능 (조회수 증가)
// ----------------------------------------
router.get("/share/:postId", async (req, res) => {
    try {
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
