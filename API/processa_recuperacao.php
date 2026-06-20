<?php

require_once '../API/config.php';
require_once '../API/usuario.php';
require_once '../API/config_email.php';
require_once '../API/rate_limiter.php';
require_once '../API/csrf.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (!Csrf::validar($_POST['csrf_token'] ?? '')) {
        header("Location: ../front-end/esqueceu_senha.html?erro=token_invalido");
        exit();
    }

    $email = trim($_POST['email']);
    $chaveLimite = 'recuperacao_' . $_SERVER['REMOTE_ADDR'] . '_' . $email;

    if (RateLimiter::bloqueado($chaveLimite)) {
        header("Location: ../front-end/esqueceu_senha.html?erro=muitas_tentativas");
        exit();
    }

    RateLimiter::registrarFalha($chaveLimite);

    $token = usuario::gerarTokenRecuperacao($conn, $email);

    if ($token) {
        $link = "http://localhost/cucaria/front-end/redefinir_senha.html?token=" . $token;
        try {
            $mail = configurarEmail();    
            $mail->setFrom('amacucariasitema@gmail.com', 'Ama Cucaria');
            $mail->addAddress($email);
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
            header("Location: ../front-end/esqueceu_senha.html?sucesso=email_enviado");
            exit();

        } catch (Exception $e) {
            header("Location: ../front-end/esqueceu_senha.html?erro=falha_envio");
            exit();
        }
    } else {
        header("Location: ../front-end/esqueceu_senha.html?sucesso=email_enviado");
        exit();
    }
} else {
    header("Location: ../front-end/esqueceu_senha.html");
    exit();
}
?>

