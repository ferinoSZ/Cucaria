<?php
header('Content-Type: application/json');
require_once '../API/config.php';
require_once '../API/usuario.php';
require_once '../back-end/sessao.php';

sessao::iniciar();

if (!sessao::tokenValido($conn) || $_SESSION['usuario_perfil'] !== 'admin') {
    echo json_encode(['erro' => 'Acesso negado']);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $clientes = Usuario::listarClientes($conn);
    $res = $conn->query("SELECT valor FROM descontos WHERE id = 1");
    $desconto = $res && $res->num_rows > 0 ? (float)$res->fetch_assoc()['valor'] : 0;

    echo json_encode([
        'clientes'     => $clientes,
        'desconto_vip' => $desconto
    ]);
}

if ($metodo === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);

    if ($dados['acao'] === 'toggleVip') {
        Usuario::atualizarVip($conn, $dados['id'], $dados['vip']);
        echo json_encode(['sucesso' => true]);

    } elseif ($dados['acao'] === 'excluir') {
        Usuario::excluir($conn, $dados['id']);
        echo json_encode(['sucesso' => true]);

    } elseif ($dados['acao'] === 'salvarDesconto') {
        $desconto = max(0, min(100, (float)($dados['desconto'] ?? 0)));
        $stmt = $conn->prepare("INSERT INTO descontos (id, valor) VALUES (1, ?) ON DUPLICATE KEY UPDATE valor = ?");
        $val = (string)$desconto;
        $stmt->bind_param('ss', $val, $val);
        $ok = $stmt->execute();
        echo json_encode(['sucesso' => $ok]);
    }
}
?>
