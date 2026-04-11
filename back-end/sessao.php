<?php

class Sessao {
    
    // Inicia a sessão com segurança, garantindo que não seja iniciada duas vezes
    public static function iniciar() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // Salva os dados do usuário na sessão após o login
    public static function logar($usuario) {
        self::iniciar();
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        $_SESSION['usuario_perfil'] = $usuario['perfil']; // Importante para saber se é admin ou cliente
    }

    // Verifica se existe alguém logado
    public static function estaLogado() {
        self::iniciar();
        return isset($_SESSION['usuario_id']);
    }

    // Destrói a sessão (Logout)
    public static function deslogar() {
        self::iniciar();
        session_unset();
        session_destroy();
    }
}
?>
