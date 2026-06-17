<?php
require_once __DIR__ . '/../back-end/sessao.php';

sessao::iniciar();
session_destroy();

echo json_encode(['success' => true]);