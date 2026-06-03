<?php

require_once '../API/config.php';
require_once '../API/usuario.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $token = trim($_POST['token']);
    $nova_senha = trim($_POST['nova_senha']);
    $confirma_senha = trim($_POST['confirma_senha']);

    if ($nova_senha !== $confirma_senha) {
        header("Location: ../front-end/redefinir_senha.html?token={$token}&erro=senhas_diferentes");
        exit();
    }

    $senhaHash = password_hash($nova_senha, PASSWORD_DEFAULT);
    $atualizou = usuario::atualizarSenhaPorToken($conn, $token, $senhaHash);

    if ($atualizou) {
        header("Location: ../front-end/login.html?sucesso=senha_atualizada");
        exit();
    } else {
        header("Location: ../front-end/login.html?erro=token_invalido");
        exit();
    }

} else {
    header("Location: ../front-end/login.html");
    exit();
}
?>
