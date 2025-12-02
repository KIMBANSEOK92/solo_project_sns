const express = require('express');
const router = express.Router();
const db = require('../db'); // db 연결 객체

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

    // 후원 등록
    const insertDonationSql = `
      INSERT INTO donations (donation_id, user_id, amount, message, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    await db.query(insertDonationSql, [donation_id, user_id, amount, message]);

    // 후원 금액 누적 업데이트
    const updateHallSql = `
      INSERT INTO donation_hall (user_id, total_amount, last_donation)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        total_amount = total_amount + CAST(VALUES(total_amount) AS UNSIGNED),
        last_donation = NOW()
    `;
    await db.query(updateHallSql, [user_id, amount]);

    res.json({ result: true, msg: '후원 등록 완료' });
  } catch (err) {
    console.error("🔥 후원 등록 에러:", err.message);
    res.status(500).json({ result: false, msg: '후원 등록 실패', error: err.message });
  }
});

// 후원 수정 (PUT)
router.put('/edit/:donation_id', async (req, res) => {
  const { donation_id } = req.params;
  let { user_id, amount, message } = req.body;

  amount = Number(amount);

  if (!user_id) {
    console.error("🔥 후원 수정 에러: user_id 누락 (req.body)");
    return res.status(400).json({ result: false, msg: '사용자 ID가 누락되었습니다.' });
  }
  if (isNaN(amount) || amount <= 0) {
    console.error("🔥 후원 수정 에러: amount 값이 유효하지 않습니다.");
    return res.status(400).json({ result: false, msg: '유효한 후원 금액을 입력해주세요.' });
  }

  try {
    // 1. 후원 내역 조회
    const [rows] = await db.query('SELECT user_id, amount FROM donations WHERE donation_id = ?', [donation_id]);
    const donation = rows[0];

    if (!donation) {
      return res.status(404).json({ result: false, msg: '후원 내역을 찾을 수 없습니다.' });
    }

    const oldAmount = Number(donation.amount);

    // 2. 후원자가 본인인지 확인 (권한 확인)
    if (String(donation.user_id) !== String(user_id)) {
      console.error(`🔥 권한 없음: 요청 user_id(${user_id}) !== 후원 user_id(${donation.user_id})`);
      return res.status(403).json({ result: false, msg: '권한이 없습니다.' });
    }

    // 3. 후원 수정
    // 💡 'updated_at' 컬럼을 제거하여 DB 스키마 오류를 회피
    const updateDonationSql = `
      UPDATE donations
      SET amount = ?, message = ?
      WHERE donation_id = ?
    `;
    await db.query(updateDonationSql, [amount, message, donation_id]);

    // 4. 후원 금액 변경 시 누적 금액 수정 (이전 금액을 빼고 새 금액을 더합니다)
    const amountDifference = amount - oldAmount;

    const updateHallSql = `
      UPDATE donation_hall
      SET total_amount = total_amount + ?, last_donation = NOW()
      WHERE user_id = ?
    `;
    await db.query(updateHallSql, [amountDifference, user_id]);

    res.json({ result: true, msg: '후원 수정 완료' });
  } catch (err) {
    console.error("🔥 후원 수정 에러:", err.message);
    res.status(500).json({ result: false, msg: '후원 수정 실패', error: err.message });
  }
});

// 후원 삭제 (DELETE)
router.delete('/delete/:donation_id', async (req, res) => {
  const { donation_id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    console.error("🔥 후원 삭제 에러: user_id 누락 (req.body)");
    return res.status(400).json({ result: false, msg: '사용자 ID가 누락되었습니다.' });
  }

  try {
    // 1. 후원 내역 조회
    const [rows] = await db.query('SELECT user_id, amount FROM donations WHERE donation_id = ?', [donation_id]);
    const donation = rows[0];

    if (!donation) {
      return res.status(404).json({ result: false, msg: '삭제할 후원 내역을 찾을 수 없습니다.' });
    }

    // 2. 후원자가 본인인지 확인 (권한 확인)
    if (String(donation.user_id) !== String(user_id)) {
      console.error(`🔥 권한 없음: 요청 user_id(${user_id}) !== 후원 user_id(${donation.user_id})`);
      return res.status(403).json({ result: false, msg: '권한이 없습니다.' });
    }

    const amountToDelete = Number(donation.amount);

    // 3. 후원 삭제
    const deleteDonationSql = 'DELETE FROM donations WHERE donation_id = ?';
    await db.query(deleteDonationSql, [donation_id]);

    // 4. 후원 금액 수정: 삭제된 금액만큼 빼기
    const updateHallSql = `
      UPDATE donation_hall
      SET total_amount = total_amount - ?, last_donation = NOW()
      WHERE user_id = ?
    `;
    await db.query(updateHallSql, [amountToDelete, user_id]);

    res.json({ result: true, msg: '후원 삭제 완료' });
  } catch (err) {
    console.error("🔥 후원 삭제 에러:", err.message);
    res.status(500).json({ result: false, msg: '후원 삭제 실패', error: err.message });
  }
});

module.exports = router;