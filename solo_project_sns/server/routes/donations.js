const express = require('express');
const router = express.Router();
const db = require('../db');

// 후원 목록 조회
router.get('/list', async (req, res) => {
  try {
    const sql = `
      SELECT 
        d.donation_id,
        d.user_id,
        d.amount,
        d.message,
        d.created_at,
        u.username AS donor_name,
        u.profile_img AS profile_image,
        NULL AS image_url
      FROM donations d
      JOIN users u ON d.user_id = u.user_id
      ORDER BY d.created_at DESC
    `;
    
    const [rows] = await db.query(sql);
    res.json({ result: true, list: rows });
  } catch (err) {
    console.error("🔥 후원 목록 조회 에러:", err.message);
    res.status(500).json({ result: false, msg: '후원 목록 조회 실패', error: err.message });
  }
});

// 후원 등록
router.post('/add', async (req, res) => {
  try {
    const { user_id, amount, message } = req.body;

    if (!user_id || !amount) {
      return res.status(400).json({ result: false, msg: "필수 값 누락" });
    }

    const donation_id = Date.now().toString();

    const insertDonationSql = `
      INSERT INTO donations (donation_id, user_id, amount, message, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    await db.query(insertDonationSql, [donation_id, user_id, amount, message]);

    const updateHallSql = `
      INSERT INTO donation_hall (user_id, total_amount, last_donation)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        total_amount = CAST(total_amount AS UNSIGNED) + CAST(VALUES(total_amount) AS UNSIGNED),
        last_donation = NOW()
    `;
    await db.query(updateHallSql, [user_id, amount]);

    res.json({ result: true, msg: '후원 등록 완료' });
  } catch (err) {
    console.error("🔥 후원 등록 에러:", err.message);
    res.status(500).json({ result: false, msg: '후원 등록 실패', error: err.message });
  }
});

module.exports = router;
