CREATE TABLE `marketplace_scripts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `category` VARCHAR(100) NOT NULL, -- e.g., React, PHP, Python, UI Template
  `author_id` INT NOT NULL, -- Assuming references a users table
  `thumbnail_url` VARCHAR(500),
  `preview_url` VARCHAR(500),
  `file_url` VARCHAR(500),
  `sales_count` INT DEFAULT 0,
  `rating` DECIMAL(3, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `marketplace_purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `script_id` INT NOT NULL,
  `buyer_id` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `purchase_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`script_id`) REFERENCES `marketplace_scripts`(`id`) ON DELETE CASCADE
);

CREATE TABLE `marketplace_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `script_id` INT NOT NULL,
  `reviewer_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`script_id`) REFERENCES `marketplace_scripts`(`id`) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_marketplace_category ON marketplace_scripts(category);
CREATE INDEX idx_marketplace_author ON marketplace_scripts(author_id);
