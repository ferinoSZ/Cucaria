<?php

// 1. Importa as classes necessárias (o Controlador conectando as peças)
require_once '../back-end/config.php';
require_once '../back-end/Usuario.php';
require_once '../back-end/Sessao.php';

// 2. Verifica se os dados realmente vieram via formulário POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $email = trim($_POST['email']);
    $senha = trim($_POST['senha']);

    // 3. Chama o Model para verificar no banco de dados
    // (A variável $conn vem do arquivo config.php)
    $usuarioAutenticado = Usuario::autenticar($conn, $email, $senha);

    if ($usuarioAutenticado) {
        // 4. Se a senha estiver correta, delega para a classe Sessao
        Sessao::logar($usuarioAutenticado);

        // 5. Redireciona com base no Perfil (SRP: O Controlador toma a decisão de rota)
        if ($_SESSION['usuario_perfil'] === 'admin') {
            // Se for a Dona da Cucaria, vai pro Kanban
            header("Location: ../front-end/kanban.html");
            exit();
        } else {
            // Se for Cliente, vai pro Cardápio
            header("Location: ../front-end/cardapio.html");
            exit();
        }
    } else {
       
        header("Location: ../front-end/login.html?erro=credenciais_invalidas");
        exit();
    }
} else {
    // Se alguém tentar acessar esse arquivo direto pela URL, chuta de volta pro login
    header("Location: ../front-end/login.html");
    exit();
}
?>

