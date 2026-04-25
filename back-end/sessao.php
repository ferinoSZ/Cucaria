<?php
class sessao {
    public static function iniciar() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function logar($usuario) {
        self::iniciar();
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        $_SESSION['usuario_perfil'] = $usuario['perfil']; 
    }

    public static function estaLogado() {
        self::iniciar();
        return isset($_SESSION['usuario_id']);
    }

    public static function deslogar() {
        self::iniciar();
        session_unset();
        session_destroy();
    }
}
?>