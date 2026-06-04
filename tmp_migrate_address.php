<?php
require_once __DIR__ . '/config/database.php';
try {
    // Check if column exists first
    $stmt = $pdo->query("SHOW COLUMNS FROM fields LIKE 'address'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE fields ADD COLUMN address VARCHAR(255) AFTER price");
        
        $pdo->exec("UPDATE fields SET address = 'Jl. Stadion Utama No. 1, Jakarta Central' WHERE name LIKE '%Stadion%'");
        $pdo->exec("UPDATE fields SET address = 'Jl. Olahraga Sehat No. 12, Jakarta South' WHERE name LIKE '%Futsal%'");
        $pdo->exec("UPDATE fields SET address = 'Jl. Kemenangan No. 45, Jakarta East' WHERE name LIKE '%Voli%'");
        $pdo->exec("UPDATE fields SET address = 'Jl. Bulutangkis Raya No. 8, Jakarta North' WHERE name LIKE '%Badminton%'");
        $pdo->exec("UPDATE fields SET address = 'Jl. Sport Center No. 100, Jakarta West' WHERE address IS NULL");
        
        echo "Address migration successful.";
    } else {
        echo "Address column already exists.";
    }
} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage();
}
