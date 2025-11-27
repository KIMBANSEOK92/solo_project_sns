const express = require('express');
const router = express.Router();
const db = require("../db"); // 데이터베이스 연결 모듈
const { v4: uuidv4 } = require("uuid"); // relation_id 생성을 위해 uuid 모듈 사용

// =======================================================
// 1. 전체 친구 목록 조회 (GET /friends)
// (현재 로그인한 사용자 기준이 아닌, Friends 테이블 전체 조회)
// =======================================================
router.get("/", async (req, res) => {
    try {
        const [list] = await db.query(`
            SELECT 
                relation_id,
                requester_id,
                receiver_id,
                status,
                created_at
            FROM friends
            ORDER BY created_at DESC
        `);

        res.json({ list, result: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "친구 조회 중 오류 발생" });
    }
});


// =======================================================
// 2. 특정 사용자 기준 친구/요청 목록 조회 (GET /friends/:userId)
// ⚠️ 참고: 실제 서비스에서 가장 많이 사용하는 라우터 패턴
// =======================================================
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        // userId가 요청자이거나 수신자인 모든 친구 관계를 조회하고,
        // 각 관계에서 상대방의 유저 정보를 JOIN합니다.
        const [list] = await db.query(`
            SELECT
                f.relation_id,
                f.status,
                f.created_at,
                CASE 
                    WHEN f.requester_id = ? THEN f.receiver_id 
                    ELSE f.requester_id 
                END AS friend_id,
                u.username,
                u.profile_img,
                f.requester_id AS original_requester_id
            FROM friends f
            JOIN Users u 
                ON u.user_id = CASE 
                    WHEN f.requester_id = ? THEN f.receiver_id 
                    ELSE f.requester_id 
                END
            WHERE f.requester_id = ? OR f.receiver_id = ?
            ORDER BY f.created_at DESC
        `, [userId, userId, userId, userId]);

        res.json({ list, result: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "사용자별 친구 목록 조회 중 오류 발생" });
    }
});


// =======================================================
// 3. 친구 요청 보내기 (POST /friends)
// =======================================================
router.post("/", async (req, res) => {
    const { requester_id, receiver_id } = req.body;

    if (!requester_id || !receiver_id) {
        return res.status(400).json({ result: false, msg: "요청 정보가 부족합니다." });
    }
    if (requester_id === receiver_id) {
        return res.json({ result: false, msg: "자기 자신에게는 친구 요청을 보낼 수 없습니다." });
    }

    try {
        // 이미 친구/요청 상태인지 확인 (A->B 또는 B->A 모두 체크)
        const [exist] = await db.query(`
            SELECT status FROM friends
            WHERE 
                (requester_id = ? AND receiver_id = ?)
                OR
                (requester_id = ? AND receiver_id = ?)
        `, [requester_id, receiver_id, receiver_id, requester_id]);

        if (exist.length > 0) {
            const status = exist[0].status;
            if (status === 'pending') {
                return res.json({ result: false, msg: "이미 친구 요청이 전송되었거나 받았습니다." });
            } else if (status === 'accepted') {
                return res.json({ result: false, msg: "이미 친구입니다." });
            }
        }

        const relation_id = uuidv4();

        // 새로운 친구 요청 ('pending') 삽입
        await db.query(`
            INSERT INTO friends (relation_id, requester_id, receiver_id, status)
            VALUES (?, ?, ?, 'pending')
        `, [relation_id, requester_id, receiver_id]);

        res.json({ result: true, msg: "친구 요청이 전송되었습니다.", relation_id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "친구 요청 중 오류 발생" });
    }
});


// =======================================================
// 4. 친구 요청 수락 (PUT /friends/accept)
// =======================================================
// relation_id를 이용해 상태를 'accepted'로 변경합니다.
router.put("/accept", async (req, res) => {
    // ⚠️ relation_id 외에도 receiver_id(수락자)를 받아 권한 체크를 하는 것이 안전합니다.
    const { relation_id } = req.body;

    if (!relation_id) {
        return res.status(400).json({ result: false, msg: "relation_id가 필요합니다." });
    }

    try {
        const [result] = await db.query(`
            UPDATE friends
            SET status = 'accepted'
            WHERE relation_id = ? AND status = 'pending'
        `, [relation_id]);

        if (result.affectedRows === 0) {
            // 이미 수락되었거나 relation_id가 존재하지 않는 경우
            return res.status(400).json({ result: false, msg: "유효하지 않은 요청 ID이거나 이미 처리되었습니다." });
        }

        res.json({ result: true, msg: "친구 요청을 수락했습니다." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "친구 수락 중 오류 발생" });
    }
});


// =======================================================
// 5. 친구 삭제 또는 요청 거절 (DELETE /friends/:relation_id)
// =======================================================
router.delete("/:relation_id", async (req, res) => {
    const { relation_id } = req.params;

    if (!relation_id) {
        return res.status(400).json({ result: false, msg: "relation_id가 필요합니다." });
    }

    try {
        const [result] = await db.query(`
            DELETE FROM friends
            WHERE relation_id = ?
        `, [relation_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ result: false, msg: "해당 친구 관계를 찾을 수 없습니다." });
        }

        res.json({ result: true, msg: "친구 관계가 삭제(또는 요청 거절)되었습니다." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, msg: "친구 삭제 중 오류 발생" });
    }
});


module.exports = router;