<?php

require_once __DIR__ . "/../API/telegram.php";

class pedido {

    public static function criar($conn, $itens, $total) {

        $sql = "INSERT INTO pedidos (total, status) VALUES (?, 'novo')";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("d", $total);
        $stmt->execute();
        $pedido_id = $conn->insert_id;
        $numero = "#" . str_pad($pedido_id, 4, "0", STR_PAD_LEFT);
        $stmtNumero = $conn->prepare("UPDATE pedidos SET numero = ? WHERE id = ?");
        $stmtNumero->bind_param("si", $numero, $pedido_id);
        $stmtNumero->execute();

        foreach ($itens as $item) {
            $sql = "INSERT INTO itens_pedido 
                (pedido_id, produto_id, nome_produto, quantidade, preco)
                VALUES (?, ?, ?, ?, ?)";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param(
                "iisid",
                $pedido_id,
                $item['id'],
                $item['nome'],
                $item['quantidade'],
                $item['preco']
            );
            $stmt->execute();
        }

        Telegram::notificarNovoPedido($numero, $total, $itens);

        return [
            "success" => true,
            "numero"  => $numero
        ];
    }
}