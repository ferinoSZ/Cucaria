<?php
header("Content-Type: application/json");

require_once __DIR__ . "/../API/config.php";
require_once __DIR__ . "/../back-end/pedido.php";

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    case 'POST':
        if (empty($input['itens']) || empty($input['total'])) {
            http_response_code(400);
            echo json_encode(['error' => 'itens e total são obrigatórios']);
            break;
        }

        $resultado = Pedido::criar($conn, $input['itens'], $input['total']);
        echo json_encode($resultado);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}