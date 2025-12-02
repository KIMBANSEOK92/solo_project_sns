const express = require('express');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');

// 알림 테이블 자동 생성
const ensureNotificationsTable = async () => {
    try {
        await db.query("SELECT 1 FROM notifications LIMIT 1");
    } catch (tableErr) {
        if (tableErr.code === 'ER_NO_SUCH_TABLE') {
            await db.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    notification_id VARCHAR(255) PRIMARY KEY,
                    user_id INT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    message TEXT,
                    related_id VARCHAR(255),
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log("notifications 테이블 생성 완료");
        } else {
            throw tableErr;
        }
    }
};

// =======================================================
// 1. 알림 목록 조회 (GET /notifications)
// =======================================================
router.get("/", async (req, res) => {
    try {
        await ensureNotificationsTable();

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ result: false, msg: "인증이 필요합니다." });
        }

        let userId = null;
        try {
            const decoded = jwt.verify(token, 'server_secret_key');
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ result: false, msg: "유효하지 않은 토큰입니다." });
        }

        const [list] = await db.query(`
            SELECT 
                notification_id,
                user_id,
                type,
                message,
                related_id,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [userId]);

        res.json({ result: true, list });
    } catch (err) {
        console.error("알림 조회 오류:", err);
        res.status(500).json({ result: false, msg: "알림 조회 중 오류 발생" });
    }
});

// =======================================================
// 2. 읽지 않은 알림 개수 조회 (GET /notifications/unread-count)
// =======================================================
router.get("/unread-count", async (req, res) => {
    try {
        await ensureNotificationsTable();

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ result: false, msg: "인증이 필요합니다." });
        }

        let userId = null;
        try {
            const decoded = jwt.verify(token, 'server_secret_key');
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ result: false, msg: "유효하지 않은 토큰입니다." });
        }

        const [result] = await db.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = ? AND is_read = FALSE
        `, [userId]);

        res.json({ result: true, count: result[0].count });
    } catch (err) {
        console.error("읽지 않은 알림 개수 조회 오류:", err);
        res.status(500).json({ result: false, msg: "알림 개수 조회 중 오류 발생" });
    }
});

// =======================================================
// 3. 알림 읽음 처리 (PUT /notifications/:notificationId/read)
// =======================================================
router.put("/:notificationId/read", async (req, res) => {
    try {
        await ensureNotificationsTable();

        const { notificationId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ result: false, msg: "인증이 필요합니다." });
        }

        let userId = null;
        try {
            const decoded = jwt.verify(token, 'server_secret_key');
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ result: false, msg: "유효하지 않은 토큰입니다." });
        }

        const [result] = await db.query(`
            UPDATE notifications
            SET is_read = TRUE
            WHERE notification_id = ? AND user_id = ?
        `, [notificationId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ result: false, msg: "알림을 찾을 수 없습니다." });
        }

        res.json({ result: true, msg: "알림을 읽음 처리했습니다." });
    } catch (err) {
        console.error("알림 읽음 처리 오류:", err);
        res.status(500).json({ result: false, msg: "알림 읽음 처리 중 오류 발생" });
    }
});

// =======================================================
// 4. 알림 삭제 (DELETE /notifications/:notificationId)
// =======================================================
router.delete("/:notificationId", async (req, res) => {
    try {
        await ensureNotificationsTable();

        const { notificationId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ result: false, msg: "인증이 필요합니다." });
        }

        let userId = null;
        try {
            const decoded = jwt.verify(token, 'server_secret_key');
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ result: false, msg: "유효하지 않은 토큰입니다." });
        }

        const [result] = await db.query(`
            DELETE FROM notifications
            WHERE notification_id = ? AND user_id = ?
        `, [notificationId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ result: false, msg: "알림을 찾을 수 없습니다." });
        }

        res.json({ result: true, msg: "알림을 삭제했습니다." });
    } catch (err) {
        console.error("알림 삭제 오류:", err);
        res.status(500).json({ result: false, msg: "알림 삭제 중 오류 발생" });
    }
});

module.exports = router;

