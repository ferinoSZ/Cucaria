<?php
header('Content-Type: application/json');
require_once __DIR__ . '/csrf.php';

echo json_encode(['token' => Csrf::gerarToken()]);
