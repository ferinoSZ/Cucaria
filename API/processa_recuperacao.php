<?php

require_once '../API/config.php';
require_once '../API/usuario.php';
require_once '../API/config_email.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
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

