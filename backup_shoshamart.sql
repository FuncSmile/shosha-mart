PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_id` text NOT NULL,
	`tier_id` text NOT NULL,
	`total_amount` integer NOT NULL,
	`status` text NOT NULL,
	`rejection_reason` text, `created_at` integer NOT NULL,
	FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO orders VALUES('8a2ba1a5-2bd8-4037-bae8-b1847005261e','6220f127-7360-45e4-b8f2-1a3ac4757241','761ec835-5924-4139-891d-fd0b42fa19a1',160000,'PROCESSED',NULL,1772731148714);
CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`base_price` integer NOT NULL
, `image_url` text, `stock` integer DEFAULT 0 NOT NULL);
INSERT INTO products VALUES('7bcc871a-babf-48c6-8f6a-52bbd4c79cc4','Softener Dinda 5 Liter','SOFT-2423',55000,'https://zptoohulgnab9von.public.blob.vercel-storage.com/Gemini_Generated_Image_l71vzal71vzal71v.png',99);
INSERT INTO products VALUES('ceea1617-d998-4014-9136-7ea15e31da3b','Karbol Dinda','KBL-001',16000,'https://zptoohulgnab9von.public.blob.vercel-storage.com/Gemini_Generated_Image_32gc2832gc2832gc.png',99, 'Drigen');
INSERT INTO products VALUES('2db01f58-ac92-473e-aaa9-09614aac120e','Gunting','GTG-001',14000,'https://i.pinimg.com/736x/f4/bc/b5/f4bcb577402d2b0f2df042a4f38a365e.jpg',100, 'PCS');
INSERT INTO products VALUES('59130929-5904-4a4d-bee1-3fbdb7d9bec0','Pulpen','PLPN-001',6000,'https://i.pinimg.com/1200x/ae/e6/fa/aee6facea65a49f9e70ef088d516b0ab.jpg',100, 'PCS');
INSERT INTO products VALUES('03a9d97a-58c4-4112-ab97-f451c6206f43','Thermal Besar','THML-001',8000,'https://i.pinimg.com/1200x/53/64/e8/5364e81d60bebd2ebc0b810c6e8ef16f.jpg',100, 'PCS');
INSERT INTO products VALUES('38f4f998-ae3f-470a-820c-5532a0c1ead9','Thermal Kecil','THML-002',40000,'https://i.pinimg.com/736x/0e/16/c5/0e16c54553f121fc9ab0d70ae0789b4d.jpg',100, 'PCS');
CREATE TABLE IF NOT EXISTS `tier_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`tier_id` text NOT NULL,
	"price" integer, `is_active` integer DEFAULT true NOT NULL, `dummy` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO tier_prices VALUES('e20c9e59-0b6e-4941-8c7c-958a105b195f','87ce961d-e1a2-43fa-b218-723b374b2492','761ec835-5924-4139-891d-fd0b42fa19a1',60000,1,NULL);
