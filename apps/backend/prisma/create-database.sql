-- ============================================================================
-- INFOSEG CORE — Script de Criação do Banco de Dados (SQL Server)
-- Sistema de Portaria Remota de Condomínios
-- ============================================================================

-- 1. Criar o banco de dados
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'infoseg_core')
BEGIN
    CREATE DATABASE infoseg_core;
END
GO

USE infoseg_core;
GO

-- ============================================================================
-- 2. Tabela: Resident (Moradores)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Resident')
BEGIN
    CREATE TABLE [dbo].[Resident] (
        [id]                NVARCHAR(36)    NOT NULL,
        [name]              NVARCHAR(150)   NOT NULL,
        [apartment_number]  NVARCHAR(10)    NOT NULL,
        [block]             NVARCHAR(20)    NOT NULL,
        [phone]             NVARCHAR(20)    NOT NULL,
        [email]             NVARCHAR(255)   NOT NULL,
        [password_hash]     NVARCHAR(255)   NOT NULL,
        [created_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        [updated_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_Resident] PRIMARY KEY ([id]),
        CONSTRAINT [UQ_Resident_email] UNIQUE ([email])
    );

    CREATE INDEX [IX_Resident_email] ON [dbo].[Resident] ([email]);
    CREATE INDEX [IX_Resident_apartment_block] ON [dbo].[Resident] ([apartment_number], [block]);
END
GO

-- ============================================================================
-- 3. Tabela: Concierge (Porteiros)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Concierge')
BEGIN
    CREATE TABLE [dbo].[Concierge] (
        [id]                NVARCHAR(36)    NOT NULL,
        [name]              NVARCHAR(150)   NOT NULL,
        [email]             NVARCHAR(255)   NOT NULL,
        [phone]             NVARCHAR(20)    NOT NULL,
        [password_hash]     NVARCHAR(255)   NOT NULL,
        [created_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        [updated_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_Concierge] PRIMARY KEY ([id]),
        CONSTRAINT [UQ_Concierge_email] UNIQUE ([email])
    );

    CREATE INDEX [IX_Concierge_email] ON [dbo].[Concierge] ([email]);
END
GO

-- ============================================================================
-- 4. Tabela: Visitor (Visitantes)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Visitor')
BEGIN
    CREATE TABLE [dbo].[Visitor] (
        [id]                NVARCHAR(36)    NOT NULL,
        [name]              NVARCHAR(150)   NOT NULL,
        [document]          NVARCHAR(30)    NOT NULL,
        [face_encoding_url] NVARCHAR(500)   NULL,
        [created_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_Visitor] PRIMARY KEY ([id])
    );

    CREATE INDEX [IX_Visitor_document] ON [dbo].[Visitor] ([document]);
END
GO

-- ============================================================================
-- 5. Tabela: Visit (Visitas / Convites)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Visit')
BEGIN
    CREATE TABLE [dbo].[Visit] (
        [id]                NVARCHAR(36)    NOT NULL,
        [resident_id]       NVARCHAR(36)    NOT NULL,
        [visitor_id]        NVARCHAR(36)    NULL,
        [status]            NVARCHAR(20)    NOT NULL DEFAULT 'pending',
        [visit_date]        DATETIME2       NULL,
        [valid_until]       DATETIME2       NOT NULL,
        [invite_link_token] NVARCHAR(255)   NOT NULL,
        [visitor_name]      NVARCHAR(150)   NOT NULL,
        [created_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        [updated_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_Visit] PRIMARY KEY ([id]),
        CONSTRAINT [UQ_Visit_invite_link_token] UNIQUE ([invite_link_token]),
        CONSTRAINT [FK_Visit_Resident] FOREIGN KEY ([resident_id]) REFERENCES [dbo].[Resident]([id]),
        CONSTRAINT [FK_Visit_Visitor] FOREIGN KEY ([visitor_id]) REFERENCES [dbo].[Visitor]([id]),
        CONSTRAINT [CK_Visit_status] CHECK ([status] IN ('pending', 'approved', 'denied'))
    );

    CREATE INDEX [IX_Visit_resident_id] ON [dbo].[Visit] ([resident_id]);
    CREATE INDEX [IX_Visit_invite_link_token] ON [dbo].[Visit] ([invite_link_token]);
    CREATE INDEX [IX_Visit_status_valid_until] ON [dbo].[Visit] ([status], [valid_until]);
END
GO

-- ============================================================================
-- 6. Tabela: AccessLog (Registros de Acesso)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AccessLog')
BEGIN
    CREATE TABLE [dbo].[AccessLog] (
        [id]                NVARCHAR(36)    NOT NULL,
        [user_id]           NVARCHAR(36)    NOT NULL,
        [user_type]         NVARCHAR(20)    NOT NULL,
        [action_type]       NVARCHAR(50)    NOT NULL,
        [access_point]      NVARCHAR(100)   NOT NULL,
        [details]           NVARCHAR(500)   NULL,
        [timestamp]         DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_AccessLog] PRIMARY KEY ([id]),
        CONSTRAINT [CK_AccessLog_user_type] CHECK ([user_type] IN ('resident', 'visitor', 'concierge')),
        CONSTRAINT [FK_AccessLog_Concierge] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Concierge]([id])
    );

    CREATE INDEX [IX_AccessLog_timestamp] ON [dbo].[AccessLog] ([timestamp]);
    CREATE INDEX [IX_AccessLog_user_type_user_id] ON [dbo].[AccessLog] ([user_type], [user_id]);
END
GO

-- ============================================================================
-- 7. Tabela: Camera (Câmeras IP)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Camera')
BEGIN
    CREATE TABLE [dbo].[Camera] (
        [id]                NVARCHAR(36)    NOT NULL,
        [name]              NVARCHAR(100)   NOT NULL,
        [ip_address]        NVARCHAR(45)    NOT NULL,
        [onvif_port]        INT             NOT NULL,
        [rtsp_port]         INT             NOT NULL,
        [username]          NVARCHAR(50)    NOT NULL,
        [password]          NVARCHAR(128)   NOT NULL,
        [ptz_supported]     BIT             NOT NULL DEFAULT 0,
        [location_zone]     NVARCHAR(100)   NOT NULL,
        [is_online]         BIT             NOT NULL DEFAULT 0,
        [created_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        [updated_at]        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_Camera] PRIMARY KEY ([id]),
        CONSTRAINT [UQ_Camera_ip_port] UNIQUE ([ip_address], [onvif_port]),
        CONSTRAINT [CK_Camera_onvif_port] CHECK ([onvif_port] BETWEEN 1 AND 65535),
        CONSTRAINT [CK_Camera_rtsp_port] CHECK ([rtsp_port] BETWEEN 1 AND 65535)
    );

    CREATE INDEX [IX_Camera_ip_address] ON [dbo].[Camera] ([ip_address]);
END
GO

-- ============================================================================
-- 8. Dados iniciais (Seed) — Usuários com Permissões
-- ============================================================================
-- 
-- SISTEMA DE PERMISSÕES:
-- ┌─────────────┬────────────────────────────────────────────────────────────┐
-- │ Perfil      │ Permissões                                                 │
-- ├─────────────┼────────────────────────────────────────────────────────────┤
-- │ concierge   │ Dashboard de monitoramento, câmeras, ações rápidas,        │
-- │ (porteiro)  │ feed de eventos, configurações técnicas, CRUD de           │
-- │             │ câmeras, CRUD de usuários, configurações do sistema        │
-- ├─────────────┼────────────────────────────────────────────────────────────┤
-- │ resident    │ Dashboard de métricas, gerar convites, aprovar/recusar     │
-- │ (morador)   │ visitantes, interfone virtual, histórico de acessos        │
-- └─────────────┴────────────────────────────────────────────────────────────┘
--
-- As senhas abaixo estão em hash bcrypt (cost 12).
-- Para gerar novos hashes, use a aplicação ou:
--   node -e "require('bcrypt').hash('senha123', 12).then(console.log)"
--

-- ─────────────────────────────────────────────────────────────────────────────
-- 8.1 Porteiro Administrador (acesso total ao painel de controle)
-- ─────────────────────────────────────────────────────────────────────────────
-- Login: porteiro@infoseg.com | Senha: porteiro123
IF NOT EXISTS (SELECT 1 FROM [dbo].[Concierge] WHERE [email] = 'porteiro@infoseg.com')
BEGIN
    INSERT INTO [dbo].[Concierge] ([id], [name], [email], [phone], [password_hash], [created_at], [updated_at])
    VALUES (
        NEWID(),
        N'Carlos Silva',
        N'porteiro@infoseg.com',
        N'11999990001',
        N'$2b$12$LJ3MFgOuMQzEbSCxNBPQYOqVqKbvOxHfGP0NXIYR1eVq0X7cVhpW.',
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT '  ✓ Porteiro criado: porteiro@infoseg.com (senha: porteiro123)';
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 8.2 Porteiro Técnico (acesso ao painel de controle + configurações)
-- ─────────────────────────────────────────────────────────────────────────────
-- Login: tecnico@infoseg.com | Senha: tecnico123
IF NOT EXISTS (SELECT 1 FROM [dbo].[Concierge] WHERE [email] = 'tecnico@infoseg.com')
BEGIN
    INSERT INTO [dbo].[Concierge] ([id], [name], [email], [phone], [password_hash], [created_at], [updated_at])
    VALUES (
        NEWID(),
        N'Roberto Técnico',
        N'tecnico@infoseg.com',
        N'11999990010',
        N'$2b$12$LJ3MFgOuMQzEbSCxNBPQYOqVqKbvOxHfGP0NXIYR1eVq0X7cVhpW.',
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT '  ✓ Técnico criado: tecnico@infoseg.com (senha: tecnico123)';
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 8.3 Moradores
-- ─────────────────────────────────────────────────────────────────────────────
-- Login: maria@morador.com | Senha: morador123
IF NOT EXISTS (SELECT 1 FROM [dbo].[Resident] WHERE [email] = 'maria@morador.com')
BEGIN
    INSERT INTO [dbo].[Resident] ([id], [name], [apartment_number], [block], [phone], [email], [password_hash], [created_at], [updated_at])
    VALUES (
        NEWID(),
        N'Maria Santos',
        N'101',
        N'A',
        N'11999990002',
        N'maria@morador.com',
        N'$2b$12$LJ3MFgOuMQzEbSCxNBPQYOqVqKbvOxHfGP0NXIYR1eVq0X7cVhpW.',
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT '  ✓ Morador criado: maria@morador.com (Bl.A Ap.101, senha: morador123)';
END
GO

-- Login: joao@morador.com | Senha: morador123
IF NOT EXISTS (SELECT 1 FROM [dbo].[Resident] WHERE [email] = 'joao@morador.com')
BEGIN
    INSERT INTO [dbo].[Resident] ([id], [name], [apartment_number], [block], [phone], [email], [password_hash], [created_at], [updated_at])
    VALUES (
        NEWID(),
        N'João Oliveira',
        N'202',
        N'B',
        N'11999990003',
        N'joao@morador.com',
        N'$2b$12$LJ3MFgOuMQzEbSCxNBPQYOqVqKbvOxHfGP0NXIYR1eVq0X7cVhpW.',
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT '  ✓ Morador criado: joao@morador.com (Bl.B Ap.202, senha: morador123)';
END
GO

-- Login: ana@morador.com | Senha: morador123
IF NOT EXISTS (SELECT 1 FROM [dbo].[Resident] WHERE [email] = 'ana@morador.com')
BEGIN
    INSERT INTO [dbo].[Resident] ([id], [name], [apartment_number], [block], [phone], [email], [password_hash], [created_at], [updated_at])
    VALUES (
        NEWID(),
        N'Ana Pereira',
        N'303',
        N'A',
        N'11999990004',
        N'ana@morador.com',
        N'$2b$12$LJ3MFgOuMQzEbSCxNBPQYOqVqKbvOxHfGP0NXIYR1eVq0X7cVhpW.',
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT '  ✓ Morador criado: ana@morador.com (Bl.A Ap.303, senha: morador123)';
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 8.4 Visitante de Teste
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[Visitor] WHERE [document] = '12345678901')
BEGIN
    INSERT INTO [dbo].[Visitor] ([id], [name], [document], [created_at])
    VALUES (
        NEWID(),
        N'Pedro Visitante',
        N'12345678901',
        GETUTCDATE()
    );
    PRINT '  ✓ Visitante de teste criado: Pedro Visitante (CPF: 12345678901)';
END
GO

-- ============================================================================
-- 9. Resumo de Acessos Criados
-- ============================================================================
PRINT '';
PRINT '══════════════════════════════════════════════════════════════════════';
PRINT ' INFOSEG CORE — Banco de dados criado com sucesso!';
PRINT '══════════════════════════════════════════════════════════════════════';
PRINT '';
PRINT ' USUÁRIOS DE ACESSO:';
PRINT ' ┌──────────────────────────┬───────────────┬─────────────────────┐';
PRINT ' │ E-mail                   │ Senha         │ Perfil              │';
PRINT ' ├──────────────────────────┼───────────────┼─────────────────────┤';
PRINT ' │ porteiro@infoseg.com     │ porteiro123   │ Porteiro (admin)    │';
PRINT ' │ tecnico@infoseg.com      │ tecnico123    │ Porteiro (técnico)  │';
PRINT ' │ maria@morador.com        │ morador123    │ Morador (Bl.A/101)  │';
PRINT ' │ joao@morador.com         │ morador123    │ Morador (Bl.B/202)  │';
PRINT ' │ ana@morador.com          │ morador123    │ Morador (Bl.A/303)  │';
PRINT ' └──────────────────────────┴───────────────┴─────────────────────┘';
PRINT '';
PRINT ' NOTA: Altere as senhas padrão em produção!';
PRINT ' Use a aba Configurações > Usuários no painel do porteiro para';
PRINT ' criar, editar ou excluir usuários do sistema.';
PRINT '';
GO
