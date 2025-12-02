const express = require('express');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');

// 메시지 테이블 자동 생성
const ensureMessagesTable = async () => {
    try {
        await db.query("SELECT 1 FROM messages LIMIT 1");
    } catch (tableErr) {
        if (tableErr.code === 'ER_NO_SUCH_TABLE') {
            await db.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    message_id VARCHAR(255) PRIMARY KEY,
                    sender_id VARCHAR(255) NOT NULL,
                    receiver_id VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_sender (sender_id),
                    INDEX idx_receiver (receiver_id),
                    INDEX idx_created (created_at)
                )
            `);
            console.log("messages 테이블 생성 완료");
        }
    }
};

// JWT 토큰 검증 미들웨어
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ result: false, msg: "인증이 필요합니다." });
    }

    try {
        const decoded = jwt.verify(token, 'server_secret_key');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ result: false, msg: "유효하지 않은 토큰입니다." });
    }
};

// =======================================================
// 1. 대화 목록 조회 (GET /messages/conversations)
// =======================================================
router.get("/conversations", verifyToken, async (req, res) => {
    try {
        await ensureMessagesTable();
        const userId = req.userId;

        // 최근 대화한 사용자 목록 조회
        const [conversations] = await db.query(`
            SELECT 
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END AS other_user_id,
                u.username,
                u.profile_img,
                MAX(m.created_at) AS last_message_time,
                (
                    SELECT content 
                    FROM messages 
                    WHERE (sender_id = ? AND receiver_id = other_user_id) 
                       OR (sender_id = other_user_id AND receiver_id = ?)
                    ORDER BY created_at DESC 
                    LIMIT 1
                ) AS last_message,
                (
                    SELECT COUNT(*) 
                    FROM messages 
                    WHERE receiver_id = ? AND sender_id = other_user_id AND is_read = FALSE
                ) AS unread_count
            FROM messages m
            JOIN Users u ON u.user_id = CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END
            WHERE m.sender_id = ? OR m.receiver_id = ?
            GROUP BY other_user_id, u.username, u.profile_img
            ORDER BY last_message_time DESC
        `, [userId, userId, userId, userId, userId, userId, userId]);

        res.json({ result: true, list: conversations });
    } catch (err) {
        console.error("대화 목록 조회 오류:", err);
        res.status(500).json({ result: false, msg: "대화 목록 조회 중 오류 발생" });
    }
});

// =======================================================
// 2. 특정 사용자와의 메시지 내역 조회 (GET /messages/:otherUserId)
// =======================================================
router.get("/:otherUserId", verifyToken, async (req, res) => {
    try {
        await ensureMessagesTable();
        const userId = req.userId;
        const { otherUserId } = req.params;

        // 메시지 내역 조회
        const [messages] = await db.query(`
            SELECT 
                m.message_id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.is_read,
                m.created_at,
                u.username AS sender_name,
                u.profile_img AS sender_profile
            FROM messages m
            JOIN Users u ON m.sender_id = u.user_id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `, [userId, otherUserId, otherUserId, userId]);

        // 받은 메시지를 읽음 처리
        await db.query(`
            UPDATE messages 
            SET is_read = TRUE 
            WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
        `, [otherUserId, userId]);

        res.json({ result: true, list: messages });
    } catch (err) {
        console.error("메시지 내역 조회 오류:", err);
        res.status(500).json({ result: false, msg: "메시지 내역 조회 중 오류 발생" });
    }
});

// =======================================================
// 3. 메시지 전송 (POST /messages)
// =======================================================
router.post("/", verifyToken, async (req, res) => {
    try {
        await ensureMessagesTable();
        const senderId = req.userId;
        const { receiver_id, content } = req.body;

        if (!receiver_id || !content || !content.trim()) {
            return res.status(400).json({ result: false, msg: "수신자와 메시지 내용을 입력해주세요." });
        }

        // 수신자 존재 여부 확인
        const [receiverCheck] = await db.query("SELECT user_id FROM Users WHERE user_id = ?", [receiver_id]);
        if (receiverCheck.length === 0) {
            return res.status(404).json({ result: false, msg: "수신자를 찾을 수 없습니다." });
        }

        const message_id = `${Date.now()}_${senderId}_${receiver_id}`;

        await db.query(`
            INSERT INTO messages (message_id, sender_id, receiver_id, content, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [message_id, senderId, receiver_id, content.trim()]);

        res.json({ result: true, msg: "메시지가 전송되었습니다.", message_id });
    } catch (err) {
        console.error("메시지 전송 오류:", err);
        res.status(500).json({ result: false, msg: "메시지 전송 중 오류 발생" });
    }
});

// =======================================================
// 4. 읽지 않은 메시지 개수 조회 (GET /messages/unread/count)
// =======================================================
router.get("/unread/count", verifyToken, async (req, res) => {
    try {
        await ensureMessagesTable();
        const userId = req.userId;

        const [result] = await db.query(`
            SELECT COUNT(*) as count
            FROM messages
            WHERE receiver_id = ? AND is_read = FALSE
        `, [userId]);

        res.json({ result: true, count: result[0].count });
    } catch (err) {
        console.error("읽지 않은 메시지 개수 조회 오류:", err);
        res.status(500).json({ result: false, msg: "메시지 개수 조회 중 오류 발생" });
    }
});

// =======================================================
// 5. 메시지 삭제 (DELETE /messages/:messageId)
// =======================================================
router.delete("/:messageId", verifyToken, async (req, res) => {
    try {
        await ensureMessagesTable();
        const userId = req.userId;
        const { messageId } = req.params;

        // 본인이 보낸 메시지만 삭제 가능
        const [result] = await db.query(`
            DELETE FROM messages 
            WHERE message_id = ? AND sender_id = ?
        `, [messageId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ result: false, msg: "메시지를 찾을 수 없거나 삭제 권한이 없습니다." });
        }

        res.json({ result: true, msg: "메시지가 삭제되었습니다." });
    } catch (err) {
        console.error("메시지 삭제 오류:", err);
        res.status(500).json({ result: false, msg: "메시지 삭제 중 오류 발생" });
    }
});

module.exports = router;

