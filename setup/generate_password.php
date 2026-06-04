<?php
/**
 * Utility script to generate password hash
 * Usage: php setup/generate_password.php
 */

if (php_sapi_name() !== 'cli') {
    die('This script can only be run from command line.');
}

echo "Password Hash Generator\n";
echo "======================\n\n";

if (isset($argv[1])) {
    $password = $argv[1];
} else {
    echo "Enter password: ";
    $password = trim(fgets(STDIN));
}

if (empty($password)) {
    die("Password cannot be empty.\n");
}

$hash = password_hash($password, PASSWORD_DEFAULT);
echo "\nPassword: " . $password . "\n";
echo "Hash: " . $hash . "\n\n";

echo "SQL Update Query:\n";
echo "UPDATE users SET password = '" . $hash . "' WHERE email = 'admin@bookinglapangan.com';\n\n";
