<?php
header("Content-Type: application/json");

require_once("../API/config.php");
require_once("../API/pedido.php");

$method = $_SERVER['REQUEST_METHOD'];

$input = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    case 'POST':

        $itens = $input['itens'];
        $total = $input['total'];

        $resultado = Pedido::criar($conn, $itens, $total);

        echo json_encode($resultado);
        break;
}