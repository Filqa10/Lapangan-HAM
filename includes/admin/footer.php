    </div> <!-- End main-content -->
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
    
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
