<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

redirect(APP_URL . '/customer/booking/create.php');
exit;
