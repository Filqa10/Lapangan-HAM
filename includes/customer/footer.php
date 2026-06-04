    </main>
    
    <footer class="mt-5 pt-5 pb-4 bg-white border-top">
        <div class="container text-center">
            <div class="mb-4">
                <a href="https://instagram.com" target="_blank" class="text-danger mx-3 fs-3"><i class="bi bi-instagram"></i></a>
                <a href="https://facebook.com" target="_blank" class="text-primary mx-3 fs-3"><i class="bi bi-facebook"></i></a>
                <a href="https://wa.me/6281234567890" target="_blank" class="text-success mx-3 fs-3"><i class="bi bi-whatsapp"></i></a>
                <a href="https://tiktok.com" target="_blank" class="text-dark mx-3 fs-3"><i class="bi bi-tiktok"></i></a>
            </div>
            <p class="text-muted small">&copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?>. Semua Hak Dilindungi.</p>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/id.js"></script>
    
    <?php
    $flash = getFlashMessage();
    if ($flash):
    ?>
    <script>
        $(document).ready(function() {
            const flash = <?php echo json_encode($flash); ?>;
            if (flash) {
                const alert = $('<div>')
                    .addClass('alert alert-' + flash.type + ' alert-dismissible fade show')
                    .attr('role', 'alert')
                    .html(flash.message + '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>')
                    .css({
                        'position': 'fixed',
                        'top': '20px',
                        'right': '20px',
                        'z-index': '9999',
                        'min-width': '300px'
                    });
                $('body').append(alert);
                setTimeout(() => alert.alert('close'), 5000);
            }
        });
    </script>
    <?php endif; ?>
    
    <?php if (isset($pageScripts)) echo $pageScripts; ?>
</body>
</html>
