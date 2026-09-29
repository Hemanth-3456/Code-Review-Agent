/**
 * Sample code snippets for all 13 supported languages.
 * Each example includes authentic code with realistic reviewable issues
 * (e.g., security, edge cases, performance, bad practices) to demonstrate the agent.
 */

export const SAMPLE_CODES = {
  JavaScript: `// User authentication and session retrieval
async function getUserProfile(userId, req) {
  // Vulnerability: No input validation or sanitization
  const query = "SELECT id, username, password_hash, email, role FROM users WHERE id = '" + userId + "'";
  
  try {
    const user = await database.query(query);
    
    // Logic bug: user might be empty/null, causes crash
    if (user.password_hash) {
      delete user.password_hash;
    }
    
    // Performance: Reading user preferences one-by-one synchronously in loop
    const prefs = [];
    for (let i = 0; i < user.preferenceIds.length; i++) {
      const pref = await database.query("SELECT * FROM preferences WHERE id = " + user.preferenceIds[i]);
      prefs.push(pref);
    }
    user.preferences = prefs;
    
    return user;
  } catch (err) {
    // Bad practice: swallowed error, returns empty object silently
    console.log(err);
    return {};
  }
}`,

  TypeScript: `interface UserData {
  id: string;
  name: string;
  role?: string;
}

// Insecure permissions check and excessive type casting
export class AuthService {
  private usersCache: any = {}; // Bad practice: using 'any' instead of strict typing

  public async checkAdminAccess(token: string): Promise<boolean> {
    // Security: insecure JWT decoding without secret verification
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Bug: comparing string to undefined without checking
    if (payload.role === 'admin' || payload.isAdmin == true) {
      return true;
    }
    return false;
  }

  // Memory leak: Unbounded cache without eviction strategy
  public cacheUser(user: UserData): void {
    this.usersCache[user.id] = {
      ...user,
      cachedAt: new Date().getTime()
    };
  }
}`,

  Python: `import sqlite3
import hashlib

def authenticate_and_update(user_id, raw_password, new_email):
    # Security: Insecure MD5 hashing algorithm
    hashed_password = hashlib.md5(raw_password.encode()).hexdigest()
    
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    
    # Security: SQL Injection via string formatting
    query = f"SELECT * FROM users WHERE id = '{user_id}' AND password = '{hashed_password}'"
    cursor.execute(query)
    record = cursor.fetchone()
    
    # Bug: resource leak, connection and cursor not closed if exception occurs
    if record:
        update_query = f"UPDATE users SET email = '{new_email}' WHERE id = '{user_id}'"
        cursor.execute(update_query)
        conn.commit()
        return True
    
    conn.close()
    return False`,

  Java: `package com.example.service;

import java.io.*;
import java.sql.*;

public class ReportGenerator {
    // Bad practice: storing database credentials in static plain text
    private static final String DB_URL = "jdbc:mysql://localhost:3306/enterprise";
    private static final String USER = "root";
    private static final String PASS = "password123";

    public void exportUserData(String userRole, String outputFilePath) {
        Connection conn = null;
        Statement stmt = null;
        try {
            conn = DriverManager.getConnection(DB_URL, USER, PASS);
            stmt = conn.createStatement();

            // Security: SQL injection via string concatenation
            String sql = "SELECT username, ssn, salary FROM employees WHERE role = '" + userRole + "'";
            ResultSet rs = stmt.executeQuery(sql);

            // Bug / Resource Leak: FileWriter unbuffered and streams not closed with try-with-resources
            FileWriter writer = new FileWriter(outputFilePath);
            while (rs.next()) {
                writer.write(rs.getString("username") + "," + rs.getString("ssn") + "\n");
            }
            writer.flush();
        } catch (Exception e) {
            // Bad practice: generic catch and printStackTrace without proper logging
            e.printStackTrace();
        }
    }
}`,

  C: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

void process_request(char *input) {
    // Security: Classic stack buffer overflow vulnerability
    char buffer[64];
    strcpy(buffer, input);

    printf("Processing: %s\\n", buffer);

    // Bug: Memory leak and potential double-free
    int *data = (int *)malloc(100 * sizeof(int));
    if (data == NULL) return;

    for (int i = 0; i <= 100; i++) { // Bug: Off-by-one error (buffer write out of bounds)
        data[i] = i * 2;
    }

    free(data);
    // free(data); // dangling pointer left un-nullified
}

int main(int argc, char *argv[]) {
    if (argc > 1) {
        process_request(argv[1]);
    }
    return 0;
}`,

  "C++": `#include <iostream>
#include <vector>
#include <memory>
#include <string>

class FileManager {
private:
    std::string* activeHandle;

public:
    FileManager(const std::string& filename) {
        activeHandle = new std::string(filename);
    }

    // Bug: Missing custom copy constructor / assignment operator (Rule of 3/5 violation)
    // Leads to double-free on object copy
    ~FileManager() {
        delete activeHandle;
    }

    void processTokens(const std::vector<std::string>& tokens) {
        // Performance: passing and copying std::string by value in loop instead of const ref
        for (auto token : tokens) {
            std::cout << *activeHandle << ": " << token << std::endl;
        }
    }
};`,

  "C#": `using System;
using System.Data.SqlClient;
using System.IO;

namespace Company.Services
{
    public class OrderProcessor
    {
        private string connectionString = "Server=myServerAddress;Database=myDataBase;Uid=myUsername;Pwd=myPassword;";

        public decimal CalculateDiscount(string customerId, decimal totalAmount)
        {
            // Security: SQL Injection vulnerability
            string sql = "SELECT Tier FROM Customers WHERE Id = '" + customerId + "'";

            // Bug: SqlConnection and SqlCommand not enclosed in 'using' block (unreleased connections)
            SqlConnection conn = new SqlConnection(connectionString);
            conn.Open();
            SqlCommand cmd = new SqlCommand(sql, conn);
            object tier = cmd.ExecuteScalar();

            // Bug: NullReferenceException risk if customer is not found
            if (tier.ToString() == "VIP")
            {
                return totalAmount * 0.20m;
            }
            return 0m;
        }
    }
}`,

  Go: `package main

import (
	"database/sql"
	"fmt"
	"net/http"
	_ "github.com/lib/pq"
)

var db *sql.DB

// Bug: Concurrency data race on shared global counter
var requestCount int

func handler(w http.ResponseWriter, r *http.Request) {
	requestCount++ // Data race: unsynchronized access across goroutines

	id := r.URL.Query().Get("id")

	// Security: SQL Injection via formatted string
	query := fmt.Sprintf("SELECT email FROM users WHERE id = '%s'", id)
	row := db.QueryRow(query)

	var email string
	err := row.Scan(&email)
	if err != nil {
		// Bug: Leaking internal database error message to client
		http.Error(w, err.Error(), 500)
		return
	}

	fmt.Fprintf(w, "User email: %s", email)
}
`,

  Rust: `use std::fs::File;
use std::io::{self, Read};

// Anti-pattern: Excessive unwraps and potential panic in production
pub fn read_config(path: &str) -> String {
    // Bug: unwrap() causes thread panic if file is missing or unreadable
    let mut file = File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    
    // Performance: Unnecessary string clones in a loop
    let lines: Vec<&str> = contents.lines().collect();
    let mut result = String::new();
    for line in lines {
        result.push_str(&line.to_string().clone());
        result.push('\\n');
    }

    result
}
`,

  PHP: `<?php
// User registration script
session_start();

$user_id = $_GET['id']; // Security: Unsanitized superglobal

// Security: Direct SQL Injection without PDO prepared statements
$conn = mysqli_connect("localhost", "root", "password", "test_db");
$query = "SELECT * FROM accounts WHERE id = " . $user_id;
$result = mysqli_query($conn, $query);

$row = mysqli_fetch_assoc($result);

// Security: Cross-Site Scripting (XSS) vulnerability
echo "<h1>Welcome back, " . $row['display_name'] . "!</h1>";

// Bug: Weak password generation using rand() instead of random_bytes()
$temporary_pin = rand(1000, 9999);
echo "<p>Your temporary pin is: " . $temporary_pin . "</p>";
?>`,

  HTML: `<!DOCTYPE html>
<html>
<head>
  <title>User Portal</title>
  <!-- Security: Missing viewport meta tag, missing charset -->
</head>
<body>
  <!-- Accessibility: Missing main, nav, header landmarks -->
  <div class="header">
    <!-- Accessibility: img tag missing alt attribute -->
    <img src="/logo.png">
    <span>Company Portal</span>
  </div>

  <div class="content">
    <!-- Security: Insecure form submission over plain HTTP -->
    <!-- Accessibility: form inputs lack associated <label> elements -->
    <form action="http://api.company.com/login" method="POST">
      <input type="text" name="user" placeholder="Username">
      <input type="password" name="pass" placeholder="Password">
      <!-- Bug: input type button without click handler doesn't submit -->
      <input type="button" value="Submit">
    </form>
    
    <!-- Security: target="_blank" without rel="noopener noreferrer" -->
    <a href="http://partner-site.com" target="_blank">Partner Deals</a>
  </div>
</body>
</html>`,

  CSS: `/* Global styles and layout */
* {
  /* Performance / Accessibility: removing focus outline universally */
  outline: none !important;
}

body {
  /* Bug: Using fixed pixel width that breaks mobile responsive design */
  width: 1200px;
  font-size: 11px; /* Bad practice: too small, fails accessibility */
  color: #888888; /* Bad practice: insufficient contrast ratio on light background */
  background-color: #ffffff;
}

.button-primary {
  background: red;
  /* Bad practice: excessive !important tags preventing cascade */
  color: #fff !important;
  font-size: 14px !important;
  padding: 10px 20px !important;
  /* Performance: animating expensive properties like left/top instead of transform */
  transition: top 0.5s ease;
  position: relative;
}

.button-primary:hover {
  top: -5px;
}`,

  SQL: `-- Retrieve active customer accounts and transactions
SELECT 
  c.id,
  c.full_name,
  c.credit_card_number, -- Security: Storing and selecting raw plaintext credit card numbers
  t.amount,
  t.transaction_date
FROM customers c
-- Performance: Unindexed Cartesian cross product or bad join
LEFT JOIN transactions t ON 1=1 
WHERE c.status = 'ACTIVE'
  -- Performance: Wildcard at beginning of LIKE query prevents index usage
  AND c.email LIKE '%@gmail.com'
  -- Bug: OR clause without grouping parentheses causes logic precedence bug
  OR c.is_admin = 1
ORDER BY t.transaction_date DESC;`
};

export const LANGUAGE_OPTIONS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'HTML',
  'CSS',
  'SQL'
];
