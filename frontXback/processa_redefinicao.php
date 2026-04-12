<?php

require_once '../back-end/config.php';
require_once '../back-end/Usuario.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $token = trim($_POST['token']);
    $nova_senha = trim($_POST['nova_senha']);
    $confirma_senha = trim($_POST['confirma_senha']);

    // 1. Verifica se o usuário não digitou senhas diferentes sem querer
    if ($nova_senha !== $confirma_senha) {
        header("Location: ../front-end/redefinir_senha.html?token={$token}&erro=senhas_diferentes");
        exit();
    }

    // 2. Criptografa a nova senha com segurança
    $senhaHash = password_hash($nova_senha, PASSWORD_DEFAULT);

    // 3. Manda o Model salvar no banco de dados
    $atualizou = Usuario::atualizarSenhaPorToken($conn, $token, $senhaHash);

    if ($atualizou) {
        // Sucesso! Manda para o login com aviso de sucesso
        header("Location: ../front-end/login.html?sucesso=senha_atualizada");
        exit();
    } else {
        // Falha (O token expirou, não existe, ou alguém tentou mexer na URL)
        header("Location: ../front-end/login.html?erro=token_invalido");
        exit();
    }

} else {
    header("Location: ../front-end/login.html");
    exit();
}
?>
