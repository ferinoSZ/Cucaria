<?php
header('Content-Type: application/json');
require_once 'sessao.php';
require_once '../API/config.php';

sessao::iniciar();

if (sessao::estaLogado()) {
    $isVip    = false;
    $desconto = 0;

    if ($_SESSION['usuario_perfil'] === 'cliente') {
        $stmt = $conn->prepare("SELECT cliente_vip FROM usuarios WHERE id = ?");
        $stmt->bind_param('i', $_SESSION['usuario_id']);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        $isVip = $res && intval($res['cliente_vip']) === 1;

        if ($isVip) {
            $res2 = $conn->query("SELECT valor FROM descontos WHERE id = 1");
            if ($res2 && $res2->num_rows > 0) {
                $desconto = (float)$res2->fetch_assoc()['valor'];
            }
        }
    }

    echo json_encode([
        'logado'       => true,
        'perfil'       => $_SESSION['usuario_perfil'],
        'nome'         => $_SESSION['usuario_nome'],
        'cliente_vip'  => $isVip,
        'desconto_vip' => $desconto
    ]);
} else {
    echo json_encode(['logado' => false]);
}
?>
