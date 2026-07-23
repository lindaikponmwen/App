<?php
/**
 * Database Seeding Script
 *
 * This script creates demo users with properly hashed passwords.
 * Run this file to populate the database with test data.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';

try {
    $db = getDatabase();

    echo "Seeding database with demo users...\n\n";

    // Demo users data
    $users = [
        [
            'username' => 'sarah',
            'email' => 'sarah.chen@research.com',
            'password' => 'command12',
            'name' => 'Dr. Sarah Chen',
            'initials' => 'SC',
            'role' => 'owner',
            'department' => 'Clinical Pharmacology',
            'title' => 'Principal Investigator',
            'phone' => '(629) 555-0123',
            'address' => '990 Market Street, Suite 200, San Francisco CA 94102',
            'date_of_birth' => '1988-09-26',
            'hire_date' => '2023-01-05',
            'permissions' => ['read', 'write', 'delete', 'manage_projects', 'manage_team', 'export']
        ],
        [
            'username' => 'william',
            'email' => 'william.hane@research.com',
            'password' => 'command12',
            'name' => 'Dr. William Hane',
            'initials' => 'WH',
            'role' => 'administrator',
            'department' => 'Information Technology',
            'title' => 'System Administrator',
            'phone' => '(629) 555-0124',
            'address' => '1200 Tech Drive, Suite 100, San Francisco CA 94105',
            'date_of_birth' => '1985-03-15',
            'hire_date' => '2022-06-01',
            'permissions' => ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_system', 'analytics', 'compliance']
        ],
        [
            'username' => 'curtis',
            'email' => 'curtis.lee@research.com',
            'password' => 'command12',
            'name' => 'Dr. Curtis Lee',
            'initials' => 'CL',
            'role' => 'member',
            'department' => 'Clinical Pharmacology',
            'title' => 'Research Associate',
            'phone' => '(629) 555-0125',
            'address' => '456 Research Blvd, Apt 12, San Francisco CA 94103',
            'date_of_birth' => '1992-11-08',
            'hire_date' => '2024-03-15',
            'permissions' => ['read', 'write']
        ]
    ];

    foreach ($users as $userData) {
        $permissions = $userData['permissions'];
        unset($userData['permissions']);

        // Hash password
        $passwordHash = PasswordHash::hash($userData['password']);
        unset($userData['password']);
        $userData['password_hash'] = $passwordHash;

        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$userData['username'], $userData['email']]);
        $existingUser = $stmt->fetch();

        if ($existingUser) {
            echo "User {$userData['username']} already exists, updating...\n";
            $userId = $existingUser['id'];

            // Update user
            $stmt = $db->prepare("
                UPDATE users SET
                    email = ?,
                    password_hash = ?,
                    name = ?,
                    initials = ?,
                    role = ?,
                    department = ?,
                    title = ?,
                    phone = ?,
                    address = ?,
                    date_of_birth = ?,
                    hire_date = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $userData['email'],
                $userData['password_hash'],
                $userData['name'],
                $userData['initials'],
                $userData['role'],
                $userData['department'],
                $userData['title'],
                $userData['phone'],
                $userData['address'],
                $userData['date_of_birth'],
                $userData['hire_date'],
                $userId
            ]);
        } else {
            echo "Creating user {$userData['username']}...\n";

            // Insert user
            $stmt = $db->prepare("
                INSERT INTO users (username, email, password_hash, name, initials, role, department, title, phone, address, date_of_birth, hire_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $userData['username'],
                $userData['email'],
                $userData['password_hash'],
                $userData['name'],
                $userData['initials'],
                $userData['role'],
                $userData['department'],
                $userData['title'],
                $userData['phone'],
                $userData['address'],
                $userData['date_of_birth'],
                $userData['hire_date']
            ]);

            $userId = $db->lastInsertId();
        }

        // Delete existing permissions
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Insert permissions
        $stmt = $db->prepare("INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)");
        foreach ($permissions as $permission) {
            $stmt->execute([$userId, $permission]);
        }

        echo "User {$userData['username']} seeded successfully with " . count($permissions) . " permissions.\n\n";
    }

    echo "Database seeding completed successfully!\n";

} catch (PDOException $e) {
    echo "Error seeding database: " . $e->getMessage() . "\n";
    exit(1);
}
