<?php
class usuario {   
    public static function autenticar($conn, $email, $senha) {   
        $sql = "SELECT id, nome, email, senha, perfil, cliente_vip FROM usuarios WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        
        $resultado = $stmt->get_result();

        if ($resultado->num_rows > 0) {
            $usuario = $resultado->fetch_assoc();
            
            if (password_verify($senha, $usuario['senha'])) {
                return $usuario;
            }
        }
        return false;
    }

    public static function cadastrar($conn, $nome, $email, $senhaHash, $perfil = 'cliente') {
        $sql = "INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)"; 
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $nome, $email, $senhaHash, $perfil);
        
        try {
            if ($stmt->execute()) {
                return true;
            }
        } catch (Exception $e) {
            return false;
        }
        
        return false;
    }

    public static function gerarTokenRecuperacao($conn, $email) {
        $sql = "SELECT id FROM usuarios WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($resultado->num_rows > 0) {
            $token = bin2hex(random_bytes(32));
            $expiracao = date('Y-m-d H:i:s', strtotime('+1 hour'));
            $sql_update = "UPDATE usuarios SET token_recuperacao = ?, token_expiracao = ? WHERE email = ?";
            $stmt_update = $conn->prepare($sql_update);
            $stmt_update->bind_param("sss", $token, $expiracao, $email);
            
            if ($stmt_update->execute()) {
                return $token; 
            }
        }
        return false; 
    }

    public static function atualizarSenhaPorToken($conn, $token, $novaSenhaHash) {
        $sql = "SELECT id FROM usuarios WHERE token_recuperacao = ? AND token_expiracao > NOW()";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($resultado->num_rows > 0) {
            $sql_update = "UPDATE usuarios SET senha = ?, token_recuperacao = NULL, token_expiracao = NULL WHERE token_recuperacao = ?";
            $stmt_update = $conn->prepare($sql_update);
            $stmt_update->bind_param("ss", $novaSenhaHash, $token);
            
            if ($stmt_update->execute()) {
                return true;
            }
        } 
        return false; 
    }
    
      public static function listarClientes($conn) {
        $sql = "SELECT id, nome, email, cliente_vip FROM usuarios WHERE perfil = 'cliente' ORDER BY nome ASC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $resultado = $stmt->get_result();
        return $resultado->fetch_all(MYSQLI_ASSOC);
    }

    public static function atualizarVip($conn, $id, $statusVip) {
        $sql = "UPDATE usuarios SET cliente_vip = ? WHERE id = ? AND perfil = 'cliente'";
        $stmt = $conn->prepare($sql);
        $valorBanco = $statusVip ? 1 : 0;
        $stmt->bind_param("ii", $valorBanco, $id);
        
        return $stmt->execute();
    }

    public static function excluir($conn, $id) {
        $sql = "DELETE FROM usuarios WHERE id = ? AND perfil = 'cliente'";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);      
        return $stmt->execute();
    }

}
?>