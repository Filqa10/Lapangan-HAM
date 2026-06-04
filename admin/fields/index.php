<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireAdmin();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

// Get all fields
try {
    $stmt = $pdo->query("SELECT * FROM fields ORDER BY created_at DESC");
    $fields = $stmt->fetchAll();
} catch (PDOException $e) {
    $fields = [];
}

// Flash message
$flash = getFlashMessage();

$pageTitle = "Kelola Lapangan";
include __DIR__ . '/../../includes/admin/header.php';
?>

<?php if ($flash): ?>
<div class="alert alert-<?php echo $flash['type']; ?> alert-dismissible fade show d-flex align-items-center gap-2 mb-3" role="alert">
    <i class="bi <?php echo $flash['type'] === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'; ?>"></i>
    <div><?php echo htmlspecialchars($flash['message']); ?></div>
    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
</div>
<?php endif; ?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div class="d-flex align-items-center gap-2">
        <button onclick="history.back()" class="btn btn-outline-secondary btn-sm rounded-pill px-3">
            <i class="bi bi-arrow-left me-1"></i> Kembali
        </button>
        <h3 class="mb-0"><i class="bi bi-grid"></i> Kelola Lapangan</h3>
    </div>
    <a href="<?php echo APP_URL; ?>/admin/fields/create.php" class="btn btn-primary">
        <i class="bi bi-plus-circle"></i> Tambah Lapangan
    </a>
</div>

<div class="card">
    <div class="card-header">
        <h5 class="mb-0">Daftar Lapangan</h5>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover" id="fieldsTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama Lapangan</th>
                        <th>Harga/Slot Min</th>
                        <th>Status</th>
                        <th>Tanggal Dibuat</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($fields)): ?>
                        <tr>
                            <td colspan="6" class="text-center text-muted">Tidak ada data lapangan</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($fields as $field): ?>
                            <tr>
                                <td><?php echo $field['id']; ?></td>
                                <td><?php echo htmlspecialchars($field['name']); ?></td>
                                <td><?php echo formatCurrency($field['price']); ?></td>
                                <td>
                                    <span class="badge bg-<?php echo $field['status'] == 'active' ? 'success' : 'secondary'; ?>">
                                        <?php echo $field['status'] == 'active' ? 'Aktif' : 'Tidak Aktif'; ?>
                                    </span>
                                </td>
                                <td><?php echo formatDateTime($field['created_at']); ?></td>
                                <td>
                                    <a href="<?php echo APP_URL; ?>/admin/fields/edit.php?id=<?php echo $field['id']; ?>" class="btn btn-sm btn-warning">
                                        <i class="bi bi-pencil"></i> Edit
                                    </a>
                                    <button type="button"
                                        class="btn btn-sm btn-danger btn-hapus"
                                        data-id="<?php echo $field['id']; ?>"
                                        data-nama="<?php echo htmlspecialchars($field['name']); ?>"
                                        data-url="<?php echo APP_URL; ?>/admin/fields/delete.php?id=<?php echo $field['id']; ?>">
                                        <i class="bi bi-trash"></i> Hapus
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal Konfirmasi Hapus -->
<div class="modal fade" id="modalHapus" tabindex="-1" aria-labelledby="modalHapusLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius:16px;overflow:hidden;">
            <div class="modal-header border-0" style="background:linear-gradient(135deg,#dc3545,#b02a37);color:white;padding:1.25rem 1.5rem;">
                <h5 class="modal-title fw-bold text-white mb-0" id="modalHapusLabel">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>Konfirmasi Hapus
                </h5>
                <button type="button" class="btn-close" style="filter:brightness(0) invert(1);" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <p class="mb-1">Apakah Anda yakin ingin menghapus lapangan:</p>
                <p class="fw-bold fs-5 text-danger mb-0" id="namaLapanganHapus">-</p>
                <p class="text-muted small mt-2 mb-0"><i class="bi bi-info-circle me-1"></i>Lapangan yang sudah memiliki booking tidak dapat dihapus.</p>
            </div>
            <div class="modal-footer border-0 pb-4 px-4">
                <button type="button" class="btn btn-light rounded-3 px-4" data-bs-dismiss="modal">Batal</button>
                <a id="btnKonfirmasiHapus" href="#" class="btn btn-danger rounded-3 px-4 fw-bold">
                    <i class="bi bi-trash me-1"></i>Ya, Hapus
                </a>
            </div>
        </div>
    </div>
</div>

<?php
$pageScripts = '
<script>
$(document).ready(function() {
    // Inisialisasi DataTable
    $("#fieldsTable").DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json"
        }
    });

    // Event delegation untuk tombol hapus (kompatibel dengan DataTable)
    $(document).on("click", ".btn-hapus", function() {
        var id   = $(this).data("id");
        var nama = $(this).data("nama");
        var url  = $(this).data("url");

        // Set modal content
        $("#namaLapanganHapus").text(nama);
        $("#btnKonfirmasiHapus").attr("href", url);

        // Show modal
        var modal = new bootstrap.Modal(document.getElementById("modalHapus"));
        modal.show();
    });
});
</script>
';
include __DIR__ . '/../../includes/admin/footer.php';
?>
