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