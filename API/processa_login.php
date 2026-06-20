<?php
header('Content-Type: application/json');

require_once '../API/config.php';
require_once '../API/usuario.php';
require_once '../back-end/sessao.php';
require_once '../API/rate_limiter.php';
require_once '../API/csrf.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'metodo_invalido']);
    exit();
}

if (!Csrf::validar($_POST['csrf_token'] ?? '')) {
    echo json_encode(['ok' => false, 'erro' => 'token_invalido']);
    exit();
}

$email = trim($_POST['email'] ?? '');
$senha = trim($_POST['senha'] ?? '');
$forcar = !empty($_POST['forcar']);
$chaveLimite = 'login_' . $_SERVER['REMOTE_ADDR'] . '_' . $email;

if (RateLimiter::bloqueado($chaveLimite)) {
    echo json_encode(['ok' => false, 'erro' => 'muitas_tentativas']);
    exit();
}

$usuarioAutenticado = usuario::autenticar($conn, $email, $senha);

if (!$usuarioAutenticado) {
    RateLimiter::registrarFalha($chaveLimite);
    echo json_encode(['ok' => false, 'erro' => 'credenciais_invalidas']);
    exit();
}

RateLimiter::limpar($chaveLimite);

// Sessão única: se já existe uma sessão ativa e o usuário não confirmou,
// pergunta antes de assumir (desconectando o outro dispositivo).
if (!$forcar && !empty($usuarioAutenticado['token_sessao'])) {
    echo json_encode(['ok' => false, 'status' => 'ja_conectado']);
    exit();
}

$tokenSessao = bin2hex(random_bytes(32));
usuario::definirTokenSessao($conn, $usuarioAutenticado['id'], $tokenSessao);
sessao::logar($usuarioAutenticado, $tokenSessao);

$destino = $usuarioAutenticado['perfil'] === 'admin'
    ? '../front-end/pedidos.html'
    : '../front-end/cardapio.html';

echo json_encode(['ok' => true, 'redirect' => $destino]);
