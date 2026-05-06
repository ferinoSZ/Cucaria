<?php
require_once 'sessao.php';

sessao::iniciar();

if (sessao::estaLogado()) {
    echo json_encode([
        "logado" => true,
        "perfil" => $_SESSION['usuario_perfil'],
        "nome" => $_SESSION['usuario_nome']
    ]);
} else {
    echo json_encode([
        "logado" => false
    ]);
}