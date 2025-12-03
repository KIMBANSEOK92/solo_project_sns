-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: mysqldb
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `child_abuse_reports`
--

DROP TABLE IF EXISTS `child_abuse_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `child_abuse_reports` (
  `report_id` varchar(50) NOT NULL,
  `region_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `reported_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `region_id` (`region_id`),
  CONSTRAINT `child_abuse_reports_ibfk_1` FOREIGN KEY (`region_id`) REFERENCES `regions` (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `child_abuse_reports`
--

LOCK TABLES `child_abuse_reports` WRITE;
/*!40000 ALTER TABLE `child_abuse_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `child_abuse_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donation_hall`
--

DROP TABLE IF EXISTS `donation_hall`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation_hall` (
  `user_id` varchar(50) NOT NULL,
  `total_amount` varchar(50) DEFAULT NULL,
  `last_donation` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `donation_hall_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donation_hall`
--

LOCK TABLES `donation_hall` WRITE;
/*!40000 ALTER TABLE `donation_hall` DISABLE KEYS */;
INSERT INTO `donation_hall` VALUES ('sibar','2100000','2025-12-02 12:06:09'),('test33','600000','2025-12-02 09:29:57');
/*!40000 ALTER TABLE `donation_hall` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donations`
--

DROP TABLE IF EXISTS `donations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donations` (
  `donation_id` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `amount` varchar(50) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`donation_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `donations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donations`
--

LOCK TABLES `donations` WRITE;
/*!40000 ALTER TABLE `donations` DISABLE KEYS */;
INSERT INTO `donations` VALUES ('1764568273784','sibar','300000','test','2025-12-01 14:51:13'),('1764635397069','test33','600000','제발 ','2025-12-02 09:29:57'),('1764642042097','sibar','1800000','test','2025-12-02 11:20:42');
/*!40000 ALTER TABLE `donations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feed`
--

DROP TABLE IF EXISTS `feed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feed` (
  `post_id` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `content` text,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `feed_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feed`
--

LOCK TABLES `feed` WRITE;
/*!40000 ALTER TABLE `feed` DISABLE KEYS */;
INSERT INTO `feed` VALUES ('07b41b90-cb4f-11f0-afad-18c04d24711b','sss','드디어됨','http://localhost:3010/uploads/1764220074046-01.41187242.1.png','2025-11-27 14:07:54','2025-11-27 14:07:54'),('195d1003-cc03-11f0-afad-18c04d24711b','test1234','tetst','http://localhost:3010/uploads/1764297413089-15f22ba4e9df3dc7ba94795cb5d8865a.jpg','2025-11-28 11:36:53','2025-11-28 11:36:53'),('23ef2848-cb5c-11f0-afad-18c04d24711b','test77','test7777','http://localhost:3010/uploads/1764225704876-01.41187242.1.png','2025-11-27 15:41:44','2025-11-27 15:41:44'),('24bb3acb-cbfb-11f0-afad-18c04d24711b','qwe','지금 현재 상황','http://localhost:3010/uploads/1764293996192-naDszQ8YuFeGx2RQ8vE_1MFDKNgmE9hk9GAI_oO446Pf-wqZE_HYYagqNQgyX_HZjtOV7ThFAzV3EgqsH9RB1A.webp','2025-11-28 10:39:56','2025-11-28 10:39:56'),('2c59eeba-cb37-11f0-afad-18c04d24711b','test11','시ㅅ 링리덜더ㄷ랜래ㄹㄷ던더ㄷ랜래ㄹ','http://localhost:3010/uploads/1764209827610-ëì í¸.jfif','2025-11-27 11:17:07','2025-11-27 11:17:07'),('34e32509-caa2-11f0-a1f7-18c04d24711b','test1234','ㄴㅇㄹㄴㅁㅁㄴㄹㅇㄴㄹㅁ','http://localhost:3010/uploads/1764145846923-1000_F_228858108_bK3t2Dpw09mShxcPaaalRQrNnA2SHeEj.jpg','2025-11-26 17:30:46','2025-11-26 17:30:46'),('49827bb4-cb47-11f0-afad-18c04d24711b','test1234','TEST','http://localhost:3010/uploads/1764216748479-ë§íëë¶.jpg','2025-11-27 13:12:28','2025-11-27 13:12:28'),('52437f2d-cbf2-11f0-afad-18c04d24711b','qwe','test333','http://localhost:3010/uploads/1764290207112-b0b9b87513567905.jpg','2025-11-28 09:36:47','2025-11-28 09:36:47'),('74676489-cb43-11f0-afad-18c04d24711b','test1234','안녕하세요','http://localhost:3010/uploads/1764215102446-11.PNG','2025-11-27 12:45:02','2025-11-27 12:45:02'),('83d1a119-ce77-11f0-afad-18c04d24711b','sibar','test333','http://localhost:3010/uploads/1764567315642-2257f0ce6cb6fec.jpg','2025-12-01 14:35:15','2025-12-01 14:35:15'),('a886cf09-cc21-11f0-afad-18c04d24711b','test88','test555','http://localhost:3010/uploads/1764310538184-01.41187242.1.png','2025-11-28 15:15:38','2025-11-28 15:15:38'),('ab4029f2-cbfb-11f0-afad-18c04d24711b','qwe','ㅅㄷㅅㄷㅅㄴ','http://localhost:3010/uploads/1764294221879-01.41187242.1.png','2025-11-28 10:43:41','2025-11-28 10:43:41'),('b4710d25-cf33-11f0-afad-18c04d24711b','sibar','testst','http://localhost:3010/uploads/1764648142605-01.41187242.1.png','2025-12-02 13:02:22','2025-12-02 13:02:22'),('c036fb6b-caa5-11f0-a1f7-18c04d24711b','test1234','ewtwtwtwtet','http://localhost:3010/uploads/1764147369170-gim.jpg','2025-11-26 17:56:09','2025-11-26 17:56:09'),('c8be09a2-cc32-11f0-afad-18c04d24711b','test1234','test123','http://localhost:3010/uploads/1764317893676-01.41187242.1.png','2025-11-28 17:18:13','2025-11-28 17:18:13'),('e4868cf6-cf35-11f0-afad-18c04d24711b','sibar','test','http://localhost:3010/uploads/1764649082270-01.41187242.1.png','2025-12-02 13:18:02','2025-12-02 13:18:02'),('ecc51b7c-ca8a-11f0-a1f7-18c04d24711b','test22','TSET','http://localhost:3010/uploads/1764135847486-01.41187242.1.png','2025-11-26 14:44:07','2025-11-26 14:44:07'),('f677ed2b-cb3e-11f0-afad-18c04d24711b','test1234','fdsfdssfds','http://localhost:3010/uploads/1764213173189-ëì í¸1.jpg','2025-11-27 12:12:53','2025-11-27 12:12:53');
/*!40000 ALTER TABLE `feed` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feed_comments`
--

DROP TABLE IF EXISTS `feed_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feed_comments` (
  `comment_id` varchar(50) NOT NULL,
  `post_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `feed_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed` (`post_id`),
  CONSTRAINT `feed_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feed_comments`
--

LOCK TABLES `feed_comments` WRITE;
/*!40000 ALTER TABLE `feed_comments` DISABLE KEYS */;
INSERT INTO `feed_comments` VALUES ('00cab212-cb3f-11f0-afad-18c04d24711b','2c59eeba-cb37-11f0-afad-18c04d24711b','test1234','맛있어보이네','2025-11-27 12:13:10'),('13e5595f-cb37-11f0-afad-18c04d24711b','34e32509-caa2-11f0-a1f7-18c04d24711b','test11','test','2025-11-27 11:16:26'),('192ad056-cb37-11f0-afad-18c04d24711b','34e32509-caa2-11f0-a1f7-18c04d24711b','test11','test중','2025-11-27 11:16:35'),('49e3d39b-cb45-11f0-afad-18c04d24711b','2c59eeba-cb37-11f0-afad-18c04d24711b','test1234','?','2025-11-27 12:58:10'),('4cefd244-cc09-11f0-afad-18c04d24711b','195d1003-cc03-11f0-afad-18c04d24711b','test22','dddd','2025-11-28 12:21:16'),('5205a332-cb4f-11f0-afad-18c04d24711b','07b41b90-cb4f-11f0-afad-18c04d24711b','sss','멋있어요','2025-11-27 14:09:58'),('5f835fe2-cb5f-11f0-afad-18c04d24711b','23ef2848-cb5c-11f0-afad-18c04d24711b','test77','SSS','2025-11-27 16:04:53'),('82c9089d-cc33-11f0-afad-18c04d24711b','24bb3acb-cbfb-11f0-afad-18c04d24711b','test1234','sdaklfjkls','2025-11-28 17:23:25'),('9add36a3-cb4e-11f0-afad-18c04d24711b','49827bb4-cb47-11f0-afad-18c04d24711b','sss','맛있어보이네','2025-11-27 14:04:51'),('b35de3c9-cb55-11f0-afad-18c04d24711b','07b41b90-cb4f-11f0-afad-18c04d24711b','test99','kkkk','2025-11-27 14:55:39'),('c8439cf6-cc24-11f0-afad-18c04d24711b','a886cf09-cc21-11f0-afad-18c04d24711b','test99','ㅁ나ㅣ러ㅏㅣ너','2025-11-28 15:37:59'),('cf40a495-cbf1-11f0-afad-18c04d24711b','49827bb4-cb47-11f0-afad-18c04d24711b','qwe','sdasadf','2025-11-28 09:33:07'),('d03e21fc-cc32-11f0-afad-18c04d24711b','a886cf09-cc21-11f0-afad-18c04d24711b','test1234','sadfsadf','2025-11-28 17:18:26'),('d669afd2-cc21-11f0-afad-18c04d24711b','a886cf09-cc21-11f0-afad-18c04d24711b','test88','sdfasdf','2025-11-28 15:16:55'),('e15877ea-cb4e-11f0-afad-18c04d24711b','49827bb4-cb47-11f0-afad-18c04d24711b','sss','ㅋㅋㅋ','2025-11-27 14:06:49'),('f66eaa0e-cb36-11f0-afad-18c04d24711b','c036fb6b-caa5-11f0-a1f7-18c04d24711b','test11','안녕하세요','2025-11-27 11:15:37');
/*!40000 ALTER TABLE `feed_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feed_likes`
--

DROP TABLE IF EXISTS `feed_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feed_likes` (
  `like_id` varchar(50) NOT NULL,
  `post_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`like_id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `feed_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed` (`post_id`),
  CONSTRAINT `feed_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feed_likes`
--

LOCK TABLES `feed_likes` WRITE;
/*!40000 ALTER TABLE `feed_likes` DISABLE KEYS */;
INSERT INTO `feed_likes` VALUES ('1381699b-cc1e-11f0-afad-18c04d24711b','52437f2d-cbf2-11f0-afad-18c04d24711b','test22','2025-11-28 14:49:59'),('13d5e0ae-cf16-11f0-afad-18c04d24711b','83d1a119-ce77-11f0-afad-18c04d24711b','test33','2025-12-02 09:30:17'),('3dc36e17-cb47-11f0-afad-18c04d24711b','74676489-cb43-11f0-afad-18c04d24711b','test1234','2025-11-27 13:12:08'),('4fee746c-cc09-11f0-afad-18c04d24711b','ab4029f2-cbfb-11f0-afad-18c04d24711b','test22','2025-11-28 12:21:21'),('531c6ae1-cb47-11f0-afad-18c04d24711b','49827bb4-cb47-11f0-afad-18c04d24711b','test1234','2025-11-27 13:12:44'),('81d4f790-cb56-11f0-afad-18c04d24711b','c036fb6b-caa5-11f0-a1f7-18c04d24711b','test99','2025-11-27 15:01:25'),('8318967b-cb56-11f0-afad-18c04d24711b','34e32509-caa2-11f0-a1f7-18c04d24711b','test99','2025-11-27 15:01:27'),('89fcded4-cc3b-11f0-afad-18c04d24711b','52437f2d-cbf2-11f0-afad-18c04d24711b','test1234','2025-11-28 18:20:53'),('8e2438ce-ce67-11f0-afad-18c04d24711b','c8be09a2-cc32-11f0-afad-18c04d24711b','test1234','2025-12-01 12:41:01'),('8f76b7b7-cc33-11f0-afad-18c04d24711b','24bb3acb-cbfb-11f0-afad-18c04d24711b','test1234','2025-11-28 17:23:47'),('9343374a-cc3b-11f0-afad-18c04d24711b','c8be09a2-cc32-11f0-afad-18c04d24711b','qwe','2025-11-28 18:21:09'),('960118df-cc3b-11f0-afad-18c04d24711b','a886cf09-cc21-11f0-afad-18c04d24711b','qwe','2025-11-28 18:21:14'),('97ee6473-cc3b-11f0-afad-18c04d24711b','195d1003-cc03-11f0-afad-18c04d24711b','qwe','2025-11-28 18:21:17'),('981f5ed2-cb4e-11f0-afad-18c04d24711b','49827bb4-cb47-11f0-afad-18c04d24711b','sss','2025-11-27 14:04:46'),('9b0cb68f-cc3b-11f0-afad-18c04d24711b','24bb3acb-cbfb-11f0-afad-18c04d24711b','qwe','2025-11-28 18:21:22'),('a41bdc9c-cc3b-11f0-afad-18c04d24711b','a886cf09-cc21-11f0-afad-18c04d24711b','test1234','2025-11-28 18:21:37'),('a6461916-cc3b-11f0-afad-18c04d24711b','195d1003-cc03-11f0-afad-18c04d24711b','test1234','2025-11-28 18:21:41'),('a881569d-cc3b-11f0-afad-18c04d24711b','ab4029f2-cbfb-11f0-afad-18c04d24711b','test1234','2025-11-28 18:21:45'),('b0c867dd-cb55-11f0-afad-18c04d24711b','07b41b90-cb4f-11f0-afad-18c04d24711b','test99','2025-11-27 14:55:34'),('b8d305b2-cc24-11f0-afad-18c04d24711b','a886cf09-cc21-11f0-afad-18c04d24711b','test99','2025-11-28 15:37:34'),('ba8cd3ee-cc24-11f0-afad-18c04d24711b','195d1003-cc03-11f0-afad-18c04d24711b','test99','2025-11-28 15:37:36'),('bc5a40e0-cc24-11f0-afad-18c04d24711b','24bb3acb-cbfb-11f0-afad-18c04d24711b','test99','2025-11-28 15:37:39'),('c1ba8545-cb46-11f0-afad-18c04d24711b','ecc51b7c-ca8a-11f0-a1f7-18c04d24711b','test1234','2025-11-27 13:08:40'),('c40e0aa6-cb46-11f0-afad-18c04d24711b','34e32509-caa2-11f0-a1f7-18c04d24711b','test1234','2025-11-27 13:08:44'),('c6434f56-cb46-11f0-afad-18c04d24711b','c036fb6b-caa5-11f0-a1f7-18c04d24711b','test1234','2025-11-27 13:08:48'),('c83208ff-cb68-11f0-afad-18c04d24711b','23ef2848-cb5c-11f0-afad-18c04d24711b','ttt','2025-11-27 17:12:14'),('ca1b9466-cbf1-11f0-afad-18c04d24711b','23ef2848-cb5c-11f0-afad-18c04d24711b','qwe','2025-11-28 09:32:58'),('ceb0c657-cf35-11f0-afad-18c04d24711b','83d1a119-ce77-11f0-afad-18c04d24711b','sibar','2025-12-02 13:17:25'),('de95cd21-cb5f-11f0-afad-18c04d24711b','07b41b90-cb4f-11f0-afad-18c04d24711b','test77','2025-11-27 16:08:26'),('f2462212-cb36-11f0-afad-18c04d24711b','c036fb6b-caa5-11f0-a1f7-18c04d24711b','test11','2025-11-27 11:15:30'),('fcf687fb-cb3e-11f0-afad-18c04d24711b','2c59eeba-cb37-11f0-afad-18c04d24711b','test1234','2025-11-27 12:13:04');
/*!40000 ALTER TABLE `feed_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `relation_id` varchar(50) NOT NULL,
  `requester_id` varchar(50) DEFAULT NULL,
  `receiver_id` varchar(50) DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`relation_id`),
  KEY `requester_id` (`requester_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regions`
--

DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regions` (
  `region_id` int NOT NULL,
  `region_name` varchar(100) NOT NULL,
  PRIMARY KEY (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regions`
--

LOCK TABLES `regions` WRITE;
/*!40000 ALTER TABLE `regions` DISABLE KEYS */;
/*!40000 ALTER TABLE `regions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_img` varchar(500) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('qwe','qwe','ttt@nate.com','$2b$10$s6JD0QdHkQlUaWuPpUAhCuIpfDQrgC7ZvPztx8wHxWRtqn88rZBFS','/uploads/1764225822578_01.41187242.1.png','서울','2025-11-27 15:43:41'),('sibar','자바','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6','/uploads/1764298954804_1000_F_228858108_bK3t2Dpw09mShxcPaaalRQrNnA2SHeEj.jpg','인천','2025-11-28 12:02:33'),('ss','ss','ss@gmail.com','$2b$10$W0wNTBDr6grsGULbYoeX5e6Ovu.Omc2EqSkVn2G0GiPE5lqltgXue','/uploads/1764234578678_1000_F_228858108_bK3t2Dpw09mShxcPaaalRQrNnA2SHeEj.jpg','포천','2025-11-27 18:09:37'),('sss','sss','qqq@naver.com','$2b$10$wIXexrmxrXSE.XnwqlLcx.pWt7gzQsegjEHVI6oDFMl13UcJzqFGa','','전남','2025-11-27 13:16:27'),('test11','test11','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6','C:\\solo_project_sns\\solo_project_sns\\server\\uploads\\1763978518350-01.41187242.1.png','서울','2025-11-25 17:58:44'),('test123','test123','scv@naever.com','$2b$10$J9kjlGFhQccb8nnjAwTW4enyQmtqjwljKfaW3u7Hwe5BtS0scOfM2',NULL,'인천','2025-11-25 17:57:38'),('test1234','test1234','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6','C:\\Users\\tj-bu-708\\Desktop\\풀스택\\사진\\01.41187242.1.png','인천','2025-11-26 16:42:46'),('test22','test22','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6',NULL,'인천','2025-11-26 11:56:27'),('test33','test33','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6',NULL,'서울','2025-11-25 18:03:57'),('test55','test55','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6',NULL,'서울','2025-11-26 11:20:33'),('test66','test66','scv9364@naver.com','$2b$10$qFIsgofW3crc.8RbHg3kd.fFp7Xjt0r14udR/m4ubmbdPOtXEopNq','/uploads/1764557266045_01.41187242.1.png','인천','2025-12-01 11:47:45'),('test77','test77','ooo@naver.com','$2b$10$xELKTwEawwMqiBWwz186AuIGOEm9XgIr4W6ca8mC0lW2YUJzJfwP6','/uploads/1764225642054_ê¹ì¹ì°ê°.jpg','광주','2025-11-27 15:40:40'),('test88','test88','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6',NULL,'인천','2025-11-26 11:41:49'),('test99','test99','scv@naver.com','$2b$10$/pJQDFkJuGlHLzlfyUpm/.lUERv0jgsR1ibAe3upTszBxNREljKI6','http://localhost:3010/uploads/1764221737574_01.41187242.1.png','강원도','2025-11-27 14:35:36'),('ttt','ttt','ttt@nate.com','$2b$10$s6JD0QdHkQlUaWuPpUAhCuIpfDQrgC7ZvPztx8wHxWRtqn88rZBFS','/uploads/1764227560032_01.41187242.1.png','천안','2025-11-27 16:12:38');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'mysqldb'
--

--
-- Dumping routines for database 'mysqldb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-02 13:56:05
