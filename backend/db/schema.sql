CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(120) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,

  -- Mandatory Registration Info
  restaurant_name VARCHAR(150) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  password TEXT NOT NULL,

  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,

  fssai_license VARCHAR(50) NOT NULL,

  -- Optional Profile Fields (Editable Later)
  cuisine_type TEXT,
  gst_number VARCHAR(50),

  opening_time VARCHAR(20),
  closing_time VARCHAR(20),

  bank_account VARCHAR(30),
  ifsc_code VARCHAR(20),

  restaurant_image TEXT,

  -- Admin Approval
  is_approved BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE restaurants
ADD COLUMN rejected_reason TEXT;

ALTER TABLE restaurants
ADD COLUMN approved_at TIMESTAMP;




