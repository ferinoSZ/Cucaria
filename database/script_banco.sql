CREATE DATABASE cucaria;
USE cucaria;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('admin', 'cliente') DEFAULT 'cliente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    token_recuperacao VARCHAR(255) NULL,
    token_expiracao DATETIME NULL,
    token_sessao VARCHAR(64) NULL,           -- sessão única (último login vence)
    cliente_vip BOOLEAN DEFAULT FALSE
);

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    ordem INT NOT NULL DEFAULT 0              -- ordem de exibição (reordenável)
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco_venda DECIMAL(10, 2) NOT NULL,
    preco_producao DECIMAL(10, 2) NOT NULL,
    descricao TEXT NOT NULL,
    categoria_id INT NULL,
    imagem_url VARCHAR(255) DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,              -- 1 = disponível, 0 = esgotado
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20),
    usuario_id INT NULL,
    telefone VARCHAR(20) NULL,
    tipo_entrega ENUM('retirada', 'entrega') NULL,
    endereco VARCHAR(255) NULL,
    ponto_referencia VARCHAR(255) NULL,
    data_entrega DATETIME NULL,
    forma_pagamento ENUM('dinheiro', 'pix') NULL,
    pago TINYINT(1) DEFAULT 0,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'novo',       -- novo, aprovado, recusado, cancelado, pronto, entregue
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    produto_id INT,
    nome_produto VARCHAR(255),
    quantidade INT,
    preco DECIMAL(10,2),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE TABLE descontos (
    id INT PRIMARY KEY,
    valor DECIMAL(5,2) DEFAULT 0.00
);
