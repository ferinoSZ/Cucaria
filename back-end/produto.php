<?php

class Produto {
    // Método para cadastrar um novo produto no banco
    public static function cadastrar($conn, $nome, $preco_venda, $preco_producao, $descricao, $imagem_url) {
        try {
            $sql = "INSERT INTO produtos (nome, preco_venda, preco_producao, descricao, imagem_url, ativo) 
                    VALUES (?, ?, ?, ?, ?, 1)";
            
            $stmt = $conn->prepare($sql);
            
            if (!$stmt) {
                error_log("Erro de sintaxe SQL: " . $conn->error);
                return false;
            }

            // "sddss" significa: String, Double, Double, String, String
            $stmt->bind_param("sddss", $nome, $preco_venda, $preco_producao, $descricao, $imagem_url);

            $resultado = $stmt->execute();
            $stmt->close();
            
            return $resultado;
        } catch (Exception $e) {
            error_log("Erro ao cadastrar produto: " . $e->getMessage());
            return false;
        }
    }

    // Método para listar os produtos (usaremos no Cardápio e na Gestão)
    public static function listarTodos($conn, $apenasAtivos = false) {
        try {
            $sql = "SELECT * FROM produtos";
            if ($apenasAtivos) {
                $sql .= " WHERE ativo = 1";
            }
            $sql .= " ORDER BY nome ASC";

            $resultado = $conn->query($sql);

            if ($resultado) {
                // Retorna um array com todos os produtos
                return $resultado->fetch_all(MYSQLI_ASSOC);
            }
            return [];
        } catch (Exception $e) {
            error_log("Erro ao listar produtos: " . $e->getMessage());
            return [];
        }
    }

    // Método para ativar ou desativar um produto (a regra que você pediu)
    public static function mudarStatus($conn, $id, $status) {
        try {
            $sql = "UPDATE produtos SET ativo = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            
            if (!$stmt) {
                return false;
            }

            // "ii" significa: Integer, Integer
            $stmt->bind_param("ii", $status, $id);

            $resultado = $stmt->execute();
            $stmt->close();
            
            return $resultado;
        } catch (Exception $e) {
            error_log("Erro ao mudar status do produto: " . $e->getMessage());
            return false;
        }
    }
}
?>
