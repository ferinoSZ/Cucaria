<?php
header('Content-Type: application/json');
require_once '../API/config.php';
require_once '../API/usuario.php';
require_once '../back-end/sessao.php';

sessao::iniciar();

if (!isset($_SESSION['usuario_perfil']) || $_SESSION['usuario_perfil'] !== 'admin') {
    echo json_encode(['erro' => 'Acesso negado']);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    echo json_encode(Usuario::listarClientes($conn));
} 

if ($metodo === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);
    if ($dados['acao'] === 'toggleVip') {
        Usuario::atualizarVip($conn, $dados['id'], $dados['vip']);
        echo json_encode(['sucesso' => true]);
    } elseif ($dados['acao'] === 'excluir') {
        Usuario::excluir($conn, $dados['id']);
        echo json_encode(['sucesso' => true]);
    }
}
?>