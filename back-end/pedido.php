<?php

require_once __DIR__ . "/../API/telegram.php";

class pedido {

    public static function criar($conn, $itens, $total, $usuarioId, $telefone, $tipoEntrega, $endereco, $pontoReferencia, $dataEntrega, $formaPagamento) {

        $sql = "INSERT INTO pedidos (total, status, usuario_id, telefone, tipo_entrega, endereco, ponto_referencia, data_entrega, forma_pagamento) VALUES (?, 'novo', ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("dissssss", $total, $usuarioId, $telefone, $tipoEntrega, $endereco, $pontoReferencia, $dataEntrega, $formaPagamento);
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

    private const COLUNAS = "p.id, p.numero, p.usuario_id, p.telefone, p.tipo_entrega, p.endereco, p.ponto_referencia,
                             p.data_entrega, p.forma_pagamento, p.pago, p.data_pedido, p.total, p.status";

    // Anexa os itens a cada pedido recebido (array de linhas da tabela pedidos).
    private static function anexarItens($conn, $pedidos) {
        if (empty($pedidos)) {
            return [];
        }

        $ids = array_column($pedidos, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $tipos = str_repeat('i', count($ids));

        $stmt = $conn->prepare("SELECT pedido_id, produto_id, nome_produto, quantidade, preco
                                 FROM itens_pedido WHERE pedido_id IN ($placeholders)");
        $stmt->bind_param($tipos, ...$ids);
        $stmt->execute();
        $itens = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $itensPorPedido = [];
        foreach ($itens as $item) {
            $itensPorPedido[$item['pedido_id']][] = $item;
        }

        foreach ($pedidos as &$pedido) {
            $pedido['itens'] = $itensPorPedido[$pedido['id']] ?? [];
        }

        return $pedidos;
    }

    // Tela do admin: somente pedidos ativos (em andamento).
    public static function listarTodos($conn) {
        $sql = "SELECT " . self::COLUNAS . ", u.nome AS cliente_nome
                FROM pedidos p
                LEFT JOIN usuarios u ON u.id = p.usuario_id
                WHERE p.status IN ('novo', 'aprovado', 'pronto')
                ORDER BY p.data_pedido DESC";

        $resultado = $conn->query($sql);
        $pedidos = $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];

        return self::anexarItens($conn, $pedidos);
    }

    // Tela "Meus Pedidos" do cliente: todos os pedidos dele, inclusive finalizados.
    public static function listarPorUsuario($conn, $usuarioId) {
        $sql = "SELECT " . self::COLUNAS . "
                FROM pedidos p
                WHERE p.usuario_id = ?
                ORDER BY p.data_pedido DESC";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $usuarioId);
        $stmt->execute();
        $pedidos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        return self::anexarItens($conn, $pedidos);
    }

    public static function atualizarStatus($conn, $id, $status) {
        $statusPermitidos = ['novo', 'aprovado', 'recusado', 'cancelado', 'pronto', 'entregue'];
        if (!in_array($status, $statusPermitidos, true)) {
            return false;
        }

        $sql = "UPDATE pedidos SET status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $status, $id);
        return $stmt->execute();
    }

    public static function marcarPago($conn, $id, $pago) {
        $valor = $pago ? 1 : 0;
        $stmt = $conn->prepare("UPDATE pedidos SET pago = ? WHERE id = ?");
        $stmt->bind_param("ii", $valor, $id);
        return $stmt->execute();
    }
}