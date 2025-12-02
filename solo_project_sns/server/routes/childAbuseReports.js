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

// ============================================================
// 아동 학대 신고 등록 API
// ============================================================
// 사용자가 입력한 지역명(region_name)을 받아서 신고를 등록하고 DB에 저장합니다.
// 입력한 지역명이 regions 테이블에 없으면 자동으로 추가합니다.
// report_id는 자동으로 생성됩니다 (타임스탬프 기반).
// ============================================================
router.post("/reports/add", upload.single('image'), async (req, res) => {
    try {
        // 요청 데이터 추출
        const { region_name, title, description, status } = req.body;

        console.log("신고 등록 요청:", { region_name, title, description, status });

        // 필수 필드 검증
        if (!region_name || !region_name.trim() || !title || !title.trim() || !description || !description.trim()) {
            return res.status(400).json({
                result: false,
                msg: "필수 항목(지역, 제목, 상세 내용)을 모두 입력해주세요."
            });
        }

        // 테이블이 없으면 생성 (먼저 확인)
        try {
            await db.query("SELECT 1 FROM regions LIMIT 1");
            
            // region_id가 AUTO_INCREMENT인지 확인
            const [columnInfo] = await db.query(`
                SELECT COLUMN_NAME, EXTRA 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'regions' 
                AND COLUMN_NAME = 'region_id'
            `);
            
            if (columnInfo && columnInfo.length > 0 && !columnInfo[0].EXTRA.includes('auto_increment')) {
                console.log("region_id가 AUTO_INCREMENT가 아닙니다. 외래 키를 제거하고 수정합니다.");
                
                // 외래 키 제약 조건 제거
                try {
                    await db.query(`
                        ALTER TABLE child_abuse_reports 
                        DROP FOREIGN KEY child_abuse_reports_ibfk_1
                    `);
                    console.log("외래 키 제약 조건 제거 완료");
                } catch (fkErr) {
                    console.log("외래 키 제거 실패 (존재하지 않을 수 있음):", fkErr.message);
                }
                
                // 기존 PRIMARY KEY 제거
                try {
                    await db.query(`ALTER TABLE regions DROP PRIMARY KEY`);
                    console.log("기존 PRIMARY KEY 제거 완료");
                } catch (pkErr) {
                    console.log("PRIMARY KEY 제거 실패:", pkErr.message);
                }
                
                // region_id를 AUTO_INCREMENT PRIMARY KEY로 변경
                await db.query(`
                    ALTER TABLE regions 
                    MODIFY region_id INT AUTO_INCREMENT,
                    ADD PRIMARY KEY (region_id)
                `);
                console.log("regions 테이블의 AUTO_INCREMENT 설정 완료");
            }
        } catch (tableErr) {
            if (tableErr.code === 'ER_NO_SUCH_TABLE') {
                await db.query(`
                    CREATE TABLE IF NOT EXISTS regions (
                        region_id INT AUTO_INCREMENT PRIMARY KEY,
                        region_name VARCHAR(100) UNIQUE
                    )
                `);
                console.log("regions 테이블 생성 완료");
            } else {
                throw tableErr;
            }
        }

        try {
            await db.query("SELECT 1 FROM child_abuse_reports LIMIT 1");
        } catch (tableErr) {
            if (tableErr.code === 'ER_NO_SUCH_TABLE') {
                await db.query(`
                    CREATE TABLE IF NOT EXISTS child_abuse_reports (
                        report_id VARCHAR(255) PRIMARY KEY,
                        region_id INT,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        image_url VARCHAR(500),
                        status VARCHAR(50),
                        user_id VARCHAR(255),
                        reported_at DATETIME
                    )
                `);
            }
        }

        // 1단계: 지역 ID 가져오기 또는 생성
        let region_id = null;

        // 기존 지역 확인
        let [existingRegion] = await db.query(
            "SELECT region_id FROM regions WHERE region_name = ?",
            [region_name.trim()]
        );

        if (existingRegion && existingRegion.length > 0) {
            region_id = existingRegion[0].region_id;
            console.log("기존 지역 발견:", region_id);
        } else {
            // 새 지역 추가 시도
            try {
                await db.query(
                    "INSERT INTO regions (region_name) VALUES (?)",
                    [region_name.trim()]
                );
                console.log("새 지역 추가 성공:", region_name.trim());
            } catch (insertErr) {
                // 중복 키 에러 (동시성 이슈)
                if (insertErr.code === 'ER_DUP_ENTRY' || insertErr.code === '1062') {
                    console.log("중복 키 에러 발생, 다시 조회");
                } else {
                    console.error("지역 추가 에러:", insertErr);
                    throw insertErr;
                }
            }

            // INSERT 후 항상 region_id 조회 (중복 키 에러든 아니든)
            const [newRegion] = await db.query(
                "SELECT region_id FROM regions WHERE region_name = ?",
                [region_name.trim()]
            );
            if (newRegion && newRegion.length > 0) {
                region_id = newRegion[0].region_id;
                console.log("조회된 region_id:", region_id);
            } else {
                console.error("region_id를 찾을 수 없습니다. region_name:", region_name.trim());
            }
        }

        // region_id 검증 (필수)
        if (!region_id || region_id === null || region_id === undefined) {
            console.error("region_id를 가져올 수 없습니다. region_name:", region_name);
            return res.status(500).json({
                result: false,
                msg: "지역 정보를 처리하는 중 오류가 발생했습니다. region_id를 가져올 수 없습니다."
            });
        }

        console.log("최종 region_id:", region_id, "지역명:", region_name);

        // 2단계: report_id 생성
        const report_id = Date.now().toString();

        // 3단계: 이미지 URL 설정
        let imageUrl = null;
        if (req.file) {
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        // 4단계: user_id 추출
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        let userId = null;

        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, 'server_secret_key');
                userId = decoded.userId;
            } catch (err) {
                console.error("토큰 검증 실패:", err);
            }
        }

        // 5단계: 신고 등록 (user_id 컬럼 유무 확인)
        console.log("신고 등록 시도:", { report_id, region_id, title: title.trim(), userId });

        try {
            // user_id 포함하여 시도
            await db.query(
                `INSERT INTO child_abuse_reports (report_id, region_id, title, description, image_url, status, user_id, reported_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [report_id, region_id, title.trim(), description.trim(), imageUrl, status || '확인 중', userId]
            );
        } catch (insertErr) {
            // user_id 컬럼이 없으면 user_id 없이 INSERT
            if (insertErr.code === 'ER_BAD_FIELD_ERROR' && insertErr.message && insertErr.message.includes('user_id')) {
                console.log("user_id 컬럼이 없어 user_id 없이 등록합니다.");
                await db.query(
                    `INSERT INTO child_abuse_reports (report_id, region_id, title, description, image_url, status, reported_at)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [report_id, region_id, title.trim(), description.trim(), imageUrl, status || '확인 중']
                );
            } else {
                console.error("INSERT 에러:", insertErr);
                throw insertErr;
            }
        }

        res.json({ result: true, msg: "아동 학대 신고 등록 완료", report_id });
    } catch (err) {
        console.error("아동 학대 신고 등록 에러:", err);
        console.error("에러 코드:", err.code);
        console.error("에러 메시지:", err.message);
        console.error("에러 스택:", err.stack);

        // 중복 키 에러 처리
        if (err.code === 'ER_DUP_ENTRY' || err.code === '1062') {
            return res.status(409).json({
                result: false,
                msg: "이미 존재하는 지역입니다. 잠시 후 다시 시도해주세요."
            });
        }

        res.status(500).json({
            result: false,
            msg: "아동 학대 신고 등록 실패: " + (err.message || String(err))
        });
    }
});

