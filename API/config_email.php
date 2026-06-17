<?php

require __DIR__ . '/env.php';
require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function configurarEmail() {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = env('EMAIL_HOST', 'smtp.gmail.com');
    $mail->SMTPAuth   = true;
    $mail->Username   = env('EMAIL_USER');
    $mail->Password   = env('EMAIL_PASS');
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = (int) env('EMAIL_PORT', 587);

    return $mail;
}
