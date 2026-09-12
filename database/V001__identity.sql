-- ==========================================================
-- V001__identity.sql
-- Storage Management System - Identity & Access Management Schema
-- ==========================================================

-- 1. ROLES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL
    );
END;

-- 2. PERMISSIONS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
BEGIN
    CREATE TABLE permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL
    );
END;

-- 3. ROLE_PERMISSIONS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role_permissions')
BEGIN
    CREATE TABLE role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );
END;

-- 4. USERS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(255) NOT NULL,
        phone_number NVARCHAR(50) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by NVARCHAR(100) NULL,
        updated_by NVARCHAR(100) NULL,
        version BIGINT NOT NULL DEFAULT 0
    );
END;

-- 5. USER_ROLES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
        user_id UNIQUEIDENTIFIER NOT NULL,
        role_id INT NOT NULL,
        PRIMARY KEY (user_id, role_id),
        CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
END;

-- SEED ROLES
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CUSTOMER')
    INSERT INTO roles (name, description) VALUES ('CUSTOMER', 'Khách hàng sử dụng dịch vụ lưu kho');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'FACILITY_STAFF')
    INSERT INTO roles (name, description) VALUES ('FACILITY_STAFF', 'Nhân viên lễ tân / CSKH tại cơ sở kho');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'FACILITY_MANAGER')
    INSERT INTO roles (name, description) VALUES ('FACILITY_MANAGER', 'Quản lý cơ sở kho');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'BUSINESS_OPERATIONS_MANAGER')
    INSERT INTO roles (name, description) VALUES ('BUSINESS_OPERATIONS_MANAGER', 'Quản lý kinh doanh và vận hành toàn hệ thống');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SYSTEM_ADMIN')
    INSERT INTO roles (name, description) VALUES ('SYSTEM_ADMIN', 'Quản trị viên kỹ thuật toàn hệ thống');

-- SEED PERMISSIONS
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'USER_VIEW')
    INSERT INTO permissions (name, description) VALUES ('USER_VIEW', 'Xem danh sách và thông tin người dùng');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'USER_MANAGE')
    INSERT INTO permissions (name, description) VALUES ('USER_MANAGE', 'Quản lý, phân quyền người dùng');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'FACILITY_VIEW')
    INSERT INTO permissions (name, description) VALUES ('FACILITY_VIEW', 'Xem thông tin cơ sở kho');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'FACILITY_MANAGE')
    INSERT INTO permissions (name, description) VALUES ('FACILITY_MANAGE', 'Quản lý cơ sở kho và phân bổ');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'INVENTORY_VIEW')
    INSERT INTO permissions (name, description) VALUES ('INVENTORY_VIEW', 'Xem danh mục đơn vị kho');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'INVENTORY_MANAGE')
    INSERT INTO permissions (name, description) VALUES ('INVENTORY_MANAGE', 'Quản lý kho và cập nhật trạng thái');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'RESERVATION_VIEW')
    INSERT INTO permissions (name, description) VALUES ('RESERVATION_VIEW', 'Xem thông tin đặt chỗ');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'RESERVATION_MANAGE')
    INSERT INTO permissions (name, description) VALUES ('RESERVATION_MANAGE', 'Xử lý đặt chỗ');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'RENTAL_VIEW')
    INSERT INTO permissions (name, description) VALUES ('RENTAL_VIEW', 'Xem hợp đồng thuê kho');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'RENTAL_MANAGE')
    INSERT INTO permissions (name, description) VALUES ('RENTAL_MANAGE', 'Xử lý check-in / check-out / hợp đồng thuê');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'BILLING_VIEW')
    INSERT INTO permissions (name, description) VALUES ('BILLING_VIEW', 'Xem hóa đơn và giao dịch');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'BILLING_MANAGE')
    INSERT INTO permissions (name, description) VALUES ('BILLING_MANAGE', 'Quản lý chính sách giá và hóa đơn');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'REPORT_VIEW')
    INSERT INTO permissions (name, description) VALUES ('REPORT_VIEW', 'Xem báo cáo tài chính và lấp đầy');
IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'AUDIT_VIEW')
    INSERT INTO permissions (name, description) VALUES ('AUDIT_VIEW', 'Xem nhật ký hoạt động hệ thống');