// ============================================================
// 전체 아동학대 신고 조회 API
// ============================================================
// 등록된 모든 아동 학대 신고를 조회합니다.
// 지역 정보(region_name)와 함께 조회됩니다.
// 쿼리 파라미터로 region_id 또는 region_name을 전달하면 해당 지역만 필터링됩니다.
// ============================================================
router.get("/reports", async (req, res) => {
    try {
        const { region_id, region_name } = req.query;

        // 먼저 테이블 존재 여부 확인
        try {
            await db.query("SELECT 1 FROM child_abuse_reports LIMIT 1");
        } catch (tableError) {
            console.error("child_abuse_reports 테이블이 존재하지 않거나 접근할 수 없습니다:", tableError.message);
            return res.json({
                list: [],
                result: true,
                msg: "신고 목록이 비어있습니다."
            });
        }

        // 기본 쿼리 (user_id 없이 시작)
        let sql = `
            SELECT 
                r.region_name,
                c.report_id,
                c.region_id,
                c.title,
                c.description,
                c.image_url,
                c.status,
                c.reported_at
            FROM child_abuse_reports c
            LEFT JOIN regions r ON c.region_id = r.region_id
        `;

        const params = [];

        // 지역 필터링 조건 추가
        if (region_id) {
            sql += " WHERE c.region_id = ?";
            params.push(region_id);
        } else if (region_name) {
            sql += " WHERE r.region_name LIKE ?";
            params.push(`%${region_name}%`);
        }

        sql += " ORDER BY c.reported_at DESC";

        let list = [];
        try {
            [list] = await db.query(sql, params);

            // user_id 컬럼이 있는지 확인하고 추가
            try {
                const [testQuery] = await db.query("SELECT user_id FROM child_abuse_reports LIMIT 1");
                // user_id 컬럼이 있으면 다시 조회
                sql = `
                    SELECT 
                        r.region_name,
                        c.report_id,
                        c.region_id,
                        c.title,
                        c.description,
                        c.image_url,
                        c.status,
                        c.user_id,
                        c.reported_at
                    FROM child_abuse_reports c
                    LEFT JOIN regions r ON c.region_id = r.region_id
                `;

                if (region_id) {
                    sql += " WHERE c.region_id = ?";
                } else if (region_name) {
                    sql += " WHERE r.region_name LIKE ?";
                }

                sql += " ORDER BY c.reported_at DESC";

                [list] = await db.query(sql, params);
            } catch (userIdError) {
                // user_id 컬럼이 없으면 null로 추가
                list = (list || []).map(item => ({ ...item, user_id: null }));
            }
        } catch (queryError) {
            console.error("쿼리 실행 오류:", queryError);
            throw queryError;
        }

        res.json({
            list: list || [],
            result: true
        });
    } catch (error) {
        console.error("아동학대 신고 목록 조회 에러:", error);
        console.error("에러 코드:", error.code);
        console.error("에러 메시지:", error.message);
        console.error("에러 상세:", error.stack);

        // 에러가 발생해도 빈 배열 반환 (프론트엔드가 작동하도록)
        res.json({
            list: [],
            result: false,
            msg: "신고 목록을 불러오는 중 오류가 발생했습니다: " + (error.message || String(error))
        });
    }
});

