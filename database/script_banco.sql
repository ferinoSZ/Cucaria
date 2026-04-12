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
    cliente_vip BOOLEAN DEFAULT FALSE
);


CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco_venda DECIMAL(10, 2) NOT NULL,
    preco_producao DECIMAL(10, 2) NOT NULL,
    descricao TEXT NOT NULL,
    imagem_url VARCHAR(255) DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1, -- 1 significa que está disponível, 0 significa esgotado
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

