<?php

class UploadImagem {
    const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5MB
    const EXTENSOES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'webp'];
    const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

    public static function salvar($arquivo, $pastaDestino) {
        if (!isset($arquivo) || $arquivo['error'] !== UPLOAD_ERR_OK) {
            return ['erro' => 'Falha no envio do arquivo.'];
        }

        if ($arquivo['size'] > self::TAMANHO_MAXIMO) {
            return ['erro' => 'Imagem excede o tamanho máximo de 5MB.'];
        }

        $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
        if (!in_array($extensao, self::EXTENSOES_PERMITIDAS, true)) {
            return ['erro' => 'Formato de imagem inválido.'];
        }

        $infoImagem = @getimagesize($arquivo['tmp_name']);
        if ($infoImagem === false || !in_array($infoImagem['mime'], self::MIME_PERMITIDOS, true)) {
            return ['erro' => 'O arquivo enviado não é uma imagem válida.'];
        }

        if (!is_dir($pastaDestino)) {
            mkdir($pastaDestino, 0777, true);
        }

        $nomeArquivo = uniqid('produto_') . '.' . $extensao;
        $caminhoCompleto = rtrim($pastaDestino, '/') . '/' . $nomeArquivo;

        if (!move_uploaded_file($arquivo['tmp_name'], $caminhoCompleto)) {
            return ['erro' => 'Falha ao mover arquivo.'];
        }

        return ['nomeArquivo' => $nomeArquivo];
    }
}