// ============================================================
// 지역 목록 조회 API
// ============================================================
// 등록된 모든 지역 목록을 조회합니다.
// (현재는 사용자가 직접 지역명을 입력하지만, 향후 활용을 위해 유지)
// ============================================================
router.get("/regions", async (req, res) => {
    try {
        const sql = "SELECT * FROM regions ORDER BY region_name";
        const [regions] = await db.query(sql);
        res.json({ list: regions, result: true });
    } catch (error) {
        console.error("지역 목록 조회 에러:", error);
        res.status(500).json({
            result: false,
            msg: "지역 목록 조회 실패: " + error.message
        });
    }
});

// ============================================================
// 아동 학대 신고 수정 API
// ============================================================
router.put("/reports/:reportId", upload.single('image'), async (req, res) => {
    const { reportId } = req.params;
    const { region_name, title, description, status } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ result: false, msg: "로그인이 필요합니다." });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, 'server_secret_key');
        const userId = decoded.userId;

        // 작성자 확인
        const [reportRows] = await db.query(
            "SELECT user_id, region_id, image_url FROM child_abuse_reports WHERE report_id = ?",
            [reportId]
        );

        if (reportRows.length === 0) {
            return res.status(404).json({ result: false, msg: "신고를 찾을 수 없습니다." });
        }

        if (reportRows[0].user_id !== userId) {
            return res.status(403).json({ result: false, msg: "본인이 작성한 신고만 수정할 수 있습니다." });
        }

        let region_id = reportRows[0].region_id;
        let imageUrl = reportRows[0].image_url;

        // 지역명이 변경된 경우 처리
        if (region_name && region_name.trim()) {
            const [existingRegion] = await db.query(
                "SELECT region_id FROM regions WHERE region_name = ?",
                [region_name.trim()]
            );

            if (existingRegion.length > 0) {
                region_id = existingRegion[0].region_id;
            } else {
                const [maxRegion] = await db.query(
                    "SELECT COALESCE(MAX(region_id), 0) + 1 AS next_id FROM regions"
                );
                region_id = maxRegion[0].next_id;
                await db.query(
                    "INSERT INTO regions (region_id, region_name) VALUES (?, ?)",
                    [region_id, region_name.trim()]
                );
            }
        }

        // 이미지가 새로 업로드된 경우
        if (req.file) {
            // 기존 이미지 파일 삭제
            if (imageUrl) {
                const oldFileName = path.basename(imageUrl);
                const oldFilePath = path.join(uploadDir, oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        // 신고 수정
        await db.query(
            `UPDATE child_abuse_reports 
             SET region_id = ?, title = ?, description = ?, image_url = ?, status = ?
             WHERE report_id = ? AND user_id = ?`,
            [
                region_id,
                title?.trim() || reportRows[0].title,
                description?.trim() || reportRows[0].description,
                imageUrl,
                status || reportRows[0].status,
                reportId,
                userId
            ]
        );

        res.json({ result: true, msg: "신고가 수정되었습니다." });
    } catch (err) {
        console.error("신고 수정 에러:", err);
        res.status(500).json({ result: false, msg: "신고 수정 실패: " + err.message });
    }
});

