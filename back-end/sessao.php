<?php
class sessao {
    public static function iniciar() {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => '/',
                'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            session_start();
        }
    }

    public static function logar($usuario, $tokenSessao = null) {
        self::iniciar();
        session_regenerate_id(true);
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        $_SESSION['usuario_perfil'] = $usuario['perfil'];
        $_SESSION['token_sessao'] = $tokenSessao;
    }

    public static function estaLogado() {
        self::iniciar();
        return isset($_SESSION['usuario_id']);
    }

    // Sessão única (último login vence): valida o token da sessão contra o banco.
    // Se não bater, significa que o usuário logou em outro lugar -> encerra esta sessão.
    public static function tokenValido($conn) {
        self::iniciar();

        if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['token_sessao'])) {
            return false;
        }

        $stmt = $conn->prepare("SELECT token_sessao FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $_SESSION['usuario_id']);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();

        if (!$res || !hash_equals((string) $res['token_sessao'], (string) $_SESSION['token_sessao'])) {
            self::deslogar();
            return false;
        }

        return true;
    }

    public static function deslogar() {
        self::iniciar();
        session_unset();
        session_destroy();
    }
}
?>