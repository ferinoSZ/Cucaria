<?php
header("Content-Type: application/json");

require_once __DIR__ . "/../back-end/sessao.php";
require_once __DIR__ . "/../API/config.php";
require_once __DIR__ . "/../back-end/pedido.php";

sessao::iniciar();

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

function exigirAdminPedidos() {
    global $conn;
    if (!sessao::tokenValido($conn) || $_SESSION['usuario_perfil'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso restrito a administradores.']);
        exit();
    }
}

switch ($method) {

    case 'GET':
        // ?meus=1 -> pedidos do cliente logado; sem parâmetro -> tela do admin
        if (isset($_GET['meus'])) {
            if (!sessao::tokenValido($conn)) {
                http_response_code(401);
                echo json_encode(['error' => 'É preciso estar logado.']);
                break;
            }
            echo json_encode(Pedido::listarPorUsuario($conn, $_SESSION['usuario_id']));
            break;
        }

        exigirAdminPedidos();
        echo json_encode(Pedido::listarTodos($conn));
        break;

    case 'POST':
        if (isset($input['acao']) && $input['acao'] === 'atualizarStatus') {
            exigirAdminPedidos();

            if (empty($input['id']) || empty($input['status'])) {
                http_response_code(400);
                echo json_encode(['error' => 'id e status são obrigatórios']);
                break;
            }

            $sucesso = Pedido::atualizarStatus($conn, (int) $input['id'], $input['status']);
            echo json_encode(['success' => $sucesso]);
            break;
        }

        if (isset($input['acao']) && $input['acao'] === 'marcarPago') {
            exigirAdminPedidos();

            if (empty($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'id é obrigatório']);
                break;
            }

            $sucesso = Pedido::marcarPago($conn, (int) $input['id'], !empty($input['pago']));
            echo json_encode(['success' => $sucesso]);
            break;
        }

        if (empty($input['itens']) || empty($input['total'])) {
            http_response_code(400);
            echo json_encode(['error' => 'itens e total são obrigatórios']);
            break;
        }

        $telefone = trim($input['telefone'] ?? '');
        if (strlen(preg_replace('/\D/', '', $telefone)) < 10) {
            http_response_code(400);
            echo json_encode(['error' => 'telefone obrigatório']);
            break;
        }

        // Se há uma sessão mas o token não bate (logou em outro dispositivo),
        // bloqueia: essa sessão foi encerrada.
        if (isset($_SESSION['usuario_id']) && !sessao::tokenValido($conn)) {
            http_response_code(401);
            echo json_encode(['error' => 'sessao_encerrada']);
            break;
        }

        $usuarioId = sessao::estaLogado() ? $_SESSION['usuario_id'] : null;

        $resultado = Pedido::criar(
            $conn,
            $input['itens'],
            $input['total'],
            $usuarioId,
            $telefone,
            $input['tipo_entrega'] ?? null,
            $input['endereco'] ?? null,
            $input['ponto_referencia'] ?? null,
            $input['data_entrega'] ?? null,
            $input['forma_pagamento'] ?? null
        );
        echo json_encode($resultado);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}