// ============================================================
// 아동 학대 신고 삭제 API
// ============================================================
router.delete("/reports/:reportId", async (req, res) => {
    const { reportId } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ result: false, msg: "로그인이 필요합니다." });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, 'server_secret_key');
        const userId = decoded.userId;

        // 작성자 확인
        const [reportRows] = await db.query(
            "SELECT user_id, image_url FROM child_abuse_reports WHERE report_id = ?",
            [reportId]
        );

        if (reportRows.length === 0) {
            return res.status(404).json({ result: false, msg: "신고를 찾을 수 없습니다." });
        }

        if (reportRows[0].user_id !== userId) {
            return res.status(403).json({ result: false, msg: "본인이 작성한 신고만 삭제할 수 있습니다." });
        }

        // 이미지 파일 삭제
        if (reportRows[0].image_url) {
            const filePath = path.join(uploadDir, path.basename(reportRows[0].image_url));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 신고 삭제
        await db.query("DELETE FROM child_abuse_reports WHERE report_id = ? AND user_id = ?", [reportId, userId]);

        res.json({ result: true, msg: "신고가 삭제되었습니다." });
    } catch (err) {
        console.error("신고 삭제 에러:", err);
        res.status(500).json({ result: false, msg: "신고 삭제 실패: " + err.message });
    }
});

module.exports = router;
module.exports = router;