const express = require('express');
const router = express.Router();
const db = require("../db"); // db.query 사용
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// uploads 폴더 확인
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --------------------
// 피드 등록 (이미지 선택 가능)
// --------------------
router.post("/", upload.single('file'), async (req, res) => {
    try {
        const { userId, content } = req.body;
        let imageUrl = null;

        if (req.file) {
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const sql = `
            INSERT INTO feed (post_id, user_id, content, image_url, created_at, updated_at)
            VALUES (UUID(), ?, ?, ?, NOW(), NOW())
        `;
        const [result] = await db.query(sql, [userId, content, imageUrl]);

        res.json({ result: { insertId: result.insertId }, msg: "success" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Feed insert error" });
    }
});

// --------------------
// 특정 사용자 피드 조회
// --------------------
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const sql = `
            SELECT post_id, user_id, content, image_url, created_at, updated_at
            FROM feed
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;
        const [list] = await db.query(sql, [userId]);
        res.json({ list, result: "success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: "fail", msg: "피드 조회 중 오류 발생" });
    }
});

// --------------------
// 피드 삭제
// --------------------
router.delete("/:postId", async (req, res) => {
    const { postId } = req.params;
    try {
        // 이미지 파일 삭제
        const [rows] = await db.query("SELECT image_url FROM feed WHERE post_id = ?", [postId]);
        if (rows.length > 0 && rows[0].image_url) {
            const filePath = path.join(uploadDir, path.basename(rows[0].image_url));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // 피드 삭제
        const [result] = await db.query("DELETE FROM feed WHERE post_id = ?", [postId]);
        if (result.affectedRows === 1) {
            res.json({ result: "success", msg: "삭제되었습니다!" });
        } else {
            res.status(404).json({ result: "fail", msg: "해당 피드가 존재하지 않습니다." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: "fail", msg: "삭제 중 오류 발생" });
    }
});

module.exports = router;
