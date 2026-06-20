<?php

require_once __DIR__ . '/../back-end/sessao.php';

class Csrf {
    public static function gerarToken() {
        sessao::iniciar();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function validar($token) {
        sessao::iniciar();
        return !empty($_SESSION['csrf_token']) && !empty($token)
            && hash_equals($_SESSION['csrf_token'], $token);
    }
}
