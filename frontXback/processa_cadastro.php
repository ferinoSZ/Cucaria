<?php

require_once '../back-end/config.php';
require_once '../back-end/Usuario.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $nome = trim($_POST['nome']);
    $email = trim($_POST['email']);
    $senha = trim($_POST['senha']);
    $confirma_senha = trim($_POST['confirma_senha']);

    // 1. Validação básica de negócio
    if ($senha !== $confirma_senha) {
        // Se as senhas forem diferentes, volta pro cadastro com erro
        header("Location: ../front-end/cadastro.html?erro=senhas_nao_conferem");
        exit();
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    // 3. Chama o Model para salvar no banco
    // Por padrão, todo mundo que se cadastra pela tela é um 'cliente'
    $cadastrou = Usuario::cadastrar($conn, $nome, $email, $senhaHash, 'cliente');

    if ($cadastrou) {
        // Se deu tudo certo, manda ele fazer o login
        header("Location: ../front-end/login.html?sucesso=cadastro_realizado");
        exit();
    } else {
        // Falhou (ex: email já cadastrado)
        header("Location: ../front-end/cadastro.html?erro=email_em_uso");
        exit();
    }

} else {
    // Acesso indevido pela URL
    header("Location: ../front-end/cadastro.html");
    exit();
}
?>


