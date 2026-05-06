<?php

require_once '../API/config.php';
require_once '../API/usuario.php';
require_once '../back-end/sessao.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $senha = trim($_POST['senha']);
    $usuarioAutenticado = usuario::autenticar($conn, $email, $senha);

    if ($usuarioAutenticado) {
        sessao::logar($usuarioAutenticado);

        if ($_SESSION['usuario_perfil'] === 'admin') {
            header("Location: ../front-end/cardapio.html");
            exit();
        } else {
            header("Location: ../front-end/cardapio.html");
            exit();
        }
    } else {
        header("Location: ../front-end/login.html?erro=credenciais_invalidas");
        exit();
    }
} else {
    header("Location: ../front-end/login.html");
    exit();
}
?>