INSERT INTO tier_prices VALUES('3cfc3ef0-80ae-473a-8bb3-9ca1925e5441','87ce961d-e1a2-43fa-b218-723b374b2492','bc57b15e-f455-4cb9-b784-867697154af5',55000,1,NULL);
INSERT INTO tier_prices VALUES('5af6fdcd-0b85-4791-958d-28eb9fbfa813','7bcc871a-babf-48c6-8f6a-52bbd4c79cc4','761ec835-5924-4139-891d-fd0b42fa19a1',60000,1,NULL);
INSERT INTO tier_prices VALUES('b86107aa-926b-4228-8524-e924764d0cd6','7bcc871a-babf-48c6-8f6a-52bbd4c79cc4','bc57b15e-f455-4cb9-b784-867697154af5',55000,1,NULL);
INSERT INTO tier_prices VALUES('6140f709-15a4-49e9-a5eb-bff0c7cd4e3c','ceea1617-d998-4014-9136-7ea15e31da3b','761ec835-5924-4139-891d-fd0b42fa19a1',100000,1,NULL);
INSERT INTO tier_prices VALUES('a85e3890-b78b-453a-a6d9-80480b15b46f','ceea1617-d998-4014-9136-7ea15e31da3b','bc57b15e-f455-4cb9-b784-867697154af5',95000,1,NULL);
INSERT INTO tier_prices VALUES('0482c7e7-3b6b-4ec7-9344-b945b79a7b28','2db01f58-ac92-473e-aaa9-09614aac120e','761ec835-5924-4139-891d-fd0b42fa19a1',15000,1,NULL);
INSERT INTO tier_prices VALUES('e04f241a-1c36-4c24-9f84-7c7179d09c43','2db01f58-ac92-473e-aaa9-09614aac120e','bc57b15e-f455-4cb9-b784-867697154af5',15000,1,NULL);
INSERT INTO tier_prices VALUES('4b1f55e8-7046-4e8c-accf-4caae5c4dd39','59130929-5904-4a4d-bee1-3fbdb7d9bec0','761ec835-5924-4139-891d-fd0b42fa19a1',6000,1,NULL);
INSERT INTO tier_prices VALUES('70586e8d-88e0-4ae2-a8bc-a3877395fed8','59130929-5904-4a4d-bee1-3fbdb7d9bec0','bc57b15e-f455-4cb9-b784-867697154af5',6000,1,NULL);
INSERT INTO tier_prices VALUES('ae559b2e-7368-4e10-9bf9-497df8d2ce02','03a9d97a-58c4-4112-ab97-f451c6206f43','761ec835-5924-4139-891d-fd0b42fa19a1',8000,0,NULL);
INSERT INTO tier_prices VALUES('063c6272-3394-468c-8c3c-8fc40873feef','03a9d97a-58c4-4112-ab97-f451c6206f43','bc57b15e-f455-4cb9-b784-867697154af5',8000,1,NULL);
INSERT INTO tier_prices VALUES('effabe00-9af7-4cb2-8e64-5f755689f0cf','38f4f998-ae3f-470a-820c-5532a0c1ead9','761ec835-5924-4139-891d-fd0b42fa19a1',40000,1,NULL);
INSERT INTO tier_prices VALUES('f98e783f-0ee0-4646-8383-2add67c06642','38f4f998-ae3f-470a-820c-5532a0c1ead9','bc57b15e-f455-4cb9-b784-867697154af5',NULL,0,NULL);
CREATE TABLE IF NOT EXISTS `tiers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
INSERT INTO tiers VALUES('761ec835-5924-4139-891d-fd0b42fa19a1','L24J');
INSERT INTO tiers VALUES('bc57b15e-f455-4cb9-b784-867697154af5','SHOSHA');
CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`phone` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`tier_id` text,
	`branch_name` text,
	FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO users VALUES('0c22e934-f7ec-445e-88a1-9785e4742d5b','superadmin','08111111111','$2b$10$j0n/9DIl4wp.iv05.7g5heeNpc9DGtzqjPLL66/T3ffWCw.6lQ.8S','SUPERADMIN',NULL,NULL);
INSERT INTO users VALUES('ff2adde3-ad76-48a5-9401-af3c17d53dd3','admin_l24j','08222222222','$2b$10$j0n/9DIl4wp.iv05.7g5heeNpc9DGtzqjPLL66/T3ffWCw.6lQ.8S','ADMIN_TIER','761ec835-5924-4139-891d-fd0b42fa19a1',NULL);
INSERT INTO users VALUES('58f634c5-4d1b-4af6-9fa2-7add19e496bd','admin_shosha','08333333333','$2b$10$j0n/9DIl4wp.iv05.7g5heeNpc9DGtzqjPLL66/T3ffWCw.6lQ.8S','ADMIN_TIER','bc57b15e-f455-4cb9-b784-867697154af5',NULL);
INSERT INTO users VALUES('6220f127-7360-45e4-b8f2-1a3ac4757241','buyer_l24j','08444444444','$2b$10$j0n/9DIl4wp.iv05.7g5heeNpc9DGtzqjPLL66/T3ffWCw.6lQ.8S','BUYER','761ec835-5924-4139-891d-fd0b42fa19a1','L24J Branch 1');
INSERT INTO users VALUES('67571e3f-f1a8-46a0-8419-4515b29bbf70','buyer_shosha','08555555555','$2b$10$j0n/9DIl4wp.iv05.7g5heeNpc9DGtzqjPLL66/T3ffWCw.6lQ.8S','BUYER','bc57b15e-f455-4cb9-b784-867697154af5','SHOSHA Branch 1');
CREATE TABLE IF NOT EXISTS `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_at_purchase` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO order_items VALUES('9fcbb042-65c9-4309-958d-073669cdc640','8a2ba1a5-2bd8-4037-bae8-b1847005261e','7bcc871a-babf-48c6-8f6a-52bbd4c79cc4',1,60000);
INSERT INTO order_items VALUES('35013d4f-0efe-4987-861c-96b87e2bbac2','8a2ba1a5-2bd8-4037-bae8-b1847005261e','ceea1617-d998-4014-9136-7ea15e31da3b',1,100000);
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);
CREATE UNIQUE INDEX `tiers_name_unique` ON `tiers` (`name`);
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);
COMMIT;
