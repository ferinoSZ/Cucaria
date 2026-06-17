<?php

require_once '../API/config.php';
require_once '../API/usuario.php';
require_once '../back-end/sessao.php';
require_once '../API/rate_limiter.php';
require_once '../API/csrf.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (!Csrf::validar($_POST['csrf_token'] ?? '')) {
        header("Location: ../front-end/login.html?erro=token_invalido");
        exit();
    }

    $email = trim($_POST['email']);
    $senha = trim($_POST['senha']);
    $chaveLimite = 'login_' . $_SERVER['REMOTE_ADDR'] . '_' . $email;

    if (RateLimiter::bloqueado($chaveLimite)) {
        header("Location: ../front-end/login.html?erro=muitas_tentativas");
        exit();
    }

    $usuarioAutenticado = usuario::autenticar($conn, $email, $senha);

    if ($usuarioAutenticado) {
        RateLimiter::limpar($chaveLimite);
        sessao::logar($usuarioAutenticado);
        header("Location: ../front-end/cardapio.html");
        exit();
    } else {
        RateLimiter::registrarFalha($chaveLimite);
        header("Location: ../front-end/login.html?erro=credenciais_invalidas");
        exit();
    }
} else {
    header("Location: ../front-end/login.html");
    exit();
}
?>

