<?php
// Carrega o que o Composer baixou
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function configurarEmail() {
    $mail = new PHPMailer(true);

    // Configurações do Servidor SMTP do Google
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'kaue.univillegsr@gmail.com';         // Seu Gmail
    $mail->Password   = 'hnkczzerrqcdlgjj';         // A SENHA DE 16 DÍGITOS
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; 
    $mail->Port       = 587;

    return $mail;
}