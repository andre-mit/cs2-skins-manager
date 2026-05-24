CREATE TABLE `wp_player_agents` (
    `steamid` varchar(18) COLLATE utf8mb4_general_ci NOT NULL,
    `agent_ct` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `agent_t` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
    UNIQUE KEY `steamid` (`steamid`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `wp_player_gloves` (
    `steamid` varchar(18) COLLATE utf8mb4_general_ci NOT NULL,
    `weapon_team` int NOT NULL,
    `weapon_defindex` int NOT NULL,
    UNIQUE KEY `steamid` (`steamid`, `weapon_team`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `wp_player_knife` (
    `steamid` varchar(18) COLLATE utf8mb4_general_ci NOT NULL,
    `weapon_team` int NOT NULL,
    `knife` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
    UNIQUE KEY `steamid` (`steamid`, `weapon_team`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `wp_player_music` (
    `steamid` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
    `weapon_team` int NOT NULL,
    `music_id` int NOT NULL,
    UNIQUE KEY `steamid` (`steamid`, `weapon_team`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `wp_player_pins` (
    `steamid` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
    `weapon_team` int NOT NULL,
    `id` int NOT NULL,
    UNIQUE KEY `steamid` (`steamid`, `weapon_team`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `wp_player_skins` (
    `steamid` varchar(18) COLLATE utf8mb4_general_ci NOT NULL,
    `weapon_team` int NOT NULL,
    `weapon_defindex` int NOT NULL,
    `weapon_paint_id` int NOT NULL,
    `weapon_wear` float NOT NULL DEFAULT '0.000001',
    `weapon_seed` int NOT NULL DEFAULT '0',
    `weapon_nametag` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `weapon_stattrak` tinyint(1) NOT NULL DEFAULT '0',
    `weapon_stattrak_count` int NOT NULL DEFAULT '0',
    `weapon_sticker_0` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0;0;0;0;0;0;0' COMMENT 'id;schema;x;y;wear;scale;rotation',
    `weapon_sticker_1` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0;0;0;0;0;0;0' COMMENT 'id;schema;x;y;wear;scale;rotation',
    `weapon_sticker_2` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0;0;0;0;0;0;0' COMMENT 'id;schema;x;y;wear;scale;rotation',
    `weapon_sticker_3` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0;0;0;0;0;0;0' COMMENT 'id;schema;x;y;wear;scale;rotation',
    `weapon_sticker_4` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0;0;0;0;0;0;0' COMMENT 'id;schema;x;y;wear;scale;rotation',
    `weapon_keychain` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0;0;0;0;0' COMMENT 'id;x;y;z;seed',
    UNIQUE KEY `steamid` (
        `steamid`,
        `weapon_team`,
        `weapon_defindex`
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci