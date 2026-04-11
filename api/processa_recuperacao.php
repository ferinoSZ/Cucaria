<?php

require_once '../back-end/config.php';
require_once '../back-end/Usuario.php';
require_once '../back-end/config_email.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);

    // 1. Chama o model para criar o token
    $token = Usuario::gerarTokenRecuperacao($conn, $email);

    if ($token) {
        // 2. Monta o link que o usuário vai clicar
        // (Depois criaremos essa tela de redefinir_senha.html)
        $link = "http://localhost/cucaria/front-end/redefinir_senha.html?token=" . $token;

        // 3. Envia o e-mail usando o PHPMailer
        try {
            $mail = configurarEmail();
            
            // Quem está enviando (use o mesmo e-mail da configuração)
            $mail->setFrom('kaue.univillegsr@gmail.com', 'Ama Cucaria');
            
            // Quem vai receber
            $mail->addAddress($email);

            // Conteúdo do e-mail
            $mail->isHTML(true);
            $mail->Subject = 'Recuperacao de Senha - Ama Cucaria';
            $mail->Body    = "
                <h2>Você solicitou a recuperação de senha!</h2>
                <p>Clique no link abaixo para criar uma nova senha. Este link é válido por 1 hora.</p>
                <p><a href='{$link}'>{$link}</a></p>
                <br>
                <p>Se você não solicitou isso, apenas ignore este e-mail.</p>
            ";

            $mail->send();
            
            // Redireciona com mensagem de sucesso
            header("Location: ../front-end/esqueceu_senha.html?sucesso=email_enviado");
            exit();

        } catch (Exception $e) {
            // Em caso de erro na configuração do provedor de e-mail
            header("Location: ../front-end/esqueceu_senha.html?erro=falha_envio");
            exit();
        }
    } else {
        // Por segurança, mesmo se o e-mail não existir, dizemos que enviamos 
        // (Isso evita que hackers fiquem testando quais e-mails existem no seu sistema)
        header("Location: ../front-end/esqueceu_senha.html?sucesso=email_enviado");
        exit();
    }

} else {
    header("Location: ../front-end/esqueceu_senha.html");
    exit();
}
?>

