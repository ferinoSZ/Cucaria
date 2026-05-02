<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../API/config.php");
require_once("../API/produto.php");

$method = $_SERVER['REQUEST_METHOD'];

// Pega dados do body (JSON)
$input = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    case 'GET':
        $produtos = Produto::listarTodos($conn, true);
        echo json_encode($produtos);
        break;

    case 'POST':
        $ok = Produto::cadastrar(
            $conn,
            $input['nome'],
            $input['preco_venda'],
            $input['preco_producao'],
            $input['descricao'],
            $input['imagem_url']
        );

        echo json_encode(["success" => $ok]);
        break;

    case 'PUT':
        $ok = Produto::editar(
            $conn,
            $input['id'],
            $input['nome'],
            $input['preco_venda'],
            $input['preco_producao'],
            $input['descricao'],
            $input['imagem_url']
        );

        echo json_encode(["success" => $ok]);
        break;

    case 'DELETE':
        $id = $_GET['id'];
        $ok = Produto::excluir($conn, $id);

        echo json_encode(["success" => $ok]);
        break;
}