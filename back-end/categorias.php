<?php
header("Content-Type: application/json");

require_once __DIR__ . "/../API/config.php";
require_once __DIR__ . "/../API/categoria.php";
require_once __DIR__ . "/sessao.php";

sessao::iniciar();
$isAdmin = sessao::tokenValido($conn) && $_SESSION['usuario_perfil'] === 'admin';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

function exigirAdminCategorias($isAdmin) {
    if (!$isAdmin) {
        http_response_code(403);
        echo json_encode(["erro" => "Acesso negado"]);
        exit;
    }
}

switch ($method) {

    case 'GET':
        echo json_encode(Categoria::listarTodas($conn));
        break;

    case 'POST':
        exigirAdminCategorias($isAdmin);

        $acao = $input['acao'] ?? '';
        $nome = trim($input['nome'] ?? '');

        if ($acao === 'criar') {
            if ($nome === '') {
                echo json_encode(["success" => false, "erro" => "Informe o nome da categoria."]);
                break;
            }
            $ok = Categoria::criar($conn, $nome);
            echo json_encode(["success" => $ok, "erro" => $ok ? null : "Categoria já existe."]);
            break;
        }

        if ($acao === 'renomear') {
            if (empty($input['id']) || $nome === '') {
                echo json_encode(["success" => false, "erro" => "Dados inválidos."]);
                break;
            }
            $ok = Categoria::renomear($conn, (int) $input['id'], $nome);
            echo json_encode(["success" => $ok, "erro" => $ok ? null : "Não foi possível renomear (nome já existe?)."]);
            break;
        }

        if ($acao === 'excluir') {
            if (empty($input['id'])) {
                echo json_encode(["success" => false, "erro" => "Dados inválidos."]);
                break;
            }
            $ok = Categoria::excluir($conn, (int) $input['id']);
            echo json_encode(["success" => $ok]);
            break;
        }

        if ($acao === 'reordenar') {
            if (empty($input['ids']) || !is_array($input['ids'])) {
                echo json_encode(["success" => false, "erro" => "Dados inválidos."]);
                break;
            }
            $ok = Categoria::reordenar($conn, $input['ids']);
            echo json_encode(["success" => $ok]);
            break;
        }

        http_response_code(400);
        echo json_encode(["erro" => "Ação inválida"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["erro" => "Método não permitido"]);
        break;
}
