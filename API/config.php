<?php
require_once __DIR__ . '/env.php';

$host = env('DB_HOST', 'localhost');
$user = env('DB_USER', 'root');
$pass = env('DB_PASS', '');
$db   = env('DB_NAME', 'cucaria');

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    error_log('Falha na conexao com o banco: ' . $conn->connect_error);
    http_response_code(500);
    die(json_encode(['erro' => 'Erro interno do servidor.']));
}
?>