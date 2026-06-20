<?php

function carregarEnv($caminho) {
    if (!file_exists($caminho)) return;

    foreach (file($caminho, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
        $linha = trim($linha);
        if ($linha === '' || strpos($linha, '#') === 0 || strpos($linha, '=') === false) {
            continue;
        }

        [$chave, $valor] = explode('=', $linha, 2);
        $chave = trim($chave);
        $valor = trim(trim($valor), "\"'");

        if (getenv($chave) === false) {
            putenv("$chave=$valor");
            $_ENV[$chave] = $valor;
        }
    }
}

carregarEnv(__DIR__ . '/../.env');

function env($chave, $padrao = null) {
    $valor = getenv($chave);
    return $valor !== false ? $valor : $padrao;
}
