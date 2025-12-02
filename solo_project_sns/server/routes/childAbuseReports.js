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
    // 트랜잭션을 위한 connection 변수
    let connection = null;

    try {
        // 요청 데이터 추출
        const { region_name, title, description, status } = req.body;
        
        // 필수 필드 검증
        if (!region_name || !region_name.trim() || !title || !title.trim() || !description || !description.trim()) {
            return res.status(400).json({ 
                result: false, 
                msg: "필수 항목(지역, 제목, 상세 내용)을 모두 입력해주세요." 
            });
        }

        // 데이터베이스 연결 가져오기 (트랜잭션을 위해)
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1단계: 입력한 지역명이 regions 테이블에 있는지 확인
        const [existingRegion] = await connection.query(
            "SELECT region_id FROM regions WHERE region_name = ?",
            [region_name.trim()]
        );

        let region_id;

        if (existingRegion.length > 0) {
            // 기존 지역이 있는 경우: 기존 region_id 사용
            region_id = existingRegion[0].region_id;
        } else {
            // 기존 지역이 없는 경우: regions 테이블에 새로 추가
            // 기존 최대 region_id를 찾아서 +1을 하거나, 자동 증가 처리
            const [maxRegion] = await connection.query(
                "SELECT COALESCE(MAX(region_id), 0) + 1 AS next_id FROM regions"
            );
            region_id = maxRegion[0].next_id;

            // regions 테이블에 새 지역 추가
            await connection.query(
                "INSERT INTO regions (region_id, region_name) VALUES (?, ?)",
                [region_id, region_name.trim()]
            );
        }

        // 2단계: report_id 자동 생성 (타임스탬프 기반으로 고유 ID 생성)
        const report_id = Date.now().toString();

        // 3단계: 이미지 URL 설정 (이미지가 업로드된 경우)
        let imageUrl = null;
        if (req.file) {
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        // 4단계: 아동학대 신고 등록 (report_id 포함하여 DB에 저장)
        await connection.query(
            `INSERT INTO child_abuse_reports (report_id, region_id, title, description, image_url, status, reported_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [report_id, region_id, title.trim(), description.trim(), imageUrl, status || '확인 중']
        );

        // 트랜잭션 커밋
        await connection.commit();
        connection.release();

        res.json({ result: true, msg: "아동 학대 신고 등록 완료", report_id });
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

        console.error("아동 학대 신고 등록 에러:", err);

        // 중복 키 에러 처리 (regions 테이블에 이미 같은 지역명이 있는 경우 - 동시성 이슈)
        if (err.code === 'ER_DUP_ENTRY' || err.code === '1062') {
            // 재시도 로직을 넣거나, 기존 region_id를 다시 조회하여 사용
            try {
                const [retryRegion] = await db.query(
                    "SELECT region_id FROM regions WHERE region_name = ?",
                    [req.body.region_name?.trim()]
                );
                if (retryRegion.length > 0) {
                    // 이미 추가된 지역이므로 다시 시도하도록 클라이언트에 알림
                    return res.status(409).json({ 
                        result: false, 
                        msg: "잠시 후 다시 시도해주세요." 
                    });
                }
            } catch (retryErr) {
                console.error("재시도 중 에러:", retryErr);
            }
        }

        res.status(500).json({ result: false, msg: "아동 학대 신고 등록 실패: " + err.message });
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
            // 부분 일치 검색: "인천" 검색 시 "인천", "인천광역시" 등 모두 포함
            // 예: "인천" → "인천"이 포함된 모든 지역 (인천, 인천광역시 등)
            sql += " WHERE r.region_name LIKE ?";
            params.push(`%${region_name}%`);
        }
        
        sql += " ORDER BY c.reported_at DESC";
        
        const [list] = await db.query(sql, params);

        res.json({
            list,
            result: true
        });
    } catch (error) {
        console.error("아동학대 신고 목록 조회 에러:", error);
        res.status(500).json({ 
            result: false, 
            msg: "아동학대 신고 목록 조회 중 오류 발생: " + error.message 
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

module.exports = router;