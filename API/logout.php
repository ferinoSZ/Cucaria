<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/usuario.php';
require_once __DIR__ . '/../back-end/sessao.php';

sessao::iniciar();

if (isset($_SESSION['usuario_id'])) {
    usuario::definirTokenSessao($conn, $_SESSION['usuario_id'], null);
}

session_destroy();

echo json_encode(['success' => true]);
