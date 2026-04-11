<?php
class Usuario {
    
    // Função estática para podermos chamar direto sem precisar instanciar a classe toda hora
    public static function autenticar($conn, $email, $senha) {
        
        // 1. Prepara a consulta SQL buscando apenas pelo e-mail
        $sql = "SELECT id, nome, email, senha, perfil, cliente_vip FROM usuarios WHERE email = ?";
        
        // Usamos prepared statements para evitar falhas de segurança (SQL Injection)
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        
        $resultado = $stmt->get_result();

        // 2. Se encontrou o e-mail no banco...
        if ($resultado->num_rows > 0) {
            $usuario = $resultado->fetch_assoc();
            
            // 3. Verifica se a senha digitada bate com a senha criptografada do banco
            if (password_verify($senha, $usuario['senha'])) {
                // Se tudo der certo, devolve os dados do usuário
                return $usuario;
            }
        }
        
        // Se o e-mail não existir ou a senha estiver errada, retorna falso
        return false;
    }

    // Função para inserir um novo usuário no banco de dados
    public static function cadastrar($conn, $nome, $email, $senhaHash, $perfil = 'cliente') {
        // Prepara o INSERT (usando ? para evitar SQL Injection)
        $sql = "INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $nome, $email, $senhaHash, $perfil);
        
        // Tenta executar. Se o e-mail já existir, vai dar erro por causa do UNIQUE no banco
        try {
            if ($stmt->execute()) {
                return true;
            }
        } catch (Exception $e) {
            // Se cair aqui, possivelmente é e-mail duplicado
            return false;
        }
        
        return false;
    }

    // Função para gerar e salvar o token de recuperação
    public static function gerarTokenRecuperacao($conn, $email) {
        // 1. Verifica se o email existe no sistema
        $sql = "SELECT id FROM usuarios WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($resultado->num_rows > 0) {
            // 2. Gera um token seguro e aleatório
            $token = bin2hex(random_bytes(32));
            
            // 3. Define a expiração para 1 hora a partir de agora
            $expiracao = date('Y-m-d H:i:s', strtotime('+1 hour'));

            // 4. Salva o token no banco de dados para esse usuário
            $sql_update = "UPDATE usuarios SET token_recuperacao = ?, token_expiracao = ? WHERE email = ?";
            $stmt_update = $conn->prepare($sql_update);
            $stmt_update->bind_param("sss", $token, $expiracao, $email);
            
            if ($stmt_update->execute()) {
                return $token; // Retorna o token para podermos enviar por e-mail
            }
        }
        
        return false; // Email não encontrado ou erro
    }

    public static function atualizarSenhaPorToken($conn, $token, $novaSenhaHash) {
        // 1. Verifica se o token existe e ainda está no prazo de validade (1 hora)
        $sql = "SELECT id FROM usuarios WHERE token_recuperacao = ? AND token_expiracao > NOW()";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($resultado->num_rows > 0) {
            // 2. Se for válido, atualiza a senha e APAGA o token para não ser usado de novo
            $sql_update = "UPDATE usuarios SET senha = ?, token_recuperacao = NULL, token_expiracao = NULL WHERE token_recuperacao = ?";
            $stmt_update = $conn->prepare($sql_update);
            $stmt_update->bind_param("ss", $novaSenhaHash, $token);
            
            if ($stmt_update->execute()) {
                return true;
            }
        }
        
        return false; // Token inválido ou expirado
    }


    
}
?>

