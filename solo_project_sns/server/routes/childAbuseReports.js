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

// 아동 학대 신고 등록 API
router.post("/reports/add", upload.single('image'), async (req, res) => {
    try {
        const { region_id, title, description, status } = req.body;
        let imageUrl = null;

        if (req.file) {
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        // 아동학대 신고 등록
        await db.query(
            `INSERT INTO child_abuse_reports (region_id, title, description, image_url, status, reported_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [region_id, title, description, imageUrl, status]
        );

        res.json({ result: true, msg: "아동 학대 신고 등록 완료" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "아동 학대 신고 등록 실패" });
    }
});

// 전체 아동학대 신고 조회 API
router.get("/reports", async (req, res) => {
    try {
        const sql = `
            SELECT 
                r.region_name,
                c.report_id,
                c.title,
                c.description,
                c.image_url,
                c.status,
                c.reported_at
            FROM child_abuse_reports c
            JOIN regions r ON c.region_id = r.region_id
            ORDER BY c.reported_at DESC
        `;
        const [list] = await db.query(sql);

        res.json({
            list,
            result: true
        });
    } catch (error) {
        console.error(error);
        res.json({ result: false, msg: "아동학대 신고 목록 조회 중 오류 발생" });
    }
});

// 지역 목록 조회 API
router.get("/regions", async (req, res) => {
    try {
        const sql = "SELECT * FROM regions ORDER BY region_name";
        const [regions] = await db.query(sql);
        res.json({ list: regions, result: true });
    } catch (error) {
        console.error(error);
        res.json({ result: false, msg: "지역 목록 조회 실패" });
    }
});

module.exports = router;
