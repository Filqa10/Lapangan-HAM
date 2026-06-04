-- Migration: Add address column to fields table
ALTER TABLE fields ADD COLUMN address VARCHAR(255) AFTER price;

-- Update existing fields with sample addresses
UPDATE fields SET address = 'Jl. Stadion Utama No. 1, Jakarta Central' WHERE name LIKE '%Stadion%';
UPDATE fields SET address = 'Jl. Olahraga Sehat No. 12, Jakarta South' WHERE name LIKE '%Futsal%';
UPDATE fields SET address = 'Jl. Kemenangan No. 45, Jakarta East' WHERE name LIKE '%Voli%';
UPDATE fields SET address = 'Jl. Bulutangkis Raya No. 8, Jakarta North' WHERE name LIKE '%Badminton%';
UPDATE fields SET address = 'Jl. Sport Center No. 100, Jakarta West' WHERE address IS NULL;
