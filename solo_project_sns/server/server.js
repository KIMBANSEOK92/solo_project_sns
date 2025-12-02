const express = require('express');
const cors = require('cors');
const path = require('path');

const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const donationRouter = require("./routes/donations"); // ← 파일 이름 정확히 일치
const childAbuseReportsRouter = require("./routes/childAbuseReports"); // 아동 학대 신고 라우터

const app = express();

app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// router 영역
app.use("/users", userRouter);
app.use("/feed", feedRouter);
app.use("/donation", donationRouter); // ← 클라이언트 URL과 맞춤
app.use("/", childAbuseReportsRouter); // 아동 학대 신고 라우터 (/, /reports, /regions 경로 사용)

app.listen(3010, () => {
    console.log("server start!");
});
