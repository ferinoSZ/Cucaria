<?php

require_once '../API/config.php';
require_once '../API/usuario.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") { 
    $nome = trim($_POST['nome']);
    $email = trim($_POST['email']);
    $senha = trim($_POST['senha']);
    $confirma_senha = trim($_POST['confirma_senha']);

    if ($senha !== $confirma_senha) {
        header("Location: ../front-end/cadastro.html?erro=senhas_nao_conferem");
        exit();
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $cadastrou = usuario::cadastrar($conn, $nome, $email, $senhaHash, 'cliente');

    if ($cadastrou) {
        header("Location: ../front-end/login.html?sucesso=cadastro_realizado");
        exit();
    } else {
        header("Location: ../front-end/cadastro.html?erro=email_em_uso");
        exit();
    }

} else {
    header("Location: ../front-end/cadastro.html");
    exit();
}
?>

