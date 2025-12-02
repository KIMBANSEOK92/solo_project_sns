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
// 3. 피드 수정 (작성자만 가능)
// ----------------------------------------
router.put("/:postId", upload.single('file'), async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ result: false, msg: "로그인이 필요합니다." });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, 'server_secret_key');
        const userId = decoded.userId;

        // 게시물 존재 여부 및 작성자 확인
        const [feedRows] = await db.query(
            "SELECT user_id, image_url FROM feed WHERE post_id = ?",
            [postId]
        );

        if (feedRows.length === 0) {
            return res.status(404).json({ result: false, msg: "게시물을 찾을 수 없습니다." });
        }

        if (feedRows[0].user_id !== userId) {
            return res.status(403).json({ result: false, msg: "본인이 작성한 게시물만 수정할 수 있습니다." });
        }

        let imageUrl = feedRows[0].image_url;

        // 새 이미지가 업로드되면 기존 이미지 삭제 후 새 이미지 URL 저장
        if (req.file) {
            // 기존 이미지 파일 삭제
            if (imageUrl) {
                try {
                    const filePath = path.join(uploadDir, path.basename(imageUrl));
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (fileErr) {
                    console.error("기존 이미지 파일 삭제 실패:", fileErr);
                }
            }
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        // 게시물 업데이트
        await db.query(
            `UPDATE feed SET content = ?, image_url = ?, updated_at = NOW() WHERE post_id = ?`,
            [content, imageUrl, postId]
        );

        res.json({ result: true, msg: "게시물이 수정되었습니다." });

    } catch (err) {
        console.error("게시물 수정 중 오류 발생:", err);
        res.status(500).json({ result: false, msg: "게시물 수정 실패" });
    }
});

// ----------------------------------------
// 4. 피드 삭제 (작성자만 가능)
// ----------------------------------------
// 트랜잭션을 사용하여 데이터 일관성을 보장하고,
// 외래키 제약조건(ON DELETE CASCADE)으로 인해 관련 데이터가 자동 삭제됩니다.
// ----------------------------------------
router.delete("/:postId", async (req, res) => {
    const { postId } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 인증 토큰 확인
    if (!token) {
        return res.status(401).json({ result: false, msg: "로그인이 필요합니다." });
    }

    // 트랜잭션을 위한 connection 변수 (에러 처리 시 롤백을 위해 함수 스코프 밖에 선언)
    let connection = null;

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, 'server_secret_key');
        const userId = decoded.userId;

        // 데이터베이스 연결 가져오기 (트랜잭션을 위해 pool에서 connection 가져옴)
        connection = await db.getConnection();

        // 트랜잭션 시작
        await connection.beginTransaction();

        // 1단계: 게시물 존재 여부 및 작성자 확인
        const [feedRows] = await connection.query(
            "SELECT user_id, image_url FROM feed WHERE post_id = ?",
            [postId]
        );

        if (feedRows.length === 0) {
            // 트랜잭션 롤백 (변경사항 없지만 명시적으로 처리)
            await connection.rollback();
            connection.release();
            return res.status(404).json({ result: false, msg: "게시물을 찾을 수 없습니다." });
        }

        // 2단계: 작성자 권한 확인
        if (feedRows[0].user_id !== userId) {
            // 트랜잭션 롤백
            await connection.rollback();
            connection.release();
            return res.status(403).json({ result: false, msg: "본인이 작성한 게시물만 삭제할 수 있습니다." });
        }

        // 3단계: 관련 데이터 삭제 (외래키 CASCADE가 설정되면 자동으로 삭제되지만,
        // 명시적으로 삭제하여 코드의 의도를 명확히 함)
        // ON DELETE CASCADE가 적용되어 있으면 이 부분은 선택적입니다.
        await connection.query("DELETE FROM feed_likes WHERE post_id = ?", [postId]);
        await connection.query("DELETE FROM feed_comments WHERE post_id = ?", [postId]);

        // 4단계: 게시물 삭제
        // 외래키 제약조건(ON DELETE CASCADE)에 의해 관련 댓글과 좋아요가 자동으로 삭제됩니다.
        await connection.query("DELETE FROM feed WHERE post_id = ?", [postId]);

        // 트랜잭션 커밋 (모든 작업이 성공적으로 완료됨)
        await connection.commit();

        // 5단계: 이미지 파일 삭제 (데이터베이스 작업 완료 후 파일 시스템 작업)
        // 트랜잭션 커밋 후에 파일을 삭제하는 이유:
        // - 파일 시스템 작업은 트랜잭션에 포함되지 않음
        // - 데이터베이스 작업이 성공한 후에만 파일을 삭제하여 일관성 유지
        if (feedRows[0].image_url) {
            try {
                const filePath = path.join(uploadDir, path.basename(feedRows[0].image_url));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileErr) {
                // 파일 삭제 실패는 로그만 남기고 응답은 성공으로 처리
                // (데이터베이스 삭제는 이미 완료되었으므로)
                console.error("이미지 파일 삭제 실패:", fileErr);
            }
        }

        // 연결 반환
        connection.release();

        res.json({ result: true, msg: "삭제되었습니다!" });

    } catch (err) {
        // 에러 발생 시 트랜잭션 롤백
        if (connection) {
            try {
                await connection.rollback();
                connection.release();
            } catch (rollbackErr) {
                console.error("트랜잭션 롤백 실패:", rollbackErr);
            }
        }

        console.error("게시물 삭제 중 오류 발생:", err);

        // JWT 토큰 에러 처리
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ result: false, msg: "유효하지 않은 토큰입니다." });
        }

        // 외래키 제약조건 에러 처리 (CASCADE가 제대로 설정되지 않은 경우)
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === '1451') {
            return res.status(500).json({
                result: false,
                msg: "게시물 삭제 실패: 관련 데이터가 있습니다. 외래키 제약조건을 확인해주세요."
            });
        }

        res.status(500).json({ result: false, msg: "삭제 중 오류 발생: " + err.message });
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