<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireAdmin();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['name'] ?? '');
    $price = $_POST['price'] ?? '';
    $status = $_POST['status'] ?? 'active';
    
    if (empty($name) || empty($price)) {
        $error = 'Nama lapangan dan harga harus diisi.';
    } elseif (!is_numeric($price) || $price <= 0) {
        $error = 'Harga harus berupa angka positif.';
    } else {
        try {
            $stmt = $pdo->prepare("INSERT INTO fields (name, price, status) VALUES (?, ?, ?)");
            $stmt->execute([$name, $price, $status]);
            setFlashMessage('success', 'Lapangan berhasil ditambahkan.');
            redirect(APP_URL . '/admin/fields/index.php');
        } catch (PDOException $e) {
            $error = 'Terjadi kesalahan. Silakan coba lagi.';
        }
    }
}

$pageTitle = "Tambah Lapangan";
include __DIR__ . '/../../includes/admin/header.php';
?>

<div class="card">
    <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-plus-circle"></i> Tambah Lapangan Baru</h5>
    </div>
    <div class="card-body">
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="mb-3">
                <label for="name" class="form-label">Nama Lapangan <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="name" name="name" required autofocus>
            </div>
            
            <div class="mb-3">
                <label for="price" class="form-label">Harga Slot Terendah (Rp) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" id="price" name="price" min="0" step="1000" required>
            </div>
            
            <div class="mb-3">
                <label for="status" class="form-label">Status <span class="text-danger">*</span></label>
                <select class="form-select" id="status" name="status" required>
                    <option value="active" selected>Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                </select>
            </div>
            
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Simpan
                </button>
                <a href="<?php echo APP_URL; ?>/admin/fields/index.php" class="btn btn-secondary">
                    <i class="bi bi-arrow-left"></i> Kembali
                </a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../../includes/admin/footer.php'; ?>
