<?php

class Pedido {

    public static function criar($conn, $itens, $total) {

        // 🔹 inserir pedido
        $sql = "INSERT INTO pedidos (total, status) VALUES (?, 'novo')";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("d", $total);
        $stmt->execute();

        $pedido_id = $conn->insert_id;

        // 🔹 gerar número
        $numero = "#" . str_pad($pedido_id, 4, "0", STR_PAD_LEFT);

        $conn->query("UPDATE pedidos SET numero = '$numero' WHERE id = $pedido_id");

        // 🔹 inserir itens
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

        return [
            "success" => true,
            "numero" => $numero
        ];
    }
}