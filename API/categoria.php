<?php

class Categoria {

    public static function listarTodas($conn) {
        $resultado = $conn->query("SELECT id, nome FROM categorias ORDER BY ordem ASC, nome ASC");
        return $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];
    }

    public static function criar($conn, $nome) {
        $res = $conn->query("SELECT COALESCE(MAX(ordem), 0) + 1 AS prox FROM categorias");
        $ordem = $res ? (int) $res->fetch_assoc()['prox'] : 0;

        $stmt = $conn->prepare("INSERT INTO categorias (nome, ordem) VALUES (?, ?)");
        $stmt->bind_param("si", $nome, $ordem);
        return $stmt->execute();
    }

    public static function reordenar($conn, $ids) {
        $stmt = $conn->prepare("UPDATE categorias SET ordem = ? WHERE id = ?");
        foreach (array_values($ids) as $posicao => $id) {
            $idInt = (int) $id;
            $stmt->bind_param("ii", $posicao, $idInt);
            $stmt->execute();
        }
        return true;
    }

    public static function renomear($conn, $id, $nome) {
        $stmt = $conn->prepare("UPDATE categorias SET nome = ? WHERE id = ?");
        $stmt->bind_param("si", $nome, $id);
        return $stmt->execute();
    }

    public static function excluir($conn, $id) {
        $stmt = $conn->prepare("DELETE FROM categorias WHERE id = ?");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }
}